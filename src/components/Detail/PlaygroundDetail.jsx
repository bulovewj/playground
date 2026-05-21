import { useState } from 'react';
import styles from './PlaygroundDetail.module.css';
import { useReviews } from '../../hooks/useReviews';
import { getTagIcon, getTopTags } from '../../utils/tagUtils';
import ReviewList from '../Review/ReviewList';
import dummyReviews from '../../data/dummy_reviews.json';

const DUMMY_ID = dummyReviews.playground.id;

export default function PlaygroundDetail({ playground, onClose, onWriteReview }) {
  const [tab, setTab] = useState('info'); // 'info' | 'reviews'
  const { reviews, tagSummary, loading } = useReviews(playground?.id);

  if (!playground) return null;

  // Firebase 후기 우선, 없으면 더미데이터 fallback
  const activeSummary = tagSummary ?? (playground.id === DUMMY_ID ? dummyReviews.tag_summary : null);
  const totalReviews = tagSummary?.total_reviews ?? (playground.id === DUMMY_ID ? dummyReviews.total_reviews : 0);
  const avgRating = tagSummary?.average_rating ?? (playground.id === DUMMY_ID ? dummyReviews.average_rating : null);
  const topTags = getTopTags(activeSummary, 3);

  const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(playground.address || playground.name)}`;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.name}>{playground.name}</h2>
            <div className={styles.addressRow}>
              <span className={styles.address}>{playground.address}</span>
              <a href={naverUrl} target="_blank" rel="noopener noreferrer" className={styles.dirBtn}>
                길찾기
              </a>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* 탭 */}
        <div className={styles.tabRow}>
          <button
            className={`${styles.tab} ${tab === 'info' ? styles.tabActive : ''}`}
            onClick={() => setTab('info')}
          >
            기본 정보
          </button>
          <button
            className={`${styles.tab} ${tab === 'reviews' ? styles.tabActive : ''}`}
            onClick={() => setTab('reviews')}
          >
            후기 {totalReviews > 0 && `(${totalReviews})`}
          </button>
        </div>

        <div className={styles.body}>
          {tab === 'info' ? (
            <>
              <div className={styles.chipRow}>
                <Chip>{playground.type}</Chip>
                <Chip>{playground.public_private}</Chip>
                {playground.fee && <Chip>{playground.fee}</Chip>}
              </div>

              <div className={styles.infoGrid}>
                <InfoItem label="설치 기구" value={playground.equipment_count > 0 ? `${playground.equipment_count}개` : '정보 없음'} />
                <InfoItem label="휠체어 기구" value={playground.wheelchair_equipment ? '✅ 있음' : '없음'} />
                <InfoItem label="안전교육" value={playground.safety_training ? '✅ 완료' : '미완료'} />
              </div>

              <div className={styles.facilityRow}>
                <FacilityBadge icon="🚗" label="주차장" active={playground.has_parking} />
                <FacilityBadge icon="🚻" label="화장실" active={playground.near_toilet} />
                <FacilityBadge icon="🏥" label="병원" active={playground.near_hospital} />
                <FacilityBadge icon="🚔" label="경찰서" active={playground.near_police} />
              </div>

              <div className={styles.strengthSection}>
                <p className={styles.sectionLabel}>
                  보호자 강점 태그
                  {totalReviews > 0 && <span className={styles.reviewCount}> ({totalReviews}개 후기)</span>}
                  {avgRating && (
                    <span className={styles.avgRating}> · ★ {avgRating.toFixed(1)}</span>
                  )}
                </p>
                {topTags.length > 0 ? (
                  <div className={styles.tagRow}>
                    {topTags.map(([tag, count]) => (
                      <div key={tag} className={styles.tagItem}>
                        <span className={styles.tagIcon}>{getTagIcon(tag)}</span>
                        <span className={styles.tagLabel}>{tag}</span>
                        <span className={styles.tagCount}>{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyReview}>아직 후기가 없어요. 첫 번째 후기를 남겨보세요!</p>
                )}
              </div>
            </>
          ) : (
            <ReviewList reviews={reviews} loading={loading} />
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.reviewBtn} onClick={() => onWriteReview?.(playground)}>
            후기 작성하기
          </button>
        </div>
      </div>
    </>
  );
}

function Chip({ children }) {
  return <span className={styles.chip}>{children}</span>;
}

function InfoItem({ label, value }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  );
}

function FacilityBadge({ icon, label, active }) {
  return (
    <div className={`${styles.facilityBadge} ${active ? styles.facilityActive : styles.facilityInactive}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
