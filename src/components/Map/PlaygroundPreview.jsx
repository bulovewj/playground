import styles from './PlaygroundPreview.module.css';

export default function PlaygroundPreview({ playground: pg, onClose, onDetail }) {
  const facilities = [
    pg.has_parking && '🚗 주차장',
    pg.near_toilet && '🚻 화장실',
    pg.near_hospital && '🏥 응급병원',
    pg.near_police && '🚔 경찰서',
  ].filter(Boolean);

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <div className={styles.nameRow}>
          <span className={styles.name}>{pg.name}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <span className={styles.address}>{pg.address || pg.district}</span>
      </div>

      <div className={styles.badges}>
        {pg.district && <span className={styles.badge}>{pg.district}</span>}
        {pg.type && <span className={styles.badge}>{pg.type}</span>}
        {pg.public_private && <span className={styles.badge}>{pg.public_private}</span>}
        {pg.place_type && <span className={styles.badge}>{pg.place_type}</span>}
      </div>

      {facilities.length > 0 && (
        <div className={styles.facilities}>
          {facilities.map((f) => <span key={f} className={styles.fac}>{f}</span>)}
        </div>
      )}

      <button className={styles.detailBtn} onClick={onDetail}>
        상세 페이지 보기 →
      </button>
    </div>
  );
}
