import { useEffect, useRef, useCallback } from 'react';
import centersData from '../../data/specialed_centers.json';
import styles from './MapView.module.css';

const BUSAN_CENTER = { lat: 35.1837, lng: 129.0946 };
const DEFAULT_ZOOM = 13;

const HIGHLIGHT_MARKER = {
  src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
  size: { w: 24, h: 35 },
};

const TAG_LIST = ['휠체어편리', '조용함', '촉감놀이기구', '쉴공간있음', '청결함', '안전한울타리', '물놀이가능', '바닥안전'];
const TAG_EMOJI = { '휠체어편리': '♿', '조용함': '🌿', '촉감놀이기구': '🖐', '쉴공간있음': '☀️', '청결함': '🧹', '안전한울타리': '🔒', '물놀이가능': '🌊', '바닥안전': '🐾' };
const TAG_COLOR = { '휠체어편리': '#1565C0', '조용함': '#388E3C', '촉감놀이기구': '#E64A19', '쉴공간있음': '#F9A825', '청결함': '#00897B', '안전한울타리': '#7B1FA2', '물놀이가능': '#0288D1', '바닥안전': '#558B2F' };

const markerCache = {};

function buildMarkerDataUrl(tag) {
  if (markerCache[tag]) return markerCache[tag];
  const W = 32, H = 44, R = 13;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const color = TAG_COLOR[tag] || '#2E7D32';

  // 핀 모양 (원 + 삼각형)
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(W / 2, R + 1, R, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.beginPath();
  ctx.moveTo(W / 2 - 5, R * 2 - 1);
  ctx.lineTo(W / 2 + 5, R * 2 - 1);
  ctx.lineTo(W / 2, H - 3);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // 흰 테두리
  ctx.beginPath();
  ctx.arc(W / 2, R + 1, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 이모지
  ctx.font = '13px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TAG_EMOJI[tag] || '🏞', W / 2, R + 1);

  markerCache[tag] = canvas.toDataURL();
  return markerCache[tag];
}

function getDemoTag(pg) {
  let h = 0;
  const s = pg.id || pg.name || '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffffff;
  return TAG_LIST[Math.abs(h) % TAG_LIST.length];
}

export default function MapView({ playgrounds, filters, onSelectPlayground, highlightId, focusTarget, isActive }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clustererRef = useRef(null);
  const centerMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const showCentersRef = useRef(true);

  const initMap = useCallback(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng),
      level: DEFAULT_ZOOM,
    });
    mapRef.current = map;
    infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });

    if (window.kakao.maps.MarkerClusterer) {
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 10,
        disableClickZoom: false,
        styles: [{
          width: '40px', height: '40px',
          background: 'rgba(46,125,50,0.85)',
          borderRadius: '50%',
          color: '#fff',
          textAlign: 'center',
          lineHeight: '40px',
          fontSize: '14px',
          fontWeight: '700',
        }],
      });
    }

    addCenterMarkers(map);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지도 초기화 — kakao.maps.load() 콜백으로 SDK 준비 후 실행
  useEffect(() => {
    if (!window.kakao?.maps) return;
    window.kakao.maps.load(initMap);

    const centerMarkers = centerMarkersRef.current;
    return () => {
      clustererRef.current?.clear();
      centerMarkers.forEach((m) => m.setMap(null));
    };
  }, [initMap]);

  // 놀이터 마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !playgrounds?.length) return;

    clustererRef.current?.clear();

    const filtered = applyFilters(playgrounds, filters);
    const markers = filtered.map((pg) => createPlaygroundMarker(map, pg));

    if (clustererRef.current) {
      clustererRef.current.addMarkers(markers);
    } else {
      markers.forEach((m) => m.setMap(map));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playgrounds, filters]);

  // 탭 활성화 시 초기화 재시도 또는 relayout
  useEffect(() => {
    if (!isActive) return;
    if (!mapRef.current && window.kakao?.maps) {
      window.kakao.maps.load(initMap);
    } else if (mapRef.current) {
      mapRef.current.relayout();
    }
  }, [isActive, initMap]);

  // 센터 포커스 이동
  useEffect(() => {
    if (!focusTarget || !mapRef.current) return;
    const pos = new window.kakao.maps.LatLng(focusTarget.latitude, focusTarget.longitude);
    mapRef.current.setCenter(pos);
    mapRef.current.setLevel(5);
  }, [focusTarget]);

  function applyFilters(list, f) {
    if (!f) return list;
    const hasActive = Object.values(f).some((v) => v?.length > 0);
    if (!hasActive) return list;

    return list.filter((pg) => {
      if (f.types?.length && !f.types.includes(pg.type)) return false;
      if (f.ownership?.length && !f.ownership.includes(pg.public_private)) return false;
      if (f.districts?.length && !f.districts.includes(pg.district)) return false;
      if (f.facilities?.length) {
        for (const fac of f.facilities) {
          if (fac === '주차장' && !pg.has_parking) return false;
          if (fac === '화장실' && !pg.near_toilet) return false;
          if (fac === '응급병원' && !pg.near_hospital) return false;
          if (fac === '경찰서' && !pg.near_police) return false;
        }
      }
      return true;
    });
  }

  function createPlaygroundMarker(map, pg) {
    const position = new window.kakao.maps.LatLng(pg.latitude, pg.longitude);
    const isHighlight = pg.id === highlightId;

    const markerOptions = { position };
    if (isHighlight) {
      markerOptions.image = new window.kakao.maps.MarkerImage(
        HIGHLIGHT_MARKER.src,
        new window.kakao.maps.Size(HIGHLIGHT_MARKER.size.w, HIGHLIGHT_MARKER.size.h)
      );
    } else {
      const tag = getDemoTag(pg);
      markerOptions.image = new window.kakao.maps.MarkerImage(
        buildMarkerDataUrl(tag),
        new window.kakao.maps.Size(32, 44),
        { offset: new window.kakao.maps.Point(16, 44) }
      );
    }

    const marker = new window.kakao.maps.Marker(markerOptions);

    window.kakao.maps.event.addListener(marker, 'click', () => {
      infoWindowRef.current.setContent(
        `<div style="padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap;">${pg.name}</div>`
      );
      infoWindowRef.current.open(map, marker);
      onSelectPlayground?.(pg);
    });

    return marker;
  }

  function addCenterMarkers(map) {
    centersData.centers.forEach((center) => {
      const position = new window.kakao.maps.LatLng(center.latitude, center.longitude);
      const marker = new window.kakao.maps.Marker({
        map,
        position,
        image: new window.kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_blue.png',
          new window.kakao.maps.Size(24, 35)
        ),
      });
      centerMarkersRef.current.push(marker);

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindowRef.current.setContent(
          `<div style="padding:6px 10px;font-size:12px;color:#1565C0;font-weight:600;">${center.name}</div>`
        );
        infoWindowRef.current.open(map, marker);
      });
    });
  }

  const toggleCenters = useCallback(() => {
    showCentersRef.current = !showCentersRef.current;
    centerMarkersRef.current.forEach((m) =>
      m.setMap(showCentersRef.current ? mapRef.current : null)
    );
  }, []);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      <button className={styles.toggleBtn} onClick={toggleCenters}>
        🏫 지원센터
      </button>
    </div>
  );
}
