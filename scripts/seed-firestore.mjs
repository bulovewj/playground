/**
 * 더미 후기 데이터를 Firestore에 시드합니다.
 * 실행: node scripts/seed-firestore.mjs
 * (Firestore 보안 규칙이 테스트 모드여야 합니다)
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDb920mFcAGauKEiJ5EqEBoXVq-YNJtqAI',
  authDomain: 'playground-cef8f.firebaseapp.com',
  projectId: 'playground-cef8f',
  storageBucket: 'playground-cef8f.firebasestorage.app',
  messagingSenderId: '519843777116',
  appId: '1:519843777116:web:b33de7edaf09ccb9c1f499',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLAYGROUND_ID = 'busan_yeonje_hyundai_001';
const PLAYGROUND_NAME = '현대아파트 어린이놀이터';

const reviews = [
  {
    id: 'review_001',
    author: '연산동 엄마',
    child_disability: '자폐성장애',
    tags: ['조용함', '쉴공간있음', '안전한울타리'],
    rating: 5,
    content: '아이가 정말 좋아하는 곳이에요. 주변이 조용하고 울타리가 있어서 혼자 놀아도 안심이 돼요. 그늘막도 있어서 여름에도 오래 있을 수 있어요.',
    createdAt: new Date('2026-04-15'),
    photo_urls: [],
  },
  {
    id: 'review_002',
    author: '북구 아빠',
    child_disability: '지체장애',
    tags: ['휠체어편리', '바닥안전', '청결함'],
    rating: 4,
    content: '휠체어 끌고 오기 좋아요. 바닥이 고무매트라 미끄럽지 않고 청결하게 관리되고 있어요. 입구 경사로가 있어서 진입이 수월해요.',
    createdAt: new Date('2026-04-08'),
    photo_urls: [],
  },
  {
    id: 'review_003',
    author: '해운대 특수교사',
    child_disability: null,
    tags: ['조용함', '청결함', '안전한울타리'],
    rating: 5,
    content: '감각 예민한 아이들 데리고 자주 오는데 소음이 적고 관리가 잘 돼있어요. 아이들이 집중해서 놀 수 있는 환경이라 좋아요.',
    createdAt: new Date('2026-03-22'),
    photo_urls: [],
  },
  {
    id: 'review_004',
    author: '수영구 맘',
    child_disability: '지적장애',
    tags: ['촉감놀이기구', '쉴공간있음', '바닥안전'],
    rating: 4,
    content: '모래놀이 공간이 있어서 촉감 자극에 좋아요. 벤치도 있어서 보호자가 쉬면서 볼 수 있고요. 다만 주차 공간이 조금 협소해요.',
    createdAt: new Date('2026-03-10'),
    photo_urls: [],
  },
  {
    id: 'review_005',
    author: '동래구 엄마',
    child_disability: '자폐성장애',
    tags: ['조용함', '안전한울타리'],
    rating: 3,
    content: '조용하고 울타리가 있는 건 좋은데 기구 수가 적어서 금방 심심해해요. 그래도 접근성은 좋은 편이에요.',
    createdAt: new Date('2026-02-28'),
    photo_urls: [],
  },
  {
    id: 'review_006',
    author: '연제구 보호자',
    child_disability: '시각장애',
    tags: ['바닥안전', '청결함', '쉴공간있음'],
    rating: 5,
    content: '바닥 재질이 부드럽고 단차가 없어서 안전해요. 항상 깨끗하게 유지되고 있고, 그늘 공간이 충분해서 사계절 이용 가능해요.',
    createdAt: new Date('2026-02-14'),
    photo_urls: [],
  },
  {
    id: 'review_007',
    author: '금정구 아빠',
    child_disability: '청각장애',
    tags: ['물놀이가능', '쉴공간있음', '청결함'],
    rating: 4,
    content: '여름에 물놀이도 할 수 있어서 아이가 정말 좋아해요. 물이 빠지는 배수도 잘 되어있고 주변에 벤치가 많아서 보호자들이 편하게 대화하며 쉴 수 있어요.',
    createdAt: new Date('2026-01-30'),
    photo_urls: [],
  },
  {
    id: 'review_008',
    author: '사하구 엄마',
    child_disability: null,
    tags: ['조용함', '바닥안전', '휠체어편리'],
    rating: 4,
    content: '아파트 단지 안이라 외부 차량이 없어서 안전해요. 휠체어도 무리 없이 다닐 수 있는 넓은 통로가 있어요.',
    createdAt: new Date('2026-01-12'),
    photo_urls: [],
  },
];

const tagSummary = {
  휠체어편리: 4,
  조용함: 11,
  촉감놀이기구: 3,
  쉴공간있음: 9,
  청결함: 7,
  안전한울타리: 8,
  물놀이가능: 2,
  바닥안전: 6,
  total_reviews: 14,
  average_rating: 4.2,
  updatedAt: new Date(),
};

async function seed() {
  console.log('Firestore 시드 시작...\n');

  console.log('후기 업로드 중:');
  for (const { id, ...review } of reviews) {
    await setDoc(doc(db, 'reviews', id), {
      ...review,
      playgroundId: PLAYGROUND_ID,
      playgroundName: PLAYGROUND_NAME,
    });
    console.log(`  ✓ ${review.author} (별점 ${review.rating})`);
  }

  console.log('\n태그 집계 업로드 중:');
  await setDoc(doc(db, 'tag_summary', PLAYGROUND_ID), tagSummary);
  console.log(`  ✓ tag_summary (총 ${tagSummary.total_reviews}개, 평균 ${tagSummary.average_rating}점)`);

  console.log('\n완료! Firestore 콘솔에서 확인하세요.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});
