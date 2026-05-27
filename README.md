# 놀이터 접근성 지도

부산 장애아동 보호자를 위한 놀이터 접근성 지도입니다. 놀이터 위치, 편의시설, 보호자 후기, 특수교육지원센터 정보, AI 추천을 제공합니다.

## 실행

```bash
npm install
npm start
```

로컬 앱 URL은 `http://localhost:3000`입니다.

AI 추천 API까지 함께 확인하려면 Vercel 개발 서버로 실행하세요.

```bash
npx vercel dev
```

## 환경 변수

`.env.example`을 참고해 `.env`를 구성합니다.

```bash
REACT_APP_KAKAO_MAP_KEY=
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
CLAUDE_API_KEY=
```

`CLAUDE_API_KEY`는 서버리스 API에서만 사용합니다. 브라우저에 노출되는 `REACT_APP_` 접두사를 붙이지 마세요.

## 주요 스크립트

```bash
npm test -- --watchAll=false
npm run build
```

## 배포

Vercel 배포를 기준으로 `api/chat.js` 서버리스 함수와 React 정적 빌드를 함께 사용합니다. SPA 라우팅은 `vercel.json`의 rewrite 설정으로 처리합니다.
