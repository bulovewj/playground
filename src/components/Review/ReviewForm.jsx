import { useEffect, useState, useRef } from 'react';
import { TAGS, DISABILITY_TYPES } from '../../utils/tagUtils';
import styles from './ReviewForm.module.css';

const MAX_TAGS = 3;
const MAX_PHOTOS = 3;
const MAX_CONTENT = 200;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function ReviewForm({ playground, onSubmit, onClose, submitting }) {
  const [author, setAuthor] = useState('');
  const [disability, setDisability] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    return () => {
      photoPreview.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreview]);

  function updatePhotos(nextFiles) {
    photoPreview.forEach((url) => URL.revokeObjectURL(url));
    setPhotos(nextFiles);
    setPhotoPreview(nextFiles.map((f) => URL.createObjectURL(f)));
  }

  function toggleTag(id) {
    setSelectedTags((prev) =>
      prev.includes(id)
        ? prev.filter((t) => t !== id)
        : prev.length < MAX_TAGS
        ? [...prev, id]
        : prev
    );
  }

  function handlePhotos(e) {
    const all = Array.from(e.target.files);
    const valid = all.filter((f) => f.type.startsWith('image/') && f.size <= MAX_PHOTO_SIZE);
    if (valid.length < all.length) {
      setError(`${all.length - valid.length}개 파일은 이미지가 아니거나 5MB를 초과해요.`);
    }
    const newFiles = [...photos, ...valid].slice(0, MAX_PHOTOS);
    updatePhotos(newFiles);
    e.target.value = '';
  }

  function removePhoto(idx) {
    const newFiles = photos.filter((_, i) => i !== idx);
    updatePhotos(newFiles);
  }

  async function handleSubmit() {
    if (!author.trim()) return setError('닉네임을 입력해주세요.');
    if (selectedTags.length === 0) return setError('태그를 1개 이상 선택해주세요.');
    if (rating === 0) return setError('별점을 선택해주세요.');
    setError('');
    await onSubmit(
      { author: author.trim(), disability, tags: selectedTags, rating, content },
      photos
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <span className={styles.title}>후기 작성</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* 놀이터명 */}
          <p className={styles.pgName}>{playground?.name}</p>

          {/* 닉네임 */}
          <Field label="닉네임 *">
            <input
              className={styles.input}
              placeholder="닉네임을 입력하세요"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={20}
            />
          </Field>

          {/* 장애 유형 */}
          <Field label="아이 장애 유형 (선택)">
            <div className={styles.chipRow}>
              {DISABILITY_TYPES.map((d) => (
                <button
                  key={d}
                  className={`${styles.chip} ${disability === d ? styles.chipActive : ''}`}
                  onClick={() => setDisability((prev) => (prev === d ? '' : d))}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>

          {/* 태그 */}
          <Field label={`강점 태그 * (최대 ${MAX_TAGS}개)`}>
            <div className={styles.chipRow}>
              {TAGS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.chip} ${selectedTags.includes(t.id) ? styles.chipActive : ''}`}
                  onClick={() => toggleTag(t.id)}
                >
                  {t.icon} {t.id}
                </button>
              ))}
            </div>
          </Field>

          {/* 별점 */}
          <Field label="별점 *">
            <div className={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`${styles.star} ${n <= rating ? styles.starFilled : ''}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
          </Field>

          {/* 후기 텍스트 */}
          <Field label={`후기 (선택, ${content.length}/${MAX_CONTENT}자)`}>
            <textarea
              className={styles.textarea}
              placeholder="이 놀이터의 경험을 자유롭게 남겨주세요."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              rows={3}
            />
          </Field>

          {/* 사진 */}
          <Field label={`사진 (선택, 최대 ${MAX_PHOTOS}장)`}>
            <div className={styles.photoRow}>
              {photoPreview.map((url, i) => (
                <div key={i} className={styles.photoThumb}>
                  <img src={url} alt="preview" />
                  <button className={styles.removePhoto} onClick={() => removePhoto(i)}>✕</button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button className={styles.addPhoto} onClick={() => fileRef.current.click()}>
                  + 추가
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotos}
            />
          </Field>

          {error && <p className={styles.error}>{error}</p>}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '저장 중...' : '후기 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <p className={styles.fieldLabel}>{label}</p>
      {children}
    </div>
  );
}
