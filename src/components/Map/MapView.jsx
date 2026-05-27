import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import centersData from '../../data/specialed_centers.json';
import dummyData from '../../data/dummy_reviews_100.json';
import styles from './MapView.module.css';
import { TAG_ICONS, TAG_COLORS, getReviewsForPlayground, getTagSummary } from '../../utils/playgroundReviewUtils';

const SEOMYEON_CENTER = { lat: 35.1578, lng: 129.0594 };

function weatherInfo(code) {
  if (code === 0) return { icon: '☀️', label: '화창' };
  if (code <= 2) return { icon: '🌤', label: '맑음' };
  if (code === 3) return { icon: '☁️', label: '흐림' };
  if (code <= 48) return { icon: '🌫', label: '안개' };
  if (code <= 57) return { icon: '🌦', label: '이슬비' };
  if (code <= 67) return { icon: '🌧', label: '비' };
  if (code <= 77) return { icon: '❄️', label: '눈' };
  if (code <= 82) return { icon: '🌦', label: '소나기' };
  if (code <= 86) return { icon: '🌨', label: '눈소나기' };
  return { icon: '⛈', label: '뇌우' };
}

function pm10Grade(val) {
  if (val <= 30) return { label: '좋음', color: '#2196F3' };
  if (val <= 80) return { label: '보통', color: '#43A047' };
  if (val <= 150) return { label: '나쁨', color: '#FB8C00' };
  return { label: '매우나쁨', color: '#E53935' };
}
const DEFAULT_ZOOM = 7;
const DISTRICT_VIEW_LEVEL = 8;

const HIGHLIGHT_MARKER = {
  src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
  size: { w: 24, h: 35 },
};

const markerCache = {};


function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMarkerDataUrl(tag) {
  if (markerCache[tag]) return markerCache[tag];
  const W = 32, H = 32, R = 14;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const color = TAG_COLORS[tag] || '#2E7D32';

  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  ctx.beginPath();
  ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();

  ctx.font = '16px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(TAG_ICONS[tag] || '🏞', W / 2, H / 2);

  markerCache[tag] = canvas.toDataURL();
  return markerCache[tag];
}

function getTopTag(pg, firestoreSummaries) {
  const fs = firestoreSummaries?.[pg.id];
  if (fs) {
    const entry = Object.entries(fs)
      .filter(([k, v]) => TAG_COLORS[k] && typeof v === 'number' && v > 0)
      .sort((a, b) => b[1] - a[1])[0];
    if (entry) return entry[0];
  }
  const reviews = getReviewsForPlayground(pg.id, dummyData.reviews);
  const { topTags } = getTagSummary(reviews);
  return topTags[0]?.tag || null;
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

function applyFilters(list, f) {
  if (!f) return list;
  const hasActive = Object.values(f).some((v) => v?.length > 0);
  if (!hasActive) return list;

  return list.filter((pg) => {
    if (f.types?.length && !f.types.includes(pg.type)) return false;
    if (f.ownership?.length && !f.ownership.includes(pg.public_private)) return false;
    if (f.districts?.length && !f.districts.includes(pg.district)) return false;
    if (f.placeTypes?.length && !f.placeTypes.includes(pg.place_type)) return false;
    if (f.tags?.length) {
      const reviews = getReviewsForPlayground(pg.id, dummyData.reviews);
      const pgTags = new Set(reviews.flatMap((r) => r.tags || []));
      if (!f.tags.some((t) => pgTags.has(t))) return false;
    }
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

export default function MapView({ playgrounds, filters, onSelectPlayground, highlightId, focusTarget, isActive }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const centerMarkersRef = useRef([]);
  const allMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const showCentersRef = useRef(true);
  const myLocationMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapViewState, setMapViewState] = useState({ showDistricts: false, swLat: 0, swLng: 0, neLat: 0, neLng: 0 });
  const [tagSummaries, setTagSummaries] = useState({});
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tag_summary'), (snap) => {
      const s = {};
      snap.docs.forEach((d) => { s[d.id] = d.data(); });
      setTagSummaries(s);
    }, () => {});
    return unsub;
  }, []);

  const filteredPlaygrounds = useMemo(
    () => applyFilters(playgrounds || [], filters),
    [playgrounds, filters]
  );

  const filteredCounts = useMemo(() => {
    const counts = {};
    filteredPlaygrounds.forEach((pg) => {
      if (pg.district) counts[pg.district] = (counts[pg.district] || 0) + 1;
    });
    return counts;
  }, [filteredPlaygrounds]);

  const initMap = useCallback(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new window.kakao.maps.Map(containerRef.current, {
      center: new window.kakao.maps.LatLng(SEOMYEON_CENTER.lat, SEOMYEON_CENTER.lng),
      level: DEFAULT_ZOOM,
    });
    mapRef.current = map;
    infoWindowRef.current = new window.kakao.maps.InfoWindow({ zIndex: 1 });

    addCenterMarkers(map);
    setMapReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao?.maps) return;
    window.kakao.maps.load(initMap);

    const centerMarkers = centerMarkersRef.current;
    return () => {
      allMarkersRef.current.forEach((m) => m.setMap(null));
      centerMarkers.forEach((m) => m.setMap(null));
    };
  }, [initMap]);

  // 지도 줌/팬 상태 추적 → 구별 버블 표시 여부 + 위치 계산용 bounds
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;

    function updateViewState() {
      const level = map.getLevel();
      if (level >= DISTRICT_VIEW_LEVEL) {
        allMarkersRef.current.forEach((m) => m.setMap(null));
        const bnds = map.getBounds();
        setMapViewState({
          showDistricts: true,
          swLat: bnds.getSouthWest().getLat(),
          swLng: bnds.getSouthWest().getLng(),
          neLat: bnds.getNorthEast().getLat(),
          neLng: bnds.getNorthEast().getLng(),
        });
      } else {
        allMarkersRef.current.forEach((m) => m.setMap(map));
        setMapViewState((prev) => prev.showDistricts ? { showDistricts: false, swLat: 0, swLng: 0, neLat: 0, neLng: 0 } : prev);
      }
    }

    updateViewState();
    window.kakao.maps.event.addListener(map, 'zoom_changed', updateViewState);
    window.kakao.maps.event.addListener(map, 'center_changed', updateViewState);

    return () => {
      window.kakao.maps.event.removeListener(map, 'zoom_changed', updateViewState);
      window.kakao.maps.event.removeListener(map, 'center_changed', updateViewState);
    };
  }, [mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // 놀이터 마커 갱신 — 필터 적용 및 화면 표시
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !playgrounds?.length) return;

    // 기존 마커 전부 제거
    allMarkersRef.current.forEach((m) => m.setMap(null));
    allMarkersRef.current = [];
    Object.keys(markerCache).forEach((k) => delete markerCache[k]);

    const markers = filteredPlaygrounds.map((pg) => createPlaygroundMarker(map, pg));
    allMarkersRef.current = markers;

    const level = map.getLevel();
    if (level < DISTRICT_VIEW_LEVEL) {
      // 마커 뷰: 필터된 마커 즉시 표시
      markers.forEach((m) => m.setMap(map));
    }
    // 구별 뷰: 마커는 allMarkersRef에 대기, 구별 버블은 district useEffect에서 필터 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPlaygrounds, tagSummaries]);

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
      const tag = getTopTag(pg, tagSummaries);
      markerOptions.image = new window.kakao.maps.MarkerImage(
        buildMarkerDataUrl(tag),
        new window.kakao.maps.Size(32, 32),
        { offset: new window.kakao.maps.Point(16, 16) }
      );
    }

    const marker = new window.kakao.maps.Marker(markerOptions);

    window.kakao.maps.event.addListener(marker, 'click', () => {
      infoWindowRef.current.setContent(
        `<div style="padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap;">${escapeHtml(pg.name)}</div>`
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
          `<div style="padding:6px 10px;font-size:12px;color:#1565C0;font-weight:600;">${escapeHtml(center.name)}</div>`
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

  const fetchWeatherData = useCallback(async (lat, lng) => {
    setWeatherLoading(true);
    try {
      const [wxRes, aqRes] = await Promise.all([
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weathercode&timezone=Asia%2FSeoul&forecast_days=1`),
        fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm10&timezone=Asia%2FSeoul`),
      ]);
      const wx = await wxRes.json();
      const aq = await aqRes.json();

      const nowKST = new Date(Date.now() + 9 * 3600 * 1000);
      const currentHourStr = nowKST.toISOString().slice(0, 13);
      const times = wx.hourly.time;
      let idx = times.findIndex((t) => t.startsWith(currentHourStr));
      if (idx < 0) idx = 0;

      const slots = [0, 1, 2, 3].map((offset) => {
        const i = Math.min(idx + offset, times.length - 1);
        return {
          label: offset === 0 ? '지금' : `${offset}시간 후`,
          temp: Math.round(wx.hourly.temperature_2m[i] ?? 0),
          code: wx.hourly.weathercode[i] ?? 0,
          pm10: Math.round(aq.hourly.pm10?.[i] ?? 0),
        };
      });
      setWeatherData(slots);
    } catch {
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const toggleWeather = useCallback(() => {
    if (showWeather) { setShowWeather(false); return; }
    setShowWeather(true);
    setWeatherData(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeatherData(SEOMYEON_CENTER.lat, SEOMYEON_CENTER.lng)
      );
    } else {
      fetchWeatherData(SEOMYEON_CENTER.lat, SEOMYEON_CENTER.lng);
    }
  }, [showWeather, fetchWeatherData]);

  const moveToCurrentLocation = useCallback(() => {
    if (!mapRef.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        mapRef.current.setCenter(latlng);
        mapRef.current.setLevel(4);

        if (myLocationMarkerRef.current) myLocationMarkerRef.current.setMap(null);

        const canvas = document.createElement('canvas');
        canvas.width = 24; canvas.height = 24;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(12, 12, 11, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(12, 12, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#1565C0';
        ctx.fill();

        myLocationMarkerRef.current = new window.kakao.maps.Marker({
          map: mapRef.current,
          position: latlng,
          image: new window.kakao.maps.MarkerImage(
            canvas.toDataURL(),
            new window.kakao.maps.Size(24, 24),
            { offset: new window.kakao.maps.Point(12, 12) }
          ),
        });
      },
      () => alert('위치 정보를 가져올 수 없어요.')
    );
  }, []);

  const { showDistricts, swLat, swLng, neLat, neLng } = mapViewState;
  const lngRange = neLng - swLng;
  const latRange = neLat - swLat;

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />

      {showDistricts && lngRange > 0 && DISTRICT_CENTERS.map(({ name, lat, lng }) => {
        const count = filteredCounts[name] || 0;
        if (count === 0) return null;
        const x = ((lng - swLng) / lngRange) * 100;
        const y = (1 - (lat - swLat) / latRange) * 100;
        return (
          <button
            key={name}
            className={styles.districtBubble}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => {
              mapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
              mapRef.current.setLevel(DISTRICT_VIEW_LEVEL - 1);
            }}
          >
            <span className={styles.districtCount}>{count}</span>
            <span className={styles.districtName}>{name}</span>
          </button>
        );
      })}

      <button className={styles.toggleBtn} onClick={toggleCenters}>
        🏫 지원센터
      </button>
      <button className={styles.locationBtn} onClick={moveToCurrentLocation}>
        📍 내 위치
      </button>
      <button className={styles.weatherBtn} onClick={toggleWeather}>
        🌤 오늘 날씨
      </button>

      {showWeather && (
        <div className={styles.weatherPanel}>
          <div className={styles.weatherPanelTitle}>현재 위치 날씨</div>
          {weatherLoading && <div className={styles.weatherLoading}>불러오는 중…</div>}
          {!weatherLoading && !weatherData && (
            <div className={styles.weatherError}>날씨 정보를 가져올 수 없어요</div>
          )}
          {!weatherLoading && weatherData && weatherData.map((slot) => {
            const wx = weatherInfo(slot.code);
            const dust = pm10Grade(slot.pm10);
            return (
              <div key={slot.label} className={styles.weatherRow}>
                <span className={styles.weatherTime}>{slot.label}</span>
                <span className={styles.weatherIcon}>{wx.icon}</span>
                <span className={styles.weatherCond}>{wx.label}</span>
                <span className={styles.weatherTemp}>{slot.temp}°</span>
                <span className={styles.dustBadge} style={{ color: dust.color }}>{dust.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
