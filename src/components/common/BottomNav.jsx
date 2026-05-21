import styles from './BottomNav.module.css';

const TABS = [
  { id: 'home',    icon: '🏠', label: '홈' },
  { id: 'map',     icon: '🗺️', label: '지도' },
  { id: 'ai',      icon: '💬', label: 'AI추천' },
  { id: 'special', icon: '🏫', label: '지원센터' },
];

export default function BottomNav({ activeTab, onChangeTab }) {
  return (
    <nav className={styles.nav}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`${styles.tabBtn} ${activeTab === t.id ? styles.active : ''}`}
          onClick={() => onChangeTab(t.id)}
        >
          <span className={styles.icon}>{t.icon}</span>
          <span className={styles.label}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
