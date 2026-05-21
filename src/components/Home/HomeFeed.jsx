import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getTagIcon } from '../../utils/tagUtils';
import styles from './HomeFeed.module.css';

const QUICK_FILTERS = [
  { tag: '휠체어편리', icon: '♿' },
  { tag: '조용함',     icon: '🌿' },
  { tag: '촉감놀이기구', icon: '🖐' },
  { tag: '쉴공간있음', icon: '☀️' },
  { tag: '물놀이가능', icon: '🌊' },
  { tag: '바닥안전',   icon: '🐾' },
];

export default function HomeFeed({ onQuickFilter, onGoMap }) {
  const [recentReviews, setRecentReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setRecentReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
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
          <span className={styles.logo}>🌳</span>
          <div>
            <h1 className={styles.appName}>놀이터 접근성 지도</h1>
            <p className={styles.appSub}>부산 장애아동 보호자 커뮤니티</p>
          </div>
        </div>
        <input
          className={styles.search}
          placeholder="🔍  놀이터 이름 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          {loading && <p className={styles.msg}>불러오는 중...</p>}
          {!loading && recentReviews.length === 0 && (
            <p className={styles.msg}>아직 후기가 없어요. 지도에서 놀이터를 찾아보세요!</p>
          )}
          <div className={styles.feedList}>
            {recentReviews
              .filter((r) => !search || r.playgroundName?.includes(search))
              .map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  const dateStr = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString('ko-KR')
    : '';

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.pgName}>{review.playgroundName}</span>
        <span className={styles.cardDate}>{dateStr}</span>
      </div>
      <div className={styles.cardTags}>
        {review.tags?.slice(0, 3).map((t) => (
          <span key={t} className={styles.cardTag}>{getTagIcon(t)} {t}</span>
        ))}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardStar}>{'★'.repeat(review.rating)}</span>
        {review.content && (
          <p className={styles.cardContent}>{review.content}</p>
        )}
      </div>
    </div>
  );
}
