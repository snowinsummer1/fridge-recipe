"use strict";

const PAGE = 24;
const $ = (id) => document.getElementById(id);

const state = {
  recipes: [], ingredients: [], aliases: {}, staples: { basic: [], common: [] },
  mine: [],            // 사용자가 입력한 재료 (표준 이름)
  shown: PAGE, results: [],
};

/* ---------- 작은 DOM 헬퍼 (데이터는 항상 textContent로 넣는다) ---------- */
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return el;
}

function store(key, val) {
  try { if (val === undefined) return JSON.parse(localStorage.getItem(key)); localStorage.setItem(key, JSON.stringify(val)); }
  catch { return null; }
}

/* ---------- 데이터 로드 ---------- */
async function load() {
  try {
    const [recipes, ingredients, aliases, staples] = await Promise.all(
      ["recipes", "ingredients", "aliases", "staples"].map((n) =>
        fetch(`data/${n}.json`).then((r) => { if (!r.ok) throw new Error(n); return r.json(); })));
    Object.assign(state, { recipes, ingredients, aliases, staples });
  } catch (e) {
    $("summary").textContent = "데이터를 불러오지 못했어요. 파일을 직접 열지 말고 serve.bat 으로 실행해 주세요.";
    return;
  }
  state.names = new Set(state.ingredients.map((i) => i.name));
  const cats = [...new Set(state.recipes.map((r) => r.category).filter(Boolean))];
  for (const c of cats) $("optCat").append(h("option", { value: c }, c));

  const saved = store("mine");
  if (Array.isArray(saved)) state.mine = saved.filter((n) => state.names.has(n));
  const opts = store("opts") || {};
  $("optCommon").checked = !!opts.common;
  if (opts.mode) $("optMode").value = opts.mode;
  if (opts.sort) $("optSort").value = opts.sort;
  if (opts.missing) $("optMissing").value = opts.missing;
  if (opts.cat) $("optCat").value = opts.cat;

  if ($("statCount")) $("statCount").textContent = state.recipes.length.toLocaleString("ko-KR");
  renderQuick();
  update();
  renderRec(false);
  renderPreview();
}

/* ---------- 메인 화면: 오늘의 추천 ---------- */
function seededRandom(seed) {                      // mulberry32
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 기본은 날짜가 시드라 하루 동안 같은 3개가 나오고, '다시 뽑기'는 완전한 무작위다. 사진 있는 레시피만 후보.
function renderRec(reroll) {
  const pool = state.recipes.filter((r) => r.img);
  const d = new Date();
  const rand = reroll ? Math.random : seededRandom(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
  const picks = new Set();
  while (picks.size < Math.min(3, pool.length)) picks.add(Math.floor(rand() * pool.length));
  $("recGrid").replaceChildren(...[...picks].map((i) => card({ r: pool[i], have: [], missing: [], staples: [] }, true)));
}

// 홈 미리보기 창: 실제 레시피 데이터(사진·이름·추가 재료 수)로 채운다. 실패하면 HTML의 기본 내용이 남는다.
function renderPreview() {
  const box = $("pvList");
  if (!box) return;
  const mine = new Set(["달걀", "두부"]);
  const basic = new Set(state.staples.basic);
  const rows = ["982", "932", "2958"].map((id) => state.recipes.find((r) => r.id === id)).filter((r) => r && r.img);
  if (rows.length < 3) return;
  box.replaceChildren(...rows.map((r) => {
    const miss = r.ingredients.filter((i) => !basic.has(i) && !mine.has(i)).length;
    return h("div", { class: "pv-row" },
      h("div", { class: "pv-thumb", "data-e": "🍳" },
        h("img", { src: r.img, alt: "", loading: "lazy", onerror: (e) => e.target.remove() })),
      h("div", {}, h("b", {}, r.name), h("small", {}, metaText(r))),
      h("em", { class: miss ? "" : "ok" }, miss ? `추가 ${miss}개` : "바로 가능"));
  }));
}

/* ---------- 화면 전환 (메인 ↔ 요리하러 가기) ---------- */
function route() {
  const inApp = location.hash === "#cook";
  $("home").hidden = inApp;
  $("app").hidden = !inApp;
  document.body.dataset.page = inApp ? "cook" : "home";   // 상단 메뉴의 현재 위치 표시용
  const anchor = !inApp && location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
  if (anchor) anchor.scrollIntoView({ behavior: "smooth" });
  else window.scrollTo(0, 0);
}

/* ---------- 매칭 ---------- */
function assumedStaples() {
  const set = new Set(state.staples.basic);
  if ($("optCommon").checked) state.staples.common.forEach((s) => set.add(s));
  state.mine.forEach((m) => set.delete(m));   // 직접 입력한 재료는 '가정'이 아니라 실제 보유로 센다
  return set;
}

function match() {
  const assumed = assumedStaples();
  const mine = new Set(state.mine);
  const maxMissing = Number($("optMissing").value);
  const cat = $("optCat").value;
  const all = $("optMode").value === "all";
  const out = [];
  for (const r of state.recipes) {
    if (cat && r.category !== cat) continue;
    if (all && !state.mine.every((m) => r.ingredients.includes(m))) continue;   // 입력한 재료는 모두 들어가야 한다
    const need = r.ingredients.filter((i) => !assumed.has(i));
    const have = need.filter((i) => mine.has(i));
    if (!all && !have.length) continue;                   // 내 재료를 하나도 안 쓰는 요리는 제외
    const missing = need.filter((i) => !mine.has(i));
    if (missing.length > maxMissing) continue;
    out.push({ r, have, missing, staples: r.ingredients.filter((i) => assumed.has(i)) });
  }
  const total = (m) => m.have.length + m.missing.length;
  if (!all && $("optSort").value === "have") {
    // 내 재료를 많이 쓰는 순 → 부족한 재료가 적은 순 → 필요한 재료가 적은 순
    out.sort((a, b) =>
      b.have.length - a.have.length || a.missing.length - b.missing.length || total(a) - total(b));
  } else {
    // 부족한 재료가 적은 순 → 내 재료를 많이 쓰는 순 → 필요한 재료가 적은 순
    out.sort((a, b) =>
      a.missing.length - b.missing.length || b.have.length - a.have.length || total(a) - total(b));
  }
  return out;
}

/* ---------- 렌더링 ---------- */
function update(resetPage = true) {
  if (resetPage) state.shown = PAGE;
  store("mine", state.mine);
  store("opts", { common: $("optCommon").checked, mode: $("optMode").value, sort: $("optSort").value, missing: $("optMissing").value, cat: $("optCat").value });
  $("sortOpt").hidden = $("optMode").value !== "any";   // 정렬 선택은 '하나라도 포함'일 때만
  renderChips();
  renderQuick();

  const grid = $("grid");
  grid.replaceChildren();
  if (!state.mine.length) {
    $("summary").textContent = "";
    grid.append(h("p", { class: "empty" }, "위에 재료를 하나 이상 입력해 보세요."));
    $("more").hidden = true;
    return;
  }
  state.results = match();
  const n = state.results.length;
  const all = $("optMode").value === "all";
  const order = !all && $("optSort").value === "have" ? "내 재료를 많이 쓰는" : "추가로 필요한 재료가 적은";
  $("summary").textContent = n
    ? `${all ? "입력한 재료를 모두 쓰는 요리" : "요리"} ${n}개를 찾았어요. ${order} 순서예요.`
    : all
      ? "입력한 재료를 모두 쓰는 요리가 없어요. 재료를 하나 줄이거나, ‘하나라도 포함’으로 바꾸거나, ‘추가 재료’ 제한을 늘려 보세요."
      : "조건에 맞는 요리가 없어요. ‘추가 재료’ 제한을 늘려 보세요.";
  for (const m of state.results.slice(0, state.shown)) grid.append(card(m));
  $("more").hidden = state.shown >= n;
}

function metaText(r) {
  // API 레시피는 시간 정보가 없어 추정값(minutesEst)이라 '약'을 붙인다
  return [r.category, r.method, r.minutes ? `${r.minutesEst ? "약 " : ""}${r.minutes}분` : null].filter(Boolean).join(" · ");
}

// plain=true: 재료 매칭과 무관한 카드(오늘의 추천) — '추가 N개' 배지를 달지 않는다
function card({ r, have, missing, staples }, plain = false) {
  const badge = plain ? null : missing.length
    ? h("span", { class: "badge" }, `추가 ${missing.length}개`)
    : h("span", { class: "badge zero" }, "바로 가능");
  const img = r.img ? h("img", { src: r.img, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }) : null;
  return h("button", { class: "card", onclick: () => openDetail(r, { have, missing, staples, plain }) },
    h("div", { class: "thumb" }, img || h("div", { class: "ph" }, "사진 준비중"), badge),
    h("div", { class: "cbody" },
      h("h3", {}, r.name),
      h("div", { class: "meta" }, metaText(r)),
      h("div", { class: "tags" },
        missing.map((i) => h("span", { class: "tag miss" }, `+ ${i}`)),
        have.map((i) => h("span", { class: "tag have" }, i)))));
}

function renderChips() {
  $("chips").replaceChildren(...state.mine.map((n) =>
    h("span", { class: "chip" }, n,
      h("button", { type: "button", "aria-label": `${n} 삭제`, onclick: () => removeIng(n) }, "×"))),
    state.mine.length
      ? h("button", { type: "button", class: "clearall", onclick: clearIngs }, "전체 삭제")
      : h("span", { class: "nochip" }, "재료 없음"));
}

function renderQuick() {
  const box = $("quick");
  if (!box.dataset.ready) {
    const skip = new Set([...state.staples.basic, ...state.staples.common]);
    state.quick = state.ingredients.filter((i) => !skip.has(i.name)).slice(0, 24).map((i) => i.name);
    box.dataset.ready = "1";
  }
  box.replaceChildren(h("span", { class: "meta" }, "자주 쓰는 재료:"),
    ...state.quick.map((n) => h("button", { type: "button", disabled: state.mine.includes(n), onclick: () => addIng(n) }, n)));
}

function openDetail(r, m) {
  const mineSet = new Set(state.mine);
  const nut = r.nutrition || {};
  const nutri = [["열량", nut.kcal, "kcal"], ["탄수화물", nut.carb, "g"], ["단백질", nut.protein, "g"],
                 ["지방", nut.fat, "g"], ["나트륨", nut.sodium, "mg"]].filter(([, v]) => v !== null && v !== undefined);
  const body = h("article", {},
    h("div", { class: "dhead" },
      h("button", { class: "close", "aria-label": "닫기", onclick: () => $("dlg").close() }, "✕"),
      r.img ? h("img", { src: r.img, alt: r.name }) : null),
    h("div", { class: "dbody" },
      h("h2", {}, r.name),
      h("div", { class: "meta" }, metaText(r)),
      r.source === "custom" ? h("p", { class: "aitag" }, "직접 작성한 간단 레시피예요. 간과 불 세기는 취향에 맞게 조절하세요.") : null,
      h("div", { class: "tags" },
        m.plain ? r.ingredients.map((i) => h("span", { class: "tag staple" }, i)) : null,
        m.missing.map((i) => h("span", { class: "tag miss" }, `+ ${i}`)),
        m.have.map((i) => h("span", { class: "tag have" }, i)),
        m.staples.map((i) => h("span", { class: "tag staple" }, `${i} (기본)`))),
      h("h4", {}, "재료"),
      h("div", { class: "ingtext" }, r.partsText),
      h("h4", {}, "만드는 법"),
      r.steps.length
        ? h("ol", { class: "steps" }, r.steps.map((s) =>
            h("li", {}, h("div", {}, s.text),
              s.img ? h("img", { src: s.img, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }) : null)))
        : h("p", { class: "meta" }, "조리 과정 정보가 없어요."),
      r.tip ? h("h4", {}, "저감 조리 팁") : null,
      r.tip ? h("div", { class: "tip" }, r.tip) : null,
      nutri.length ? h("h4", {}, "영양 정보") : null,
      nutri.length ? h("div", { class: "nutri" }, nutri.map(([k, v, u]) => h("span", {}, `${k} ${v}${u}`))) : null));
  $("dlgBody").replaceChildren(body);
  $("dlg").showModal();
  $("dlg").scrollTop = 0;
}

/* ---------- 재료 입력 / 자동완성 ---------- */
function addIng(name) {
  const canon = state.aliases[name] || name;
  if (!state.names.has(canon)) return false;
  if (!state.mine.includes(canon)) state.mine.push(canon);
  update();
  return true;
}
function removeIng(name) { state.mine = state.mine.filter((n) => n !== name); update(); }
function clearIngs() { state.mine = []; update(); $("q").focus(); }

let suggestions = [], cursor = -1;

function suggest(q) {
  q = q.trim();
  if (!q) return [];
  const seen = new Map();
  for (const i of state.ingredients) {
    if (i.name.includes(q)) seen.set(i.name, { name: i.name, via: null, rank: i.name.startsWith(q) ? 0 : 1, count: i.count });
  }
  for (const [alias, canon] of Object.entries(state.aliases)) {
    if (alias.includes(q) && !seen.has(canon) && state.names.has(canon)) {
      const c = state.ingredients.find((i) => i.name === canon);
      seen.set(canon, { name: canon, via: alias, rank: 2, count: c ? c.count : 0 });
    }
  }
  return [...seen.values()].sort((a, b) => a.rank - b.rank || b.count - a.count).slice(0, 8);
}

function renderSugg() {
  const ul = $("sugg");
  ul.replaceChildren(...suggestions.map((s, idx) =>
    h("li", { role: "option", class: idx === cursor ? "on" : "",
              onmousedown: (e) => { e.preventDefault(); pick(s.name); } },
      h("span", {}, s.name), s.via ? h("small", {}, `‘${s.via}’`) : null)));
  ul.hidden = !suggestions.length;
}

function pick(name) {
  addIng(name);
  $("q").value = ""; suggestions = []; cursor = -1; renderSugg(); $("hint").textContent = "";
}

function initInput() {
  const q = $("q");
  q.addEventListener("input", () => {
    suggestions = suggest(q.value); cursor = suggestions.length ? 0 : -1; renderSugg();
    $("hint").textContent = q.value.trim() && !suggestions.length ? `‘${q.value.trim()}’ 은(는) 레시피 데이터에 없는 재료예요.` : "";
  });
  q.addEventListener("keydown", (e) => {
    if (e.isComposing) return;                           // 한글 조합 중 Enter 중복 방지
    if (e.key === "ArrowDown" && suggestions.length) { e.preventDefault(); cursor = (cursor + 1) % suggestions.length; renderSugg(); }
    else if (e.key === "ArrowUp" && suggestions.length) { e.preventDefault(); cursor = (cursor - 1 + suggestions.length) % suggestions.length; renderSugg(); }
    else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (cursor >= 0 && suggestions[cursor]) pick(suggestions[cursor].name);
    } else if (e.key === "Escape") { suggestions = []; renderSugg(); }
    else if (e.key === "Backspace" && !q.value && state.mine.length) removeIng(state.mine[state.mine.length - 1]);
  });
  q.addEventListener("blur", () => { suggestions = []; renderSugg(); });
}

/* ---------- 시작 ---------- */
initInput();
for (const id of ["optCommon", "optMode", "optSort", "optMissing", "optCat"]) $(id).addEventListener("change", () => update());
$("more").addEventListener("click", () => { state.shown += PAGE; update(false); });
$("dlg").addEventListener("click", (e) => { if (e.target === $("dlg")) $("dlg").close(); });
$("reroll").addEventListener("click", () => renderRec(true));
window.addEventListener("hashchange", route);
route();
load();


/* ---------- 냉장고 인식 ---------- */

const cameraInput = document.getElementById('camera-input');
const btnTriggerCamera = document.getElementById('btn-trigger-camera');
const aiStatus = document.getElementById('ai-status');
const imagePreview = document.getElementById('image-preview');
const imagePreviewBox = document.getElementById('image-preview-box');

// Gemini API 키는 Cloudflare Worker(worker/fridge-vision.js)에만 있다. 사이트는 사진만 Worker로 보낸다.
const VISION_URL = 'https://fridge-vision.hhm8818.workers.dev';
const VISION_TIMEOUT_MS = 20000;   // 20초 안에 결과가 없으면 포기하고 다시 올리도록 안내한다

// 사진을 바꿔서 다시 올리면 해결될 만한 실패(냉장고·식재료 사진이 아님, 시간 초과 등)는 retry 표시를 달아 안내 문구를 구분한다
const retryError = (msg) => Object.assign(new Error(`${msg} 재료가 잘 보이는 다른 사진으로 다시 업로드해 주세요.`), { retry: true });

btnTriggerCamera.addEventListener('click', () => cameraInput.click());

cameraInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 1. 이미지 압축 (속도 및 전송량 최적화)
    const resizedBase64 = await resizeAndCompressImage(file, 1024, 1024);
    imagePreview.src = `data:image/jpeg;base64,${resizedBase64}`;
    imagePreviewBox.style.display = 'block';

    // 2. AI 분석 진행
    aiStatus.textContent = '🔍 냉장고 속 재료를 분석하는 중입니다...';
    btnTriggerCamera.disabled = true;

    // 재료 입력·검색 갱신과 결과 메시지는 callVisionAPI 안의 autoInputIngredients 가 처리한다
    await callVisionAPI(resizedBase64);
  } catch (error) {
    console.error('AI 인식 에러:', error);
    aiStatus.textContent = error.retry ? `⚠️ ${error.message}` : `❌ 인식 실패: ${error.message}`;
  } finally {
    btnTriggerCamera.disabled = false;
    cameraInput.value = '';   // 같은 사진을 다시 골라도 change 이벤트가 나도록 비운다
  }
});

/* 이미지 압축 / Base64 변환 */
function resizeAndCompressImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* 재료 인식: Worker가 키를 붙여 Gemini를 대신 호출하고, Gemini 응답을 그대로 돌려준다 */
async function callVisionAPI(base64Image) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), VISION_TIMEOUT_MS);   // 요청과 응답 읽기까지 합쳐 20초
  try {
    let response;
    try {
      response = await fetch(VISION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
        signal: ctrl.signal
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      throw new Error('인식 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    }

    if (!response.ok) {   // 횟수 제한(429) 같은 서버 안내는 그대로 보여 준다
      let msg = `상태코드 ${response.status}`;
      try { msg = (await response.json()).error?.message || msg; } catch { /* Worker 자체 오류는 일반 텍스트 */ }
      throw new Error(msg);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textPart = parts.find(p => !p.thought) || parts[parts.length - 1];
    if (!textPart || !textPart.text) throw retryError('사진에서 재료를 읽지 못했어요.');

    let detectedNames;
    try {
      detectedNames = JSON.parse(textPart.text.replace(/```json/gi, '').replace(/```/g, '').trim());
    } catch {
      throw retryError('사진에서 재료를 읽지 못했어요.');
    }
    if (!Array.isArray(detectedNames)) throw retryError('사진에서 재료를 읽지 못했어요.');
    if (!detectedNames.length) throw retryError('냉장고나 식재료 사진이 아닌 것 같아요.');

    const { matched } = autoInputIngredients(detectedNames);
    if (!matched.length) throw retryError('레시피에 쓰는 재료를 찾지 못했어요.');
    return detectedNames;
  } catch (err) {
    if (err.name === 'AbortError') throw retryError('분석이 20초 넘게 걸려서 멈췄어요.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// 인식된 재료를 입력창에 넣고 { added: 새로 넣은 것, skipped: 레시피 데이터에 없는 것, matched: 레시피 재료와 맞은 것 } 을 돌려준다
function autoInputIngredients(detectedNames) {
  if (!Array.isArray(detectedNames) || !detectedNames.length) return { added: [], skipped: [], matched: [] };

  const added = [];
  const skipped = [];
  const matched = [];

  detectedNames.forEach((rawName) => {
    const name = String(rawName ?? '').trim();
    if (!name) return;

    // 1. 표준 명칭 변환 (aliases.json 활용: 예 '계란' -> '달걀')
    let canon = state.aliases[name] || name;

    // 2. 수식어가 붙은 경우 부분 일치 매칭 시도 (예: '빨간 파프리카' -> '파프리카', '적양파' -> '양파')
    if (!state.names.has(canon)) {
      for (const ingName of state.names) {
        if (name.includes(ingName) || ingName.includes(name)) {
          canon = ingName;
          break;
        }
      }
    }

    // 3. 레시피 DB(ingredients.json)에 존재하면 추가
    if (state.names.has(canon)) {
      if (!matched.includes(canon)) matched.push(canon);
      if (!state.mine.includes(canon)) {
        state.mine.push(canon);
        added.push(canon);
      }
    } else {
      skipped.push(name); // DB에 레시피 재료로 등록되지 않은 과일/재료 제외 (예: 참외, 석류 등)
    }
  });

  // 4. 기존 app.js의 update()를 1회만 호출하여 칩 생성, 레시피 검색, localStorage 저장을 한 번에 처리
  if (added.length > 0) {
    update();
  }

  // 5. 결과 상태 표시
  let statusMsg = added.length
    ? `✨ ${added.length}개 재료가 자동으로 입력되었습니다: [ ${added.join(', ')} ]`
    : `✨ 인식한 재료는 이미 모두 입력되어 있어요: [ ${matched.join(', ')} ]`;
  if (skipped.length > 0) {
    statusMsg += `\n(⚠️ 레시피 데이터에 없는 재료 제외: ${skipped.join(', ')})`;
  }
  
  if (aiStatus) {
    aiStatus.innerText = statusMsg;
  }
  return { added, skipped, matched };
}
