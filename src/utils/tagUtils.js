export const TAGS = [
  { id: '휠체어편리', icon: '♿' },
  { id: '조용함',     icon: '🌿' },
  { id: '촉감놀이기구', icon: '🖐' },
  { id: '쉴공간있음', icon: '☀️' },
  { id: '청결함',     icon: '🧹' },
  { id: '안전한울타리', icon: '🔒' },
  { id: '물놀이가능', icon: '🌊' },
  { id: '바닥안전',   icon: '🐾' },
];

export const DISABILITY_TYPES = [
  '지체장애', '자폐성장애', '지적장애',
  '시각장애', '청각장애', '기타',
];

export const DISTRICTS = [
  '중구','서구','동구','영도구','부산진구','동래구','남구','북구',
  '해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군',
];

// 태그 목록에서 상위 N개 반환
export function getTopTags(tagSummary, n = 3) {
  if (!tagSummary) return [];
  return Object.entries(tagSummary)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// 태그 ID → 아이콘
export function getTagIcon(tagId) {
  return TAGS.find((t) => t.id === tagId)?.icon ?? '';
}
