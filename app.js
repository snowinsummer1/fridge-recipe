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
  if (opts.missing) $("optMissing").value = opts.missing;
  if (opts.cat) $("optCat").value = opts.cat;

  renderQuick();
  update();
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
  const out = [];
  for (const r of state.recipes) {
    if (cat && r.category !== cat) continue;
    const need = r.ingredients.filter((i) => !assumed.has(i));
    const have = need.filter((i) => mine.has(i));
    if (!have.length) continue;                      // 내 재료를 하나도 안 쓰는 요리는 제외
    const missing = need.filter((i) => !mine.has(i));
    if (missing.length > maxMissing) continue;
    out.push({ r, have, missing, staples: r.ingredients.filter((i) => assumed.has(i)) });
  }
  // 부족한 재료가 적은 순 → 내 재료를 많이 쓰는 순 → 필요한 재료가 적은 순
  out.sort((a, b) =>
    a.missing.length - b.missing.length ||
    b.have.length - a.have.length ||
    (a.have.length + a.missing.length) - (b.have.length + b.missing.length));
  return out;
}

/* ---------- 렌더링 ---------- */
function update(resetPage = true) {
  if (resetPage) state.shown = PAGE;
  store("mine", state.mine);
  store("opts", { common: $("optCommon").checked, missing: $("optMissing").value, cat: $("optCat").value });
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
  $("summary").textContent = n
    ? `${n}개의 요리를 찾았어요. 추가로 필요한 재료가 적은 순서예요.`
    : "조건에 맞는 요리가 없어요. ‘추가 재료’ 제한을 늘려 보세요.";
  for (const m of state.results.slice(0, state.shown)) grid.append(card(m));
  $("more").hidden = state.shown >= n;
}

function card({ r, have, missing, staples }) {
  const badge = missing.length
    ? h("span", { class: "badge" }, `추가 ${missing.length}개`)
    : h("span", { class: "badge zero" }, "바로 가능");
  const img = r.img ? h("img", { src: r.img, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }) : null;
  return h("button", { class: "card", onclick: () => openDetail(r, { have, missing, staples }) },
    h("div", { class: "thumb" }, img, badge),
    h("div", { class: "cbody" },
      h("h3", {}, r.name),
      h("div", { class: "meta" }, [r.category, r.method].filter(Boolean).join(" · ")),
      h("div", { class: "tags" },
        missing.map((i) => h("span", { class: "tag miss" }, `+ ${i}`)),
        have.map((i) => h("span", { class: "tag have" }, i)))));
}

function renderChips() {
  $("chips").replaceChildren(...state.mine.map((n) =>
    h("span", { class: "chip" }, n,
      h("button", { type: "button", "aria-label": `${n} 삭제`, onclick: () => removeIng(n) }, "×"))));
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
      h("div", { class: "meta" }, [r.category, r.method].filter(Boolean).join(" · ")),
      h("div", { class: "tags" },
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
for (const id of ["optCommon", "optMissing", "optCat"]) $(id).addEventListener("change", () => update());
$("more").addEventListener("click", () => { state.shown += PAGE; update(false); });
$("dlg").addEventListener("click", (e) => { if (e.target === $("dlg")) $("dlg").close(); });
load();
