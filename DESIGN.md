---
name: 냉장고 레시피
description: 자취생 냉장고 털이 — 레시피마다 마트 저울 라벨이 한 장씩, 가격 칸에는 '추가로 살 재료 n개'.
colors:
  band: "#0b5e46"
  band-ink: "#084634"
  on-band: "#ffffff"
  accent: "#0b5e46"
  accent-ink: "#084634"
  accent-soft: "#dfeae3"
  sticker: "#ffd93b"
  on-sticker: "#16181a"
  bg: "#eef1ed"
  bg-2: "#e2e7e1"
  surface: "#ffffff"
  text: "#16181a"
  muted: "#535a56"
  line: "#d6dcd5"
  line-strong: "#b4bdb5"
  rule: "#16181a"
  have: "#0b5e46"
  have-soft: "#dfeae3"
  miss: "#b3311b"
  sub: "#6a3fc4"
  sub-soft: "#f1ebfc"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 4.4vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 700
    fontFeature: "tnum"
  price-numeral:
    fontFamily: "Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
rounded:
  tag: "3px"
  sm: "4px"
  md: "6px"
  dialog: "10px"
  pill: "999px"
spacing:
  gutter: "32px"
  gutter-mobile: "16px"
  card-gap: "18px"
  card-pad: "12px 14px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.band}"
    textColor: "{colors.on-band}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "{colors.band-ink}"
  button-sticker:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.on-sticker}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  input-search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 12px 10px 38px"
  chip-ingredient:
    backgroundColor: "{colors.text}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "4px 4px 4px 11px"
  label-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
  label-band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.on-band}"
    typography: "{typography.label}"
    padding: "5px 12px"
  tag-have:
    backgroundColor: "{colors.have-soft}"
    textColor: "{colors.have}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  tag-sub:
    backgroundColor: "{colors.sub-soft}"
    textColor: "{colors.sub}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  tag-miss:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.miss}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  sticker-now:
    backgroundColor: "{colors.sticker}"
    textColor: "{colors.on-sticker}"
    rounded: "{rounded.pill}"
    size: "64px"
---

# Design System: 냉장고 레시피

## Overview

**Creative North Star: "마트 저울 라벨"**

레시피 한 개는 마트 저울에서 찍혀 나온 라벨 한 장이다. 미리 인쇄된 짙은 초록 띠, 차가운 흰 라벨지, 감열 잉크 검정 글자, 그리고 가격 칸. 이 사이트에서 가격 칸에 찍히는 값은 돈이 아니라 '추가로 살 재료 n개'이고, 방문자는 그 숫자만 훑어 고른다. 사진 카드에 둥근 초록 배지를 얹는 흔한 요리 앱의 문법은 쓰지 않는다.

라벨은 평평하다. 색 면과 선(실선, 점선, 굵은 잉크 선)으로 구획을 나누고, 그림자와 그라데이션으로 깊이를 만들지 않는다. 유일한 '튀는' 재료는 노란 할인 스티커다. 스티커는 '지금 바로' 만들 수 있는 요리와, 초록 띠 위에 놓인 주 행동에만 붙는다. 그래서 노랑이 보이는 곳이 곧 지금 할 일이다.

글꼴은 Pretendard 하나다. 데이터 칸(띠, 데이터 행, 가격 칸 숫자)은 고정폭 숫자(tabular-nums)로 라벨 인쇄의 줄맞춤을 낸다. 고정폭 글꼴은 한글이 반각 간격으로 벌어져 라벨처럼 읽히지 않아 의도적으로 뺐다.

**Key Characteristics:**
- 초록 띠(헤더, 카드 띠, 주 버튼, CTA 띠)가 라벨의 뼈대다.
- 가격 칸의 큰 숫자(2.6rem, 900)가 카드의 주인공이다.
- 노란 스티커는 '지금 바로'와 초록 띠 위의 주 행동만 차지한다.
- 재료 상태는 색만이 아니라 선 모양으로 읽힌다: 채움, 점선, 빈 테두리.
- 평평한 색 면. 그림자는 대화상자와 자동완성 목록이 떠오를 때만.

## Colors

라벨 초록과 감열 잉크 검정이 받침이고, 노랑·빨강·보라는 각자 한 가지 의미만 맡는다.

### Primary
- **라벨 초록 띠** (`band`): 헤더, 카드의 종류·시간 띠, 주 버튼, 홈 하단 CTA 띠, 대화상자 머리 아래 8px 띠. 라이트·다크 모두 같은 값을 유지해 라벨지에 미리 인쇄된 띠처럼 보인다. 눌림·호버는 `band-ink`.
- **초록 잉크** (`accent`): 글자·테두리·포커스 링·스위치에 쓰는 초록. 라이트에서는 `band`와 같고, 다크에서는 밝은 민트(#6fd3a6)로 바뀌어 어두운 라벨지 위에서 읽힌다. `accent-soft`는 선택 배경, 자동완성 강조, 팁 상자, 포커스 후광.

### Secondary
- **노란 할인 스티커** (`sticker`, 글자 `on-sticker`): '지금 바로' 동그라미 스티커, 헤더의 시작하기, CTA 띠의 레시피 찾기, 미리보기의 '지금 바로' 표시. 다크에서도 값이 그대로다.

### Tertiary
- **살 재료 빨강** (`miss`): 추가로 사야 할 재료 태그의 글자와 테두리, 미리보기의 '추가 n개'. 다크에서는 #ff8a6e.
- **대체 재료 보라** (`sub`, 배경 `sub-soft`): 내 재료로 대신할 수 있는 재료. 화면 문구가 '보라색'이라고 안내하므로 보라는 이 의미에 묶여 있다.

### Neutral
- **라벨 받침지** (`bg`, `bg-2`): 페이지 바탕과 사진 자리, 재료 분량 상자. 회녹색이 살짝 섞인 받침지.
- **라벨지** (`surface`): 카드, 섹션, 입력칸, 대화상자.
- **감열 잉크** (`text`, `rule`): 본문 글자와, 블록을 여는 굵은 잉크 선(2~3px). 재료 칩과 단계 번호는 이 잉크를 바탕으로 뒤집어 찍는다.
- **흐린 잉크** (`muted`): 보조 설명, 데이터 행의 항목명.
- **점선과 가는 선** (`line`, `line-strong`): 데이터 행 사이 점선, 섹션 경계, 고스트 버튼과 카드 테두리.

다크 모드는 `@media (prefers-color-scheme: dark)` 블록에서 같은 토큰 이름의 값만 바꾼다. 라벨지는 #181c1a, 받침지는 #101311, 잉크는 #e7ece8이 되고, `band`와 `sticker`는 바뀌지 않는다.

### Named Rules
**The Sticker Rule.** 노랑은 '지금 바로' 스티커와 초록 띠 위의 주 행동에만 쓴다. 라벨지 위의 주 버튼은 초록 띠 색이다. 노랑이 늘어나면 '지금 할 일'이라는 의미가 사라진다.

**The Printed Band Rule.** `band`는 테마와 무관하게 같은 초록이다. 다크에서 밝아지는 쪽은 글자·테두리용 `accent`뿐이다.

## Typography

**Display Font:** Pretendard Variable (Apple SD Gothic Neo, Malgun Gothic, system-ui로 대체)
**Body Font:** Pretendard Variable
**Label/Mono Font:** 따로 없음. 데이터 칸은 같은 글꼴에 `font-variant-numeric: tabular-nums`.

**Character:** 굵고 촘촘한 한 글꼴. 제목은 800 굵기에 음수 자간으로 라벨 품명처럼 단단하게 찍고, 숫자는 고정폭으로 줄을 맞춘다.

### Hierarchy
- **Display** (800, clamp(2.2rem, 4.4vw, 3.4rem), 1.2): 홈 히어로 제목 한 곳. 모바일 2rem.
- **Headline** (800, clamp(1.6rem, 3vw, 2.2rem), 1.3): 섹션 제목. 페이지 머리 제목은 2.1rem(모바일 1.55rem), 대화상자 제목 1.75rem.
- **Title** (800, 1.12rem, 1.3, -0.035em): 카드 품명, 두 줄에서 자른다. 모바일 .98rem.
- **Body** (400, 1rem, 1.6): 본문. `word-break: keep-all`로 한국어 어절을 지킨다. 리드 문단은 1.05~1.12rem, 최대 520px.
- **Label** (700, .74rem, tabular-nums): 카드 띠, 데이터 행(.76rem), 태그. 대문자 변환이나 넓은 자간 없음.
- **Price Numeral** (900, 2.6rem, 1, -0.04em, tabular-nums): 가격 칸의 '추가로 살 재료' 숫자. 0개 카드에서만 `accent` 색. 모바일 2.1rem.

### Named Rules
**The One Face Rule.** Pretendard 하나만 쓴다. 라벨다운 줄맞춤은 고정폭 글꼴이 아니라 tabular-nums로 낸다.

**The Price Slot Rule.** 카드에서 가장 큰 글자는 품명이 아니라 가격 칸 숫자다.

## Layout

최대 폭 1240px, 좌우 여백 32px(640px 이하 16px). 홈은 히어로 2열(1.05fr / .95fr, 간격 56px), 섹션 상하 96px(모바일 64px). 레시피 찾기는 왼쪽 320px 고정 사이드바(스크롤 따라 붙음)와 오른쪽 콘텐츠의 2열, 간격 40px. 사이드바 블록은 2px 잉크 선으로 연다.

카드 격자는 `repeat(auto-fill, minmax(232px, 1fr))`, 간격 18px. 오늘의 추천은 3열 가로형 카드(1080px 이하 2열). 960px 이하에서 사이드바는 위로 쌓이고 필터는 2열이 된다. 640px 이하에서 내비 링크는 숨고, 빠른 재료와 추천 줄은 가로 스크롤(추천은 카드 78% 폭, 스냅), 결과 격자는 2열(360px 이하 1열). 대화상자는 모바일에서 아래에서 올라오는 시트가 된다.

## Elevation & Depth

평평한 시스템이다. 깊이는 색 면의 차이(받침지 `bg` 위의 라벨지 `surface`)와 선의 굵기로 만든다. 그림자는 화면 위에 떠오르는 두 가지, 상세 대화상자와 재료 자동완성 목록에만 쓴다. 포커스 후광(`0 0 0 3px accent-soft`)은 고도가 아니라 상태 표시다. 카드 호버는 그림자 없이 2px 들리고 테두리가 잉크색이 된다.

### Shadow Vocabulary
- **떠오름** (`box-shadow: var(--shadow-lg)`, 라이트 `0 10px 28px rgb(22 24 26 / .18)`, 다크 `0 14px 34px rgb(0 0 0 / .5)`): 대화상자와 자동완성 목록 전용.

### Named Rules
**The Flat Label Rule.** 화면에 붙어 있는 것(카드, 스티커, 버튼, 섹션)에는 그림자가 없다. 그림자는 화면 위로 떠오르는 층에만 있다.

## Shapes

작게 둥근 모서리. 태그 3px, 버튼·입력칸·칩 4px(`sm`), 카드·빈 상태 6px(`md`), 대화상자 10px(모바일 시트는 위쪽 12px). 완전한 원은 스티커, 단계 번호, 스위치, 닫기 버튼에만. 선은 의미가 있다: 블록을 여는 2~3px 잉크 실선, 데이터 행 사이 점선(dotted), 목록 행과 섹션 경계의 파선(dashed). 라벨 두 장은 살짝 기울어져 붙는다: 홈 미리보기 라벨 1.2deg, '지금 바로' 스티커 -9deg.

## Components

### Buttons
라벨 위의 단단한 직사각형 버튼.
- **Shape:** 거의 각진 모서리 (4px), 1.5px 테두리 자리.
- **Primary:** 초록 띠 바탕 + 흰 글자, 700, .95rem, 9px 16px. 큰 버튼 13px 24px, 작은 버튼 5px 11px.
- **Sticker (초록 띠 위의 주 행동):** 노란 바탕 + 잉크 글자. 헤더 시작하기와 CTA 띠 레시피 찾기.
- **Ghost:** 라벨지 바탕, `line-strong` 테두리, 호버에서 잉크 테두리.
- **Hover / Focus:** 배경·테두리 색만 .15s 전환. 화살표 아이콘은 호버에서 3px 앞으로. 포커스는 2px `accent` 윤곽선(초록 띠 위에서는 노란 윤곽선).

### Chips
- **Style:** 내 재료 칩은 잉크 바탕에 라벨지 글자(뒤집어 찍은 인쇄), 4px, 600. 지우기 버튼은 반투명 사각.
- **State:** 추가될 때 .18s 튀어나옴. 빠른 재료 버튼은 가는 테두리 칩, 이미 넣은 재료는 취소선과 흐림.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** 라벨지 `surface`, 사진 자리 `bg-2`.
- **Shadow Strategy:** 없음. Elevation & Depth 참고.
- **Border:** 1px `line-strong`, 호버·포커스에서 잉크/`accent`.
- **Internal Padding:** 12px 14px.

### Inputs / Fields
- **Style:** 검색칸은 1.5px 잉크 테두리, 4px, 왼쪽 돋보기 선 아이콘. 선택 상자는 1px `line-strong` 테두리와 SVG 꺾쇠.
- **Focus:** 테두리가 `accent`로, 3px `accent-soft` 후광.
- **Switch:** 회색 트랙이 켜지면 초록 띠 색.

### Navigation
초록 띠 헤더(60px, 모바일 56px), 화면 위에 붙어 따라온다. 링크는 흰색 78% 불투명, 현재 페이지는 100%에 띠 아래쪽 3px 흰 밑줄. 오른쪽 끝에 노란 시작하기. 640px 이하에서 링크는 숨는다.

### Label Card (Signature)
사진 → 초록 띠(종류·조리법 | 시간, tabular-nums) → 품명 → 데이터 행(내 재료 n / 전체, 열량; 1.5px 잉크 윗선과 점선 행) → 재료 태그 → 가격 칸. 가격 칸 왼쪽은 재료 막대, 오른쪽은 '추가로 살 재료' 작은 글씨 위의 큰 숫자와 '개'.

### Ingredient State (Signature)
재료 상태는 선 모양으로 구분해 색을 못 보는 사람도 읽을 수 있다.
- **가진 재료 (have):** 태그는 `have-soft` 채움에 초록 글자, 막대 칸은 꽉 채운 초록.
- **대체 재료 (sub):** 태그는 `sub-soft` 바탕에 보라 파선 테두리, 막대 칸은 보라 파선 빈 칸.
- **살 재료 (miss):** 태그는 라벨지 바탕에 빨강 실선 테두리와 '+ 재료', 막대 칸은 `line-strong` 빈 테두리.

### '지금 바로' Sticker (Signature)
추가로 살 재료가 0개인 카드에만, 사진 오른쪽 위에 64px(모바일 50px) 노란 원을 -9deg 기울여 붙인다. 900 굵기 두 줄 '지금 / 바로'. 결과가 갱신될 때 크게 기울어진 채 내려와 한 번 찍힌다(.42s). 그림자 없음.

## Do's and Don'ts

### Do:
- **Do** 새 화면의 주 행동은 라벨지 위면 초록 띠 버튼, 초록 띠 위면 노란 스티커 버튼으로 둔다.
- **Do** 재료 상태를 추가할 때 색과 함께 선 모양(채움 / 파선 / 빈 테두리)을 반드시 짝지운다.
- **Do** 숫자가 줄 서는 칸(띠, 데이터 행, 가격 칸, 통계)에는 tabular-nums를 켠다.
- **Do** 블록은 2px 잉크 선으로 열고, 행 사이는 점선이나 파선으로 나눈다.
- **Do** 색은 :root의 라이트·다크 두 블록 토큰으로만 쓴다.
- **Do** 아이콘은 선 SVG(stroke 2~2.2, round cap)로 그린다.

### Don't:
- **Don't** 노랑을 장식, 배지, 일반 강조, 라벨지 위의 버튼에 쓰지 않는다.
- **Don't** 화면에 붙은 요소(카드, 스티커, 버튼)에 그림자나 그라데이션을 넣지 않는다. 그림자는 대화상자와 자동완성 목록에만.
- **Don't** 고정폭 글꼴을 들여오지 않는다. 한글이 반각 간격으로 벌어진다.
- **Don't** 보라를 대체 재료가 아닌 의미에 쓰지 않는다.
- **Don't** 카드에서 품명을 가격 칸 숫자보다 크게 만들지 않는다.
