import { useEffect, useRef, useCallback, useState } from 'react';
import centersData from '../../data/specialed_centers.json';
import styles from './MapView.module.css';

const DONGRAE_CENTER = { lat: 35.2043, lng: 129.0847 };
const DEFAULT_ZOOM = 9;
const DISTRICT_VIEW_LEVEL = 8; // 이 레벨 이상이면 구별 클러스터 표시

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

  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(W / 2, R + 1, R, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.beginPath();
  ctx.moveTo(W / 2 - 5, R * 2 - 1);
  ctx.lineTo(W / 2 + 5, R * 2 - 1);
  ctx.lineTo(W / 2, H - 3);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();

  ctx.beginPath();
  ctx.arc(W / 2, R + 1, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();

  ctx.font = '13px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
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

const DISTRICT_CENTERS = [
  { name: '중구',    lat: 35.1042, lng: 129.0327 },
  { name: '서구',    lat: 35.0985, lng: 129.0194 },
  { name: '동구',    lat: 35.1305, lng: 129.0435 },
  { name: '영도구',  lat: 35.0913, lng: 129.0680 },
  { name: '부산진구', lat: 35.1598, lng: 129.0530 },
  { name: '동래구',  lat: 35.2043, lng: 129.0847 },
  { name: '남구',    lat: 35.1364, lng: 129.0846 },
  { name: '북구',    lat: 35.1974, lng: 128.9898 },
  { name: '해운대구', lat: 35.1631, lng: 129.1639 },
  { name: '사하구',  lat: 35.0996, lng: 128.9741 },
  { name: '금정구',  lat: 35.2429, lng: 129.0926 },
  { name: '강서구',  lat: 35.2122, lng: 128.9817 },
  { name: '연제구',  lat: 35.1762, lng: 129.0806 },
  { name: '수영구',  lat: 35.1456, lng: 129.1135 },
  { name: '사상구',  lat: 35.1528, lng: 128.9919 },
  { name: '기장군',  lat: 35.2447, lng: 129.2220 },
];

export default function MapView({ playgrounds, filters, onSelectPlayground, highlightId, focusTarget, isActive }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const clustererRef = useRef(null);
  const centerMarkersRef = useRef([]);
  const districtOverlaysRef = useRef([]);
  const allMarkersRef = useRef([]);
  const zoomHandlerRef = useRef(null);
  const infoWindowRef = useRef(null);
  const showCentersRef = useRef(true);
  const [mapReady, setMapReady] = useState(false);

  const initMap = useCallback(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(DONGRAE_CENTER.lat, DONGRAE_CENTER.lng),
      level: DEFAULT_ZOOM,
    });
    mapRef.current = map;
    infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });

    if (window.kakao.maps.MarkerClusterer) {
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 5,
        disableClickZoom: false,
        styles: [{
          width: '44px', height: '44px',
          background: 'rgba(46,125,50,0.9)',
          borderRadius: '50%',
          color: '#fff',
          textAlign: 'center',
          lineHeight: '44px',
          fontSize: '15px',
          fontWeight: '700',
          border: '2px solid rgba(255,255,255,0.8)',
        }],
      });
    }

    addCenterMarkers(map);
    setMapReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao?.maps) return;
    window.kakao.maps.load(initMap);

    const centerMarkers = centerMarkersRef.current;
    return () => {
      clustererRef.current?.clear();
      centerMarkers.forEach((m) => m.setMap(null));
    };
  }, [initMap]);

  // 구별 클러스터 오버레이 — 지도+놀이터 데이터 준비 후 생성
  useEffect(() => {
    if (!mapReady || !playgrounds?.length) return;
    const map = mapRef.current;

    // 구별 놀이터 수 집계
    const counts = {};
    playgrounds.forEach((pg) => {
      if (pg.district) counts[pg.district] = (counts[pg.district] || 0) + 1;
    });

    // 기존 오버레이 제거
    districtOverlaysRef.current.forEach((o) => o.setMap(null));

    // 구 클릭 → 해당 구로 줌인
    window._zoomToDistrict = (lat, lng) => {
      if (!mapRef.current) return;
      mapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      mapRef.current.setLevel(DISTRICT_VIEW_LEVEL - 1);
    };

    // 구별 버블 오버레이 생성
    const overlays = DISTRICT_CENTERS.map(({ name, lat, lng }) => {
      const count = counts[name] || 0;
      const content = `<div onclick="window._zoomToDistrict(${lat},${lng})" style="width:56px;height:56px;background:rgba(46,125,50,0.92);border-radius:50%;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2.5px solid rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;gap:1px"><span style="font-size:16px;font-weight:700;line-height:1">${count}</span><span style="font-size:9px;font-weight:600;opacity:0.92;line-height:1.2">${name}</span></div>`;
      return new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(lat, lng),
        content,
        yAnchor: 0.5,
        zIndex: 5,
      });
    });
    districtOverlaysRef.current = overlays;

    // 줌 레벨에 따라 뷰 전환
    function applyView() {
      const level = map.getLevel();
      if (level >= DISTRICT_VIEW_LEVEL) {
        // 구별 뷰: 마커 숨김, 구 버블 표시
        clustererRef.current?.clear();
        overlays.forEach((o) => o.setMap(map));
      } else {
        // 상세 뷰: 구 버블 숨김, 마커 표시
        overlays.forEach((o) => o.setMap(null));
        if (allMarkersRef.current.length) {
          clustererRef.current?.addMarkers(allMarkersRef.current);
        }
      }
    }

    // 기존 줌 리스너 제거 후 재등록
    if (zoomHandlerRef.current) {
      window.kakao.maps.event.removeListener(map, 'zoom_changed', zoomHandlerRef.current);
    }
    zoomHandlerRef.current = applyView;
    window.kakao.maps.event.addListener(map, 'zoom_changed', applyView);
    applyView();

    return () => {
      window.kakao.maps.event.removeListener(map, 'zoom_changed', applyView);
      overlays.forEach((o) => o.setMap(null));
    };
  }, [mapReady, playgrounds]); // eslint-disable-line react-hooks/exhaustive-deps

  // 놀이터 마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !playgrounds?.length) return;

    const filtered = applyFilters(playgrounds, filters);
    const markers = filtered.map((pg) => createPlaygroundMarker(map, pg));
    allMarkersRef.current = markers;

    // 현재 줌 레벨에 따라 마커 또는 구 뷰 적용
    const level = map.getLevel();
    if (level < DISTRICT_VIEW_LEVEL) {
      clustererRef.current?.clear();
      if (clustererRef.current) {
        clustererRef.current.addMarkers(markers);
      } else {
        markers.forEach((m) => m.setMap(map));
      }
    }
    // 구별 뷰 상태면 clusterer는 비워둠 (zoom handler가 관리)
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

  const moveToCurrentLocation = useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapRef.current.setCenter(latlng);
        mapRef.current.setLevel(4);
      },
      () => alert('위치 정보를 가져올 수 없어요.')
    );
  }, []);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      <button className={styles.toggleBtn} onClick={toggleCenters}>
        🏫 지원센터
      </button>
      <button className={styles.locationBtn} onClick={moveToCurrentLocation}>
        📍 내 위치
      </button>
    </div>
  );
}
