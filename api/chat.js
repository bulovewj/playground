function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

const SYSTEM_PROMPT = `당신은 장애 아동 보호자와 특수교사를 위한 부산 놀이터 추천 도우미입니다.
따뜻하고 친절한 말투로 답변하세요.

아래 데이터를 참고하여 조건에 맞는 놀이터를 추천해주세요.

[현재 위치 정보]
{location_info}

[놀이터 기본 정보 — 현재 위치에서 가까운 순]
{playgrounds_json}

[놀이터별 태그 집계 — 실제 보호자 후기 기반]
{tag_summary_json}
형식: { "놀이터ID": { "태그명": 후기수, ... }, ... }
예시: { "busan_1234567": { "조용함": 11, "바닥안전": 5 } }
이 데이터에 없는 놀이터는 아직 후기가 없는 곳입니다.

대화 흐름:
- 사용자가 처음 말을 걸면 아래 3가지를 파악한 뒤 추천하세요.
  1) 아이의 장애 유형 또는 특성 (예: 자폐, 휠체어, 감각 예민 등)
  2) 원하는 환경이나 활동 (예: 조용함, 물놀이, 그늘, 촉감 자극 등)
  3) 이동 수단 또는 거리 제약 (예: 도보 10분, 자차, 대중교통 등)
- 이미 여러 정보를 한 번에 알려줬다면 부족한 것만 추가로 물어보세요.

답변 규칙:
- 추천은 최대 3개
- 각 추천마다 선정 이유를 구체적으로 설명
- 선정 이유에 태그 집계 수치를 근거로 활용 (예: "조용함 후기가 11개로 가장 많습니다")
- 사용자가 장애 유형을 언급하면 관련 태그를 우선 참고:
  · 지체장애/휠체어 → 휠체어편리, 바닥안전
  · 자폐성장애 → 조용함, 안전한울타리
  · 시각장애 → 촉감놀이기구
  · 지적장애 → 안전한울타리, 쉴공간있음
- 후기가 없는 놀이터(tag_summary에 없음)는 "아직 후기가 없어요"라고 안내하고 기본 공공데이터 기준으로만 설명
- 확인되지 않은 정보는 "직접 확인이 필요해요"라고 답변
- 추천 시 현재 위치로부터의 거리(km)를 함께 알려주세요
- 놀이터 이름을 언급할 때는 정확한 이름 사용`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CLAUDE_API_KEY || process.env.REACT_APP_CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Claude API key is not configured' });
  }

  try {
    const { message, history = [], playgrounds = [], userLocation = null, tagSummaries = {} } = req.body || {};
    const userText = String(message || '').trim();
    if (!userText) return res.status(400).json({ error: 'Message is required' });

    const safeHistory = history
      .filter((m) => ['assistant', 'user'].includes(m.role) && m.content)
      .slice(-8)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

    // 위치 기반 거리 계산 및 정렬
    let sortedPlaygrounds = playgrounds.slice(0, 50);
    let locationInfo = '위치 정보 없음 — 전체 목록에서 추천합니다.';
    if (userLocation?.lat && userLocation?.lng) {
      sortedPlaygrounds = playgrounds
        .map((pg) => ({
          ...pg,
          distance_km: pg.latitude && pg.longitude
            ? Math.round(haversineKm(userLocation.lat, userLocation.lng, pg.latitude, pg.longitude) * 10) / 10
            : 999,
        }))
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 50);
      locationInfo = `위도 ${userLocation.lat.toFixed(4)}, 경도 ${userLocation.lng.toFixed(4)} — 가까운 순으로 정렬됨`;
    }

    const system = SYSTEM_PROMPT
      .replace('{location_info}', locationInfo)
      .replace('{playgrounds_json}', JSON.stringify(sortedPlaygrounds))
      .replace('{tag_summary_json}', JSON.stringify(tagSummaries));

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages: [...safeHistory, { role: 'user', content: userText }],
      }),
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data?.error?.message || 'Claude API error' });
    }

    return res.status(200).json({ text: data.content?.[0]?.text || '응답을 받지 못했어요.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
};
