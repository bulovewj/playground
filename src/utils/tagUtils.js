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

export const TAG_ICONS = Object.fromEntries(TAGS.map((t) => [t.id, t.icon]));

export const TAG_COLORS = {
  '휠체어편리': '#1976D2',
  '조용함':     '#388E3C',
  '촉감놀이기구': '#E65100',
  '쉴공간있음': '#F9A825',
  '청결함':     '#00897B',
  '안전한울타리': '#AB47BC',
  '물놀이가능': '#039BE5',
  '바닥안전':   '#8D6E63',
};

export const DISABILITY_TYPES = [
  '지체장애', '자폐성장애', '지적장애',
  '시각장애', '청각장애', '기타',
];

export const DISTRICTS = [
  '중구','서구','동구','영도구','부산진구','동래구','남구','북구',
  '해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군',
];

export const PLACE_TYPES = [
  { id: '도시공원',    icon: '🌳' },
  { id: '주택단지',    icon: '🏘️' },
  { id: '학교',       icon: '🏫' },
  { id: '어린이집',   icon: '👶' },
  { id: '유치원',     icon: '🎒' },
  { id: '아동복지시설', icon: '❤️' },
  { id: '놀이제공영업소', icon: '🎠' },
  { id: '식품접객업소', icon: '🍽️' },
  { id: '자연휴양림',  icon: '🌲' },
];

export const EMPTY_FILTERS = {
  types: [], ownership: [], placeTypes: [], tags: [], facilities: [], districts: [],
};

export function getTopTags(tagSummary, n = 3) {
  if (!tagSummary) return [];
  const tagIds = new Set(TAGS.map((t) => t.id));
  return Object.entries(tagSummary)
    .filter(([tag, count]) => tagIds.has(tag) && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

export function getTagIcon(tagId) {
  return TAG_ICONS[tagId] ?? '';
}
