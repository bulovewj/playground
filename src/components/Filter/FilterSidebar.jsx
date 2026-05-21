import { useState } from 'react';
import styles from './FilterSidebar.module.css';

const TAGS = [
  { id: '휠체어편리', icon: '♿' },
  { id: '조용함', icon: '🌿' },
  { id: '촉감놀이기구', icon: '🖐' },
  { id: '쉴공간있음', icon: '☀️' },
  { id: '청결함', icon: '🧹' },
  { id: '안전한울타리', icon: '🔒' },
  { id: '물놀이가능', icon: '🌊' },
  { id: '바닥안전', icon: '🐾' },
];

const FACILITIES = [
  { id: '주차장', icon: '🚗' },
  { id: '화장실', icon: '🚻' },
  { id: '응급병원', icon: '🏥' },
  { id: '경찰서', icon: '🚔' },
];

const DISTRICTS = [
  '중구','서구','동구','영도구','부산진구','동래구','남구','북구',
  '해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군',
];

const EMPTY_FILTERS = { types: [], ownership: [], tags: [], facilities: [], districts: [] };

export default function FilterSidebar({ isOpen, onClose, filters, onApply }) {
  const [draft, setDraft] = useState(filters ?? EMPTY_FILTERS);

  function toggle(key, value) {
    setDraft((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function reset() {
    setDraft(EMPTY_FILTERS);
  }

  function apply() {
    onApply(draft);
    onClose();
  }

  const activeCount = Object.values(draft).flat().length;

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <span className={styles.title}>필터</span>
          <button className={styles.resetBtn} onClick={reset}>초기화</button>
        </div>

        <div className={styles.body}>
          <Section label="기본 조건">
            <ChipGroup
              options={[{ id: '실외', label: '실외' }, { id: '실내', label: '실내' }]}
              selected={draft.types}
              onToggle={(v) => toggle('types', v)}
            />
            <ChipGroup
              options={[{ id: '공공', label: '공공' }, { id: '민간', label: '민간' }]}
              selected={draft.ownership}
              onToggle={(v) => toggle('ownership', v)}
            />
          </Section>

          <Section label="강점 태그 (후기 기반)">
            <ChipGroup
              options={TAGS.map((t) => ({ id: t.id, label: `${t.icon} ${t.id}` }))}
              selected={draft.tags}
              onToggle={(v) => toggle('tags', v)}
            />
          </Section>

          <Section label="편의시설">
            <ChipGroup
              options={FACILITIES.map((f) => ({ id: f.id, label: `${f.icon} ${f.id}` }))}
              selected={draft.facilities}
              onToggle={(v) => toggle('facilities', v)}
            />
          </Section>

          <Section label="지역">
            <ChipGroup
              options={DISTRICTS.map((d) => ({ id: d, label: d }))}
              selected={draft.districts}
              onToggle={(v) => toggle('districts', v)}
            />
          </Section>
        </div>

        <div className={styles.footer}>
          <button className={styles.applyBtn} onClick={apply}>
            {activeCount > 0 ? `필터 적용 (${activeCount})` : '전체 보기'}
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ label, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{label}</p>
      {children}
    </div>
  );
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <div className={styles.chipGroup}>
      {options.map((opt) => (
        <button
          key={opt.id}
          className={`${styles.chip} ${selected.includes(opt.id) ? styles.chipActive : ''}`}
          onClick={() => onToggle(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
