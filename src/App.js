import { useState, useEffect, useRef } from 'react';
import './styles/global.css';
import BottomNav from './components/common/BottomNav';
import HomeFeed from './components/Home/HomeFeed';
import MapView from './components/Map/MapView';
import PlaygroundPreview from './components/Map/PlaygroundPreview';
import FilterSidebar from './components/Filter/FilterSidebar';
import PlaygroundDetail from './components/Detail/PlaygroundDetail';
import ReviewForm from './components/Review/ReviewForm';
import SpecialEdTab from './components/SpecialEd/SpecialEdTab';
import AIChat from './components/Chat/AIChat';
import { useReviews } from './hooks/useReviews';
import { EMPTY_FILTERS } from './utils/tagUtils';
import styles from './App.module.css';

const DUMMY_ID = 'busan_yeonje_hyundai_001';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [playgrounds, setPlaygrounds] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [previewPg, setPreviewPg] = useState(null);
  const [selectedPg, setSelectedPg] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const mapFocusRef = useRef(null);

  const { submitReview } = useReviews(reviewTarget?.id);

  useEffect(() => {
    import('./data/playgrounds.json').then((mod) => {
      setPlaygrounds(mod.default.playgrounds);
    });
  }, []);

  const activeFilterCount = Object.values(filters).flat().length;

  function handleQuickFilter(tag) {
    setFilters({ ...EMPTY_FILTERS, tags: [tag] });
    setActiveTab('map');
  }

  function handleCenterOnMap(center) {
    mapFocusRef.current = center;
    setActiveTab('map');
  }

  function handleGoToPlayground(pg) {
    mapFocusRef.current = pg;
    setActiveTab('map');
    setPreviewPg(pg);
  }

  async function handleSubmitReview(formData, photos) {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await submitReview(reviewTarget.id, reviewTarget.name, formData, photos);
      setReviewTarget(null);
    } catch {
      alert('후기 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.appContainer}>
      {/* 탭 콘텐츠 */}
      <div className={styles.content}>
        {/* 홈 */}
        <div className={`${styles.screen} ${activeTab === 'home' ? styles.screenActive : ''}`}>
          <HomeFeed
            playgrounds={playgrounds}
            onQuickFilter={handleQuickFilter}
            onGoMap={() => setActiveTab('map')}
            onGoToPlayground={handleGoToPlayground}
            onSelectPlayground={handleGoToPlayground}
          />
        </div>

        {/* 지도 */}
        <div className={`${styles.screen} ${activeTab === 'map' ? styles.screenActive : ''}`}>
          <MapView
            playgrounds={playgrounds}
            filters={filters}
            onSelectPlayground={(pg) => { setPreviewPg(pg); }}
            highlightId={DUMMY_ID}
            focusTarget={mapFocusRef.current}
            isActive={activeTab === 'map'}
          />
          <button
            className={styles.filterBtn}
            style={previewPg ? { bottom: 210 } : undefined}
            onClick={() => setFilterOpen(true)}
          >
            🔍 필터
            {activeFilterCount > 0 && (
              <span className={styles.badge}>{activeFilterCount}</span>
            )}
          </button>
          {previewPg && (
            <PlaygroundPreview
              playground={previewPg}
              onClose={() => setPreviewPg(null)}
              onDetail={() => {
                setSelectedPg(previewPg);
                setPreviewPg(null);
              }}
            />
          )}
        </div>

        {/* AI 채팅 */}
        <div className={`${styles.screen} ${activeTab === 'ai' ? styles.screenActive : ''}`}>
          <AIChat playgrounds={playgrounds} />
        </div>

        {/* 지원센터 */}
        <div className={`${styles.screen} ${activeTab === 'special' ? styles.screenActive : ''}`}>
          <SpecialEdTab onCenterOnMap={handleCenterOnMap} />
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav activeTab={activeTab} onChangeTab={(tab) => { setPreviewPg(null); setActiveTab(tab); }} />

      {/* 오버레이: 필터 */}
      <FilterSidebar
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      {/* 오버레이: 상세 페이지 */}
      {selectedPg && (
        <PlaygroundDetail
          playground={selectedPg}
          onClose={() => setSelectedPg(null)}
          onWriteReview={(pg) => {
            setSelectedPg(null);
            setReviewTarget(pg);
          }}
        />
      )}

      {/* 오버레이: 후기 작성 */}
      {reviewTarget && (
        <ReviewForm
          playground={reviewTarget}
          onSubmit={handleSubmitReview}
          onClose={() => setReviewTarget(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
