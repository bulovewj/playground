import { useEffect, useState } from 'react';
import { TAGS, PLACE_TYPES, DISTRICTS, EMPTY_FILTERS } from '../../utils/tagUtils';
import styles from './FilterSidebar.module.css';

const FACILITIES = [
  { id: '주차장', label: '🚗 주차장 (시설 내)' },
  { id: '화장실', label: '🚻 화장실 (시설 내)' },
  { id: '응급병원', label: '🏥 응급병원 (1km)' },
  { id: '경찰서', label: '🚔 경찰서 (1km)' },
];

export default function FilterSidebar({ isOpen, onClose, filters, onApply }) {
  const [draft, setDraft] = useState(filters ?? EMPTY_FILTERS);

  useEffect(() => {
    if (isOpen) setDraft(filters ?? EMPTY_FILTERS);
  }, [filters, isOpen]);

  function toggle(key, value) {
    setDraft((prev) => {
      const arr = prev[key] ?? [];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  function reset() { setDraft(EMPTY_FILTERS); }
  function apply() { onApply(draft); onClose(); }

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

          <Section label="설치장소">
            <ChipGroup
              options={PLACE_TYPES.map((p) => ({ id: p.id, label: `${p.icon} ${p.id}` }))}
              selected={draft.placeTypes}
              onToggle={(v) => toggle('placeTypes', v)}
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
              options={FACILITIES.map((f) => ({ id: f.id, label: f.label }))}
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

function ChipGroup({ options, selected = [], onToggle }) {
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
