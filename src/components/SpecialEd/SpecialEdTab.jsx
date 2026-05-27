import centersData from '../../data/specialed_centers.json';
import styles from './SpecialEdTab.module.css';

const LINKS = [
  {
    id: 'nise',
    label: '국립특수교육원 (NISE)',
    desc: '특수교육 정책·연구·자료, 에듀에이블 포함',
    url: 'https://www.nise.go.kr',
  },
  {
    id: 'eduable',
    label: '에듀에이블',
    desc: '장애학생 교육 자료·프로그램 온라인 제공',
    url: 'https://www.nise.go.kr/main.do?s=eduable',
  },
  {
    id: 'pen',
    label: '부산시교육청 특수교육',
    desc: '부산 특수교육 공지·정책 안내',
    url: 'https://www.pen.go.kr',
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
          <p className={styles.sectionLabel}>관련 기관 바로가기</p>
          <div className={styles.linkList}>
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkCard}
              >
                <div className={styles.linkInfo}>
                  <span className={styles.linkLabel}>{l.label}</span>
                  <span className={styles.linkDesc}>{l.desc}</span>
                </div>
                <span className={styles.linkArrow}>→</span>
              </a>
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
