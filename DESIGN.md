---
name: d-log
description: 하루를 기록하다 — 시간 블록 기반 개인 플래너
colors:
  sage-olive: "hsl(72, 13%, 39%)"
  warm-cream: "hsl(48, 29%, 94%)"
  soft-paper: "hsl(46, 40%, 98%)"
  warm-sand: "hsl(45, 22%, 89%)"
  muted-earth: "hsl(45, 20%, 90%)"
  quiet-sage: "hsl(40, 8%, 44%)"
  deep-soil: "hsl(40, 13%, 19%)"
  coral-warning: "hsl(4, 55%, 51%)"
  study-slate: "#6f8caf"
  exercise-leaf: "#7ba05b"
  work-amber: "#c39a4c"
  personal-lavender: "#9a82b5"
  rest-rose: "#c98ba0"
typography:
  display:
    fontFamily: "Lora, Georgia, serif"
    fontWeight: 600
    fontStyle: italic
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.01em"
rounded:
  sm: "calc(1rem - 4px)"
  md: "calc(1rem - 2px)"
  lg: "1rem"
  xl: "1rem"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.sage-olive}"
    textColor: "{colors.soft-paper}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "hsl(72, 13%, 35%)"
  button-secondary:
    backgroundColor: "{colors.warm-sand}"
    textColor: "{colors.deep-soil}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.quiet-sage}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.soft-paper}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    backgroundColor: "{colors.warm-cream}"
    textColor: "{colors.deep-soil}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: d-log

## Overview

**Creative North Star: "The Recording Notebook"**

d-log는 필기하듯 가볍고 실용적인 기록 도구다. 노트북을 펼쳤을 때의 부담 없는 느낌 — 거창한 셋업 없이 바로 쓸 수 있는 도구, 그러나 매일 들여다보고 싶은 따뜻함이 있어야 한다.

시각적 언어는 차분하고 자연스럽다. 크림색 종이 위에 올리브 그린 잉크로 적은 듯한 색감, 둥글지만 과하지 않은 모서리, 미세한 그림자로 레이어를 구분하는 플랫 스타일. 화려한 애니메이션보다 안정적인 전환을 선호하고, 데이터 입력의 마찰을 최소화하는 것이 첫 번째 원칙이다.

한국어 인터페이스에 최적화되어 있으며, 세리프(Lora)와 산세리프(Inter)의 대비로 브랜드 개성과 실용성을 동시에 달성한다.

**Key Characteristics:**
- 따뜻한 자연 팔레트 (크림, 세이지, 모래색)
- 필기구적 세리프 악센트
- 플랫 + 미세 그림자 깊이
- 빠른 입력 우선의 인터랙션
- 부드러운 모서리 (pill 버튼, 라운드 카드)

## Colors

따뜻한 자연 팔레트. 크림색 배경 위에 올리브/세이지 그린이 악센트. 눈의 피로를 줄이고 매일 사용해도 지치지 않는 톤.

### Primary

- **Sage Olive** (hsl(72, 13%, 39%)): 주요 액션, 활성 네비게이션, 체크박스 완료 상태. 식물의 잎처럼 차분하면서도 생명력 있는 녹색.

### Secondary

- **Warm Sand** (hsl(45, 22%, 89%)): 보조 버튼, 섹션 구분, 약한 강조 배경.

### Tertiary

- **Coral Warning** (hsl(4, 55%, 51%)): 삭제, 오류, 위험 액션에만 사용. 화면에서 최소화.

### Neutral

- **Warm Cream** (hsl(48, 29%, 94%)): 앱 전체 배경. 순수 흰색보다 따뜻하고 종이 같은 느낌.
- **Soft Paper** (hsl(46, 40%, 98%)): 카드, 팝오버, 모달 배경. 배경보다 약간 밝은 종이.
- **Muted Earth** (hsl(45, 20%, 90%)): 비활성 배경, 입력 필드 배경, 구분선.
- **Quiet Sage** (hsl(40, 8%, 44%)): 보조 텍스트, 플레이스홀더, muted foreground.
- **Deep Soil** (hsl(40, 13%, 19%)): 본문 텍스트, 제목. 순수 검정보다 부드러운 다크 브라운.

### Semantic: Category Colors

할 일과 시간 블록의 카테고리를 구분하는 색상. 메인 팔레트와 조화를 이루도록 채도를 낮춤.

- **Study Slate** (#6f8caf): 공부
- **Exercise Leaf** (#7ba05b): 운동
- **Work Amber** (#c39a4c): 업무
- **Personal Lavender** (#9a82b5): 개인
- **Rest Rose** (#c98ba0): 휴식

### Semantic: Mood Colors

기분 점수 1-5를 나타내는 그라디언트. 빨강(나쁨)에서 녹색(좋음)으로.

- **Mood 1** (#cf6b5e): 최악
- **Mood 2** (#d9925a): 별로
- **Mood 3** (#cdb15a): 평범
- **Mood 4** (#9bb061): 좋음
- **Mood 5** (#7ba05b): 최고

### Named Rules

**The Sage Voice Rule.** Primary accent(Sage Olive)는 액션과 상태 표시에만 사용한다. 배경이나 장식에 쓰지 않는다.

**The Warm Ground Rule.** 배경은 항상 따뜻한 크림 계열. 차가운 회색이나 순수 흰색은 사용하지 않는다.

## Typography

**Display Font:** Lora (with Georgia, serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)

**Character:** 세리프 Lora는 브랜드 아이덴티티와 제목에 사용하여 손으로 쓴 듯한 인간적인 느낌을 준다. 산세리프 Inter는 본문과 인터페이스에 사용하여 가독성과 현대적 느낌을 보장한다. 둘의 대비가 "기록"이라는 컨셉을 강화한다.

### Hierarchy

- **Display** (Lora semibold italic, clamp(1.5rem, 4vw, 2rem), 1.1): 브랜드 로고, 대시보드 인사말. 항상 이탤릭.
- **Headline** (Inter semibold, 1.25rem, 1.3): 페이지 제목, 카드 헤더.
- **Title** (Inter medium, 1rem, 1.4): 섹션 제목, 위젯 타이틀.
- **Body** (Inter regular, 0.875rem, 1.5): 본문 텍스트, 설명, 입력 필드.
- **Label** (Inter medium, 0.75rem, 1.33, 0.01em tracking): 버튼 라벨, 탭, 칩, 메타데이터.

### Named Rules

**The Italic Identity Rule.** 이탤릭은 Lora에서만 사용한다. Inter는 항상 upright.

**The Small Caps Rule.** 브랜드 서브타이틀("Daily Record")은 10px uppercase + 0.18em letter-spacing으로 처리.

## Layout

중앙 정렬 컨테이너, 최대 1400px. 2rem 패딩.

사이드바(데스크탑): 240px 기본, 76px 접힌 상태. 부드러운 transition (200ms ease-in-out).

메인 콘텐츠: 위젯 그리드는 `md:grid-cols-2`. 카드 간격 16px(gap-4).

모바일: 하단 네비게이션 바로 전환. 사이드바 숨김.

스페이싱 스케일: 4 / 8 / 16 / 24 / 32 px. 컴포넌트 내부 패딩은 주로 24px(p-6).

## Elevation & Depth

플랫 바이 디폴트. 그림자는 미세하게만 사용하여 카드/팝오버를 배경에서 살짝 띄운다.

### Shadow Vocabulary

- **Card Shadow** (`0 1px 2px rgba(60,55,40,0.04)`): 카드 기본 상태. 거의 인지하기 어려운 정도로 미세.
- **Popover Shadow** (`0 4px 12px rgba(60,55,40,0.08)`): 드롭다운, 팝오버, 모달.

### Named Rules

**The Flat-By-Default Rule.** 요소는 기본적으로 플랫. 그림자는 레이어 구분이 필요할 때만 사용.

## Shapes

부드러운 모서리가 전체 시스템을 관통한다.

- **Buttons:** pill shape (border-radius: 9999px). 모든 버튼에 적용.
- **Cards:** 큰 라운드 (1rem / 16px). 콘텐츠 컨테이너의 기본.
- **Inputs:** 중간 라운드 (calc(1rem - 2px) / ~14px).
- **Checkboxes:** 작은 라운드 (calc(1rem - 4px) / ~12px). 정사각형이지만 모서리가 둥글다.
- **Avatars:** 원형.

형태 언어는 유기적이고 부드럽다. 날카로운 직각은 피한다.

## Components

### Buttons

**Character:** 부드럽고 친근한 pill 버튼. 과하지 않은 사이즈.

- **Shape:** pill (rounded-full / 9999px)
- **Primary:** Sage Olive 배경, Soft Paper 텍스트. h-10 px-5. hover: 90% opacity.
- **Secondary:** Warm Sand 배경, Deep Soil 텍스트. h-10 px-5. hover: 80% opacity.
- **Ghost:** 투명 배경, hover시 accent 배경. 아이콘 버튼에 주로 사용.
- **Outline:** Muted Earth border, 투명 배경. hover시 accent 배경.
- **Link:** 텍스트만, underline on hover.
- **Focus:** ring-2 ring-ring ring-offset-2.
- **Disabled:** opacity-50, pointer-events-none.

### Cards

**Character:** 종이 노트 한 장 같은 느낌.

- **Corner Style:** rounded-2xl (1rem)
- **Background:** Soft Paper (hsl(46, 40%, 98%))
- **Shadow:** 0 1px 2px rgba(60,55,40,0.04)
- **Border:** 1px border-border
- **Internal Padding:** p-6 (24px)

### Inputs

**Character:** 눈에 띄지 않지만 명확한 입력 영역.

- **Style:** border-input 배경, Warm Cream 배경 (또는 배경과 동일)
- **Shape:** rounded-md (~14px)
- **Height:** h-10 (40px)
- **Padding:** px-3 py-2
- **Focus:** ring-2 ring-ring ring-offset-2

### Checkboxes

**Character:** 부드러운 사각형. 체크시 Primary 색상.

- **Shape:** rounded-md, 20x20px
- **Unchecked:** border-primary, 투명 배경
- **Checked:** bg-primary, 흰색 체크 아이콘
- **Focus:** ring-2

### Navigation (Sidebar)

**Character:** 차분한 사이드 패널. 펼침/접힘 전환.

- **Width:** 240px (펼침), 76px (접힘)
- **Background:** Soft Paper (bg-card)
- **Border:** 오른쪽 border-r
- **Active Link:** bg-primary text-primary-foreground, rounded-lg
- **Inactive Link:** text-muted-foreground, hover시 bg-accent
- **Transition:** width 200ms ease-in-out

### Chips / Summary Chips

**Character:** 대시보드 상단의 요약 정보 표시.

- **Style:** border bg-card rounded-full px-3 py-1
- **Text:** text-xs font-medium text-muted-foreground
- **Icon:** h-3.5 w-3.5 text-primary

### Category Tags

**Character:** 할일/시간블록의 카테고리 표시.

- **Style:** 해당 카테고리 색상을 배경 또는 좌측 바로 사용
- **Text:** 작은 라벨 사이즈

## Do's and Don'ts

### Do:

- **Do** 새 화면을 만들 때 기존 카드 그리드 패턴(md:grid-cols-2, gap-4)을 따르라.
- **Do** 모든 인터랙티브 요소에 focus-visible ring을 적용하라.
- **Do** 한국어 라벨을 우선하되, 서브타이틀은 영문 대문자로 브랜드 악센트를 줘라.
- **Do** 카테고리 색상을 사용할 때 같은 채도로 유지하라.
- **Do** 세리프(Lora)는 브랜드 아이덴티티에만 사용하라: 로고, 대시보드 인사말.

### Don't:

- **Don't** 순수 흰색(#fff)이나 순수 검정(#000)을 사용하지 마라. 항상 warm tint.
- **Don't** 날카로운 직각(border-radius: 0)을 사용하지 마라.
- **Don't** Primary 색상을 큰 배경 영역에 쓰지 마라. 액션과 상태 표시에만.
- **Don't** 과도한 그림자를 사용하지 마라. 미세한 그림자만.
- **Don't** Inter에 이탤릭을 적용하지 마라.
