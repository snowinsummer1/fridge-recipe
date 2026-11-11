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

  renderQuick();
  update();
  renderRec(false);
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

/* ---------- 화면 전환 (메인 ↔ 요리하러 가기) ---------- */
function route() {
  const inApp = location.hash === "#cook";
  $("home").hidden = inApp;
  $("app").hidden = !inApp;
  window.scrollTo(0, 0);
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

btnTriggerCamera.addEventListener('click', () => cameraInput.click());

cameraInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const rawConfigKey = window.CONFIG?.GEMINI_API_KEY;
  const configKey = (rawConfigKey && !rawConfigKey.includes('여기에_')) ? rawConfigKey : null;

  // sessionStorage 키 우선 -> 없으면 configKey 사용
  const apiKey = sessionStorage.getItem('gemini_api_key') || configKey;

  if (!apiKey) {
    alert('Gemini API 키가 설정되지 않았습니다. 하단에서 키를 입력하고 저장해 주세요.');
    return;
  }

  try {
    // 1. 이미지 압축 (속도 및 전송량 최적화)
    const resizedBase64 = await resizeAndCompressImage(file, 1024, 1024);
    imagePreview.src = `data:image/jpeg;base64,${resizedBase64}`;
    imagePreviewBox.style.display = 'block';

    // 2. AI 분석 진행
    aiStatus.textContent = '🔍 냉장고 속 재료를 분석하는 중입니다...';
    btnTriggerCamera.disabled = true;

    // 재료 입력·검색 갱신과 결과 메시지는 callGeminiVisionAPI 안의 autoInputIngredients 가 처리한다
    await callGeminiVisionAPI(resizedBase64, apiKey);
  } catch (error) {
    console.error('AI 인식 에러:', error);
    aiStatus.textContent = `❌ 인식 실패: ${error.message}`;
  } finally {
    btnTriggerCamera.disabled = false;
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

/* Gemini Vision API 호출 (최신 모델 적용 및 자동 폴백) */
async function callGeminiVisionAPI(base64Image, apiKey) {
  // 현재 계정에서 사용 가능한 최신 모델 순서로 설정
  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite'
  ];

  const promptText = `
  이 냉장고 또는 식재료 사진을 분석하여 식별 가능한 식재료 이름만 추출해줘.
  반드시 한국어 단어로 이루어진 JSON 배열 형태만 응답해줘.
  예시: ["계란", "양파", "대파", "두부", "돼지고기"]
  `;

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
              { text: promptText }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `상태코드 ${response.status}`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const textPart = parts.find(p => !p.thought) || parts[parts.length - 1];

      if (!textPart || !textPart.text) {
        throw new Error('응답 데이터 텍스트 부재');
      }

      const cleanText = textPart.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const detectedNames = JSON.parse(cleanText);
      autoInputIngredients(detectedNames);
      return detectedNames;

    } catch (err) {
      console.warn(`[${model}] 실패, 다음 모델 시도:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('모든 Gemini 모델 호출에 실패했습니다.');
}

function autoInputIngredients(detectedNames) {
  if (!Array.isArray(detectedNames) || !detectedNames.length) return;

  const added = [];
  const skipped = [];

  detectedNames.forEach((rawName) => {
    const name = rawName.trim();
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
  let statusMsg = `✨ ${added.length}개 재료가 자동으로 입력되었습니다: [ ${added.join(', ')} ]`;
  if (skipped.length > 0) {
    statusMsg += `\n(⚠️ 레시피 데이터에 없는 재료 제외: ${skipped.join(', ')})`;
  }
  
  if (aiStatus) {
    aiStatus.innerText = statusMsg;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedKey = sessionStorage.getItem('gemini_api_key');
  if (savedKey) {
      document.getElementById('apiKeyInput').value = savedKey;
      updateKeyStatus(true);
  }
});

document.getElementById('saveKeyBtn').addEventListener('click', () => {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) return alert('API 키를 입력하세요!');
  sessionStorage.setItem('gemini_api_key', key);
  updateKeyStatus(true);
  alert('저장되었습니다.');
});

function updateKeyStatus(isSet) {
  const statusSpan = document.getElementById('keyStatus');
  statusSpan.innerText = isSet ? '🟢 API 키 설정됨' : '🔴 API 키 미설정';
  statusSpan.style.color = isSet ? 'green' : 'red';
}