import centersData from '../../data/specialed_centers.json';
import styles from './SpecialEdTab.module.css';

const NOTICES = [
  {
    id: 1,
    title: '2026년 상반기 특수교육 보호자 연수 안내',
    date: '2026-04-15',
    desc: '부산 특수교육지원센터에서 보호자 역량 강화 연수를 진행합니다. 관심 있으신 보호자분들의 많은 참여 바랍니다.',
  },
  {
    id: 2,
    title: '장애 학생 여름방학 통합놀이 프로그램 모집',
    date: '2026-05-10',
    desc: '비장애 학생과 함께하는 통합 놀이 프로그램입니다. 사전 신청 후 참여 가능합니다.',
  },
];

export default function SpecialEdTab({ onCenterOnMap }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>부산 특수교육지원센터</h2>
        <p className={styles.source}>출처: 국립특수교육원 특수교육지원센터 현황 (2024)</p>
      </div>

      <div className={styles.body}>
        <section className={styles.section}>
          <p className={styles.sectionLabel}>센터 목록</p>
          <div className={styles.centerList}>
            {centersData.centers.map((c) => (
              <CenterCard key={c.id} center={c} onCenterOnMap={onCenterOnMap} />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>행사·프로그램 안내</p>
          <div className={styles.noticeList}>
            {NOTICES.map((n) => (
              <div key={n.id} className={styles.noticeCard}>
                <div className={styles.noticeTop}>
                  <span className={styles.noticeTitle}>{n.title}</span>
                  <span className={styles.noticeDate}>{n.date}</span>
                </div>
                <p className={styles.noticeDesc}>{n.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CenterCard({ center, onCenterOnMap }) {
  return (
    <div className={styles.centerCard}>
      <div className={styles.centerTop}>
        <div>
          <p className={styles.centerName}>{center.name}</p>
          <p className={styles.centerDistrict}>📍 {center.district}</p>
        </div>
        <button
          className={styles.mapBtn}
          onClick={() => onCenterOnMap?.(center)}
        >
          지도 보기
        </button>
      </div>
      <p className={styles.centerAddress}>{center.address}</p>
      <div className={styles.centerActions}>
        <a href={`tel:${center.phone}`} className={styles.phoneBtn}>
          📞 {center.phone}
        </a>
        <a
          href={center.website}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.webBtn}
        >
          홈페이지
        </a>
      </div>
    </div>
  );
}
