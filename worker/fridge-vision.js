// Cloudflare Worker: Gemini API 키를 서버 쪽에 숨기고, 사이트에서 온 사진을 대신 Gemini에 보내 준다.
// 대시보드의 Worker 'Edit code'에 이 파일 내용을 그대로 붙여 넣는다.
// 필요한 설정 (Settings → Variables and Secrets):
//   GEMINI_API_KEY  (Secret)  AI Studio에서 발급한 키
//   MODEL           (Text)    사용할 Gemini 모델 이름
const ALLOWED = ["https://snowinsummer1.github.io", "http://localhost:8000"];
const PROMPT = `이 냉장고 또는 식재료 사진을 분석하여 식별 가능한 식재료 이름만 추출해줘.
반드시 한국어 단어로 이루어진 JSON 배열 형태만 응답해줘.
예시: ["계란", "양파", "대파", "두부", "돼지고기"]`;

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
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!ok || request.method !== "POST") return new Response("forbidden", { status: 403, headers: cors });

    let image;
    try { ({ image } = await request.json()); }
    catch { return new Response("bad request", { status: 400, headers: cors }); }
    if (typeof image !== "string" || image.length > 2_000_000)
      return new Response("image too large", { status: 413, headers: cors });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
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
