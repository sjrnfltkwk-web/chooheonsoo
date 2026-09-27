# chooheonsoo.com

Cargo를 쓰지 않는 정적 사이트. 빌드 없음. `index.html`을 더블클릭해도 열린다.

| 파일 | 역할 |
|---|---|
| `works.js` | 작품 13개의 데이터 (텍스트, 이미지 경로, Vimeo ID). **작품 수정은 여기서.** |
| `index.html` / `project.html` / `about.html` / `work.html` | 페이지 (About 내용은 about.html에 직접) |
| `style.css`, `app.js` | 디자인, 렌더링 |
| `img/<작품>/` | 이미지 (`cover.webp` = 목록 썸네일) |
| `404.html` | 예전 Cargo 주소(`/remains` 등) → 새 주소로 이동 |
| `_cargo/` | Cargo에서 가져온 원본과 변환 스크립트. 사이트엔 안 쓰임 |

## 작품 추가
1. `img/새작품/`에 `cover.webp`, `00.webp`, `01.webp`... 넣기
2. `works.js`에서 기존 작품 하나를 복사해 붙이고 값 바꾸기 (`section`: `artwork` 또는 `project`)

## 배포 (GitHub Pages)
1. GitHub에서 새 저장소 생성 (예: `chooheonsoo.com`), 이 폴더 내용을 올림 (`_cargo/`는 빼도 됨)
2. 저장소 Settings → Pages → Branch `main` / root 선택
3. Custom domain 에 `chooheonsoo.com` (CNAME 파일 이미 있음), Enforce HTTPS 체크

## 도메인 연결 (Cargo에서 구매한 도메인)
Cargo 도메인 관리 화면의 DNS에 추가:
- `A` 레코드 4개 (@): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `CNAME` (www): `<github아이디>.github.io`

연결 확인 후 Cargo 구독 해지. 도메인 갱신이 Cargo에 묶여 있으니, 완전히 떠나려면 Cargo에서 Auth code 받아 Cloudflare 등으로 이전.

## 영상
`works.js`의 `videos`에 셋 중 하나를 넣는다:
- YouTube 영상 ID 11자리 (`youtu.be/` 뒤 부분). 예: `"dQw4w9WgXcQ"`
- 직접 올린 파일: `video/` 폴더에 넣고 `"video/파일.mp4"` (파일당 100MB 미만, 짧은 클립용)
- Vimeo ID (구독 만료로 현재 재생 안 됨)
