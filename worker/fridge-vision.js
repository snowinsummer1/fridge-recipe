// Cloudflare Worker: Gemini API 키를 서버 쪽에 숨기고, 사이트에서 온 사진을 대신 Gemini에 보내 준다.
// 대시보드의 Worker 'Edit code'에 이 파일 내용을 그대로 붙여 넣는다.
//
// 필요한 설정 (Worker → Settings)
//   Variables and Secrets
//     GEMINI_API_KEY  (Secret)  AI Studio에서 발급한 키
//     MODEL           (Text)    사용할 Gemini 모델 이름 (예: gemini-3.5-flash-lite)
//     PER_MIN         (Text, 선택)  한 사람이 1분에 보낼 수 있는 횟수   기본 5
//     PER_IP_DAY      (Text, 선택)  한 사람이 하루에 보낼 수 있는 횟수   기본 30
//     GLOBAL_DAY      (Text, 선택)  사이트 전체가 하루에 보낼 수 있는 횟수 기본 300
//   Bindings
//     LIMITS          (KV namespace)  하루 횟수를 세는 저장소
//
// 하루는 한국 시간 0시에 바뀐다. 횟수는 Gemini로 실제 보낸 요청만 센다.
const ALLOWED = ["https://snowinsummer1.github.io", "http://localhost:8000"];
const PROMPT = `이 냉장고 또는 식재료 사진을 분석하여 식별 가능한 식재료 이름만 추출해줘.
반드시 한국어 단어로 이루어진 JSON 배열 형태만 응답해줘.
예시: ["계란", "양파", "대파", "두부", "돼지고기"]`;

const DAY_TTL = 172800;   // 하루치 카운터는 이틀 뒤 자동 삭제
const burst = new Map();  // 1분 제한용(Worker 인스턴스 메모리). 인스턴스가 바뀌면 초기화되므로 '대략적인' 제한이다.

const num = (v, d) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d);

// IP는 그대로 저장하지 않고 해시의 앞부분만 쓴다
async function ipId(ip) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fridge-vision:" + ip));
  return [...new Uint8Array(d)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function burstLimited(id, limit) {
  const now = Date.now();
  const recent = (burst.get(id) || []).filter((t) => now - t < 60000);
  const limited = recent.length >= limit;
  if (!limited) recent.push(now);
  burst.set(id, recent);
  if (burst.size > 5000) burst.clear();
  return limited;
}

// 한도에 닿았으면 false, 아니면 1 올리고 true
async function bump(kv, key, limit) {
  const n = parseInt((await kv.get(key)) || "0", 10);
  if (n >= limit) return false;
  await kv.put(key, String(n + 1), { expirationTtl: DAY_TTL });
  return true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const ok = ALLOWED.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": ok ? origin : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const json = (status, body, extra = {}) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", ...extra } });
    const fail = (status, message, extra) => json(status, { error: { message } }, extra);

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!ok || request.method !== "POST") return new Response("forbidden", { status: 403, headers: cors });

    let image;
    try { ({ image } = await request.json()); }
    catch { return new Response("bad request", { status: 400, headers: cors }); }
    if (typeof image !== "string" || image.length > 2_000_000)
      return new Response("image too large", { status: 413, headers: cors });

    // 복사할 때 섞이기 쉬운 앞뒤 공백·줄바꿈은 제거하고, 설정이 빠졌으면 Gemini 오류 대신 원인을 바로 알려 준다
    const key = (env.GEMINI_API_KEY || "").trim();
    const model = (env.MODEL || "").trim();
    const missing = [!key && "GEMINI_API_KEY", !model && "MODEL", !env.LIMITS && "LIMITS(KV)"].filter(Boolean);
    if (missing.length) return fail(500, `서버 설정이 빠졌어요: ${missing.join(", ")}`);

    // ---- 사용 횟수 제한 ----
    const id = await ipId(request.headers.get("CF-Connecting-IP") || "unknown");
    if (burstLimited(id, num(env.PER_MIN, 5)))
      return fail(429, "잠깐 쉬었다 다시 해 주세요. 1분에 보낼 수 있는 횟수를 넘었어요.", { "Retry-After": "60" });

    const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);   // 한국 날짜
    try {
      if (!(await bump(env.LIMITS, `ip:${id}:${day}`, num(env.PER_IP_DAY, 30))))
        return fail(429, "오늘 사진 인식을 너무 많이 사용했어요. 내일 다시 이용해 주세요.");
      if (!(await bump(env.LIMITS, `all:${day}`, num(env.GLOBAL_DAY, 300))))
        return fail(429, "오늘 사진 인식 이용량이 모두 찼어요. 내일 다시 이용해 주세요.");
    } catch {
      return fail(503, "지금은 사진 인식을 사용할 수 없어요. 잠시 뒤 다시 시도해 주세요.");   // KV 저장 한도 초과 등
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: "image/jpeg", data: image } }, { text: PROMPT }] }],
          generationConfig: { response_mime_type: "application/json" },
        }),
      });
    return new Response(await res.text(), {
      status: res.status, headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
