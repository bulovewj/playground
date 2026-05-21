import { getTagIcon } from '../../utils/tagUtils';
import styles from './ReviewList.module.css';

export default function ReviewList({ reviews, loading }) {
  if (loading) return <p className={styles.msg}>후기를 불러오는 중...</p>;
  if (!reviews || reviews.length === 0)
    return <p className={styles.msg}>아직 후기가 없어요. 첫 번째 후기를 남겨보세요!</p>;

  return (
    <div className={styles.list}>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  const dateStr = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString('ko-KR')
    : '';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <span className={styles.author}>{review.author}</span>
          {review.child_disability && (
            <span className={styles.disability}>{review.child_disability}</span>
          )}
        </div>
        <div className={styles.ratingDate}>
          <span className={styles.star}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
          <span className={styles.date}>{dateStr}</span>
        </div>
      </div>

      <div className={styles.tags}>
        {review.tags?.map((t) => (
          <span key={t} className={styles.tag}>{getTagIcon(t)} {t}</span>
        ))}
      </div>

      {review.content && <p className={styles.content}>{review.content}</p>}

      {review.photo_urls?.length > 0 && (
        <div className={styles.photos}>
          {review.photo_urls.map((url, i) => (
            <img key={i} src={url} alt="후기 사진" className={styles.photo} />
          ))}
        </div>
      )}
    </div>
  );
}
