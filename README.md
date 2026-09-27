# chooheonsoo.com

추헌수 포트폴리오. 원래 Cargo에서 운영하던 사이트를 **디자인 그대로** 정적 페이지로 옮겨 GitHub Pages에서 호스팅한다.

- 사이트: https://chooheonsoo.com
- 저장소: https://github.com/sjrnfltkwk-web/chooheonsoo (push 하면 1~2분 뒤 자동 배포)

## 다른 컴퓨터에서 이어서 작업하기

```bash
git clone https://github.com/sjrnfltkwk-web/chooheonsoo.git
cd chooheonsoo
npx http-server . -p 5173 -e html
```

브라우저에서 http://localhost:5173 을 연다. `-e html` 이 있어야 `/remains` 같은 확장자 없는 주소가 열린다 (GitHub Pages와 동일).
필요한 것: Git, Node.js 18 이상. 설치할 패키지는 없다.

Claude Code로 이어서 할 때는 이 README를 먼저 읽게 하면 된다.

## 구조

| 경로 | 역할 |
|---|---|
| `_cargo/*.json` | Cargo API에서 받은 페이지 원본 (내용·레이아웃의 원천). **직접 고치지 않는다** |
| `_cargo/site.css` | Cargo 사이트 스타일시트 원본 |
| `_cargo/build.js` | 원본 → `<페이지>.html` 생성. 오타·표기 교정(`FIXES`), 공통 메뉴(`NAV`), 영상 대체(`VIDEO`)가 여기 있다 |
| `*.html` | 빌드 결과. `index.html` = `main.html` |
| `cargo.css`, `cargo.js` | Cargo 런타임 대체: 기본 레이아웃, 글자 크기 공식, 갤러리(justify / columnized / grid / freeform / slideshow), 이미지 확대 |
| `site.css` | 빌드가 `_cargo/site.css`에서 만든다 (폰트 치환 포함) |
| `media/` | 원본 이미지 (Cargo에서 받은 webp, 해시 이름) |
| `video/` | 0.1도의 재조립 영상 3개 (자동 반복 재생) |
| `404.html` | 없는 주소 → 메인으로 |
| `CNAME` | 커스텀 도메인 |

## 수정하는 법

**글자 교정** → `_cargo/build.js` 의 `FIXES` 에 `['페이지', '원래 글', '바꿀 글']` 한 줄 추가 후 빌드.

```bash
node _cargo/build.js
```

빌드는 교정할 문장을 못 찾으면 멈춘다 (조용히 틀리지 않게). 원문에 눈에 안 보이는 공백이 섞인 경우는 정규식으로 적는다 (예: `/\sㅅ<br \/>/`).

**영상 교체** → `VIDEO` 에서 Vimeo ID를 YouTube ID(`yt:...`) 또는 `video/파일.mp4` 로 매핑.

**레이아웃/동작** → `cargo.css`, `cargo.js`. 글자 크기는 Cargo 공식을 그대로 쓴다: `min(창 너비, 높이) × (9 + 5×세로비율) / 100 × 0.16` (px, `--base-size`). 모바일(너비 768 이하이고 세로 화면)은 여기에 0.12배.

**배포**

```bash
git add -A
git commit -m "무엇을 바꿨는지"
git push
```

## 지금까지 한 것 (2026-09-27)

- Cargo → GitHub Pages 이전, 도메인 DNS를 GitHub로 연결, HTTPS 강제 적용
- Cargo 원본 디자인 재현 (폰트 Diatype는 Cargo 전용이라 Pretendard로 대체)
- Vimeo 구독 만료 → 영상은 YouTube(@hunter-h9k)와 직접 올린 MP4로 대체
- 메뉴 통일: main / project 같은 크기·순서(Artwork, Project, About)·위치, 줄바꿈 금지
- 오타·표기 교정 (목록은 `FIXES`), 작가명 Yoon-Jeong Han, momentum 2024
- 갤러리 줄이 반 픽셀 차이로 넘쳐 무너지던 문제 수정

## 남은 일

- [ ] Cargo 구독 해지. 도메인은 Cargo에서 구매했으므로 해지해도 도메인이 유지되는지 먼저 확인. 도메인까지 Cargo를 떠나려면 Auth code를 받아 Cloudflare 등으로 이전
- [ ] 구독을 끊으면 chooheonsoo.cargo.site 원본이 사라질 수 있다. 필요한 원본 데이터는 `_cargo/`와 `media/`에 이미 다 있다
- [ ] YouTube 영상이 "공개" 상태. 채널 목록에서 숨기려면 "일부 공개"로 (사이트 재생에는 영향 없음)
- [ ] 모바일 화면 세부 점검 (Cargo 모바일 설정을 근사한 것이라 페이지별로 확인 필요)

## 참고

- `renewal-wip` 브랜치: 중간에 시도했다 되돌린 리디자인(에디토리얼 레이아웃, 본명조, TV 벽 인트로). 배포되지 않음, 참고용
