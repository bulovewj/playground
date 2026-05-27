import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TAG_ICONS } from '../../utils/playgroundReviewUtils';
import dummyData from '../../data/dummy_reviews_100.json';
import styles from './HomeFeed.module.css';
import logoImg from '../../assets/logo.png';

const DUMMY_FEED = [...dummyData.reviews]
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 10);

const QUICK_FILTERS = [
  { tag: '휠체어편리', icon: '♿' },
  { tag: '조용함',     icon: '🌿' },
  { tag: '촉감놀이기구', icon: '🖐' },
  { tag: '쉴공간있음', icon: '☀️' },
  { tag: '물놀이가능', icon: '🌊' },
  { tag: '바닥안전',   icon: '🐾' },
];

function getPlaygroundForReview(reviewId, playgrounds) {
  if (!playgrounds?.length) return null;
  const num = parseInt(String(reviewId).replace(/\D/g, '')) || 0;
  return playgrounds[num % playgrounds.length];
}

export default function HomeFeed({ playgrounds, onQuickFilter, onGoMap, onGoToPlayground, onSelectPlayground }) {
  const [recentReviews, setRecentReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const searchResults = search.trim()
    ? (playgrounds || []).filter((pg) => pg.name?.includes(search.trim())).slice(0, 8)
    : [];

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecentReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  function handleQuickFilter(tag) {
    onQuickFilter(tag);
    onGoMap();
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.logoRow}>
          <img src={logoImg} alt="로고" className={styles.logoImg} />
          <div>
            <h1 className={styles.appName}>놀잇터 - 놀이를 잇는 공간</h1>
            <p className={styles.appSub}>부산 놀이터 접근성 지도</p>
          </div>
        </div>
        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            placeholder="🔍  놀이터 이름 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          />
          {showDropdown && searchResults.length > 0 && (
            <div className={styles.dropdown}>
              {searchResults.map((pg) => (
                <button
                  key={pg.id}
                  className={styles.dropdownItem}
                  onMouseDown={() => {
                    onSelectPlayground?.(pg);
                    setSearch('');
                    setShowDropdown(false);
                  }}
                >
                  <span className={styles.dropdownName}>{pg.name}</span>
                  <span className={styles.dropdownDistrict}>{pg.district}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* 빠른 필터 */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>태그로 빠른 탐색</p>
          <div className={styles.quickFilterRow}>
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.tag}
                className={styles.quickBtn}
                onClick={() => handleQuickFilter(f.tag)}
              >
                <span className={styles.quickIcon}>{f.icon}</span>
                <span className={styles.quickLabel}>{f.tag}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 최근 후기 피드 */}
        <section className={styles.section}>
          <p className={styles.sectionLabel}>최근 후기</p>
          <div className={styles.feedList}>
            {(recentReviews.length > 0 ? recentReviews : DUMMY_FEED)
              .filter((r) => {
                if (!search) return true;
                const pg = r.is_dummy ? getPlaygroundForReview(r.id, playgrounds) : null;
                return r.playgroundName?.includes(search)
                  || r.author?.includes(search)
                  || pg?.name?.includes(search);
              })
              .map((r) => {
                const pg = r.is_dummy
                  ? getPlaygroundForReview(r.id, playgrounds)
                  : (playgrounds?.find((p) => p.id === r.playgroundId)
                     || playgrounds?.find((p) => p.name === r.playgroundName));
                const goAction = pg
                  ? () => onGoToPlayground(pg)
                  : r.playgroundName ? () => onGoMap?.() : null;
                return (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    playground={pg}
                    onGo={goAction}
                  />
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewCard({ review, playground, onGo }) {
  const dateStr = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString('ko-KR')
    : review.date
      ? new Date(review.date).toLocaleDateString('ko-KR')
      : '';

  const pgName = review.playgroundName || playground?.name;

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.pgRow}>
          <span className={styles.pgName}>{pgName || review.author}</span>
          {onGo && (
            <button className={styles.goBtn} onClick={onGo}>지도 보기 →</button>
          )}
        </div>
        <div className={styles.cardMeta2}>
          <span className={styles.cardAuthor}>{review.author}</span>
          {review.child_disability && (
            <span className={styles.cardDisability}>{review.child_disability}</span>
          )}
          <span className={styles.cardDate}>{dateStr}</span>
        </div>
      </div>
      <div className={styles.cardTags}>
        {review.tags?.slice(0, 3).map((t) => (
          <span key={t} className={styles.cardTag}>{TAG_ICONS[t]} {t}</span>
        ))}
      </div>
      <div className={styles.cardBottom}>
        <span className={styles.cardStar}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
        {review.content && (
          <p className={styles.cardContent}>{review.content}</p>
        )}
      </div>
    </div>
  );
}
