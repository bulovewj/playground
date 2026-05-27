import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp,
  doc, runTransaction, increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { TAGS } from '../utils/tagUtils';

const REVIEWS_COL = 'reviews';
const TAG_SUMMARY_COL = 'tag_summary';
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

export function useReviews(playgroundId) {
  const [reviews, setReviews] = useState([]);
  const [tagSummary, setTagSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playgroundId) return;

    setLoading(true);

    const q = query(
      collection(db, REVIEWS_COL),
      where('playgroundId', '==', playgroundId),
      orderBy('createdAt', 'desc')
    );

    const unsubReviews = onSnapshot(
      q,
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    const unsubSummary = onSnapshot(
      doc(db, TAG_SUMMARY_COL, playgroundId),
      (snap) => { if (snap.exists()) setTagSummary(snap.data()); },
      (err) => setError(err)
    );

    return () => {
      unsubReviews();
      unsubSummary();
    };
  }, [playgroundId]);

  async function submitReview(playgroundId, playgroundName, formData, photoFiles) {
    const photoUrls = await uploadPhotos(playgroundId, photoFiles);

    // reviewDoc is built from explicit fields only — never carries is_dummy or other dummy data
    const reviewDoc = {
      playgroundId,
      playgroundName,
      author: formData.author,
      child_disability: formData.disability || null,
      rating: formData.rating,
      tags: formData.tags,
      content: formData.content || '',
      photo_urls: photoUrls,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, REVIEWS_COL), reviewDoc);

    // 태그 집계 원자적 업데이트
    const summaryRef = doc(db, TAG_SUMMARY_COL, playgroundId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(summaryRef);
      if (!snap.exists()) {
        const initial = TAGS.reduce((acc, t) => { acc[t.id] = 0; return acc; }, {});
        formData.tags.forEach((t) => { initial[t] = 1; });
        tx.set(summaryRef, {
          ...initial,
          total_reviews: 1,
          average_rating: formData.rating,
          updatedAt: serverTimestamp(),
        });
      } else {
        const prev = snap.data();
        const updates = { total_reviews: increment(1), updatedAt: serverTimestamp() };
        formData.tags.forEach((t) => { updates[t] = increment(1); });
        // average_rating: (prev_sum + new) / (prev_count + 1)
        updates.average_rating = Math.round(
          ((prev.average_rating * prev.total_reviews + formData.rating) / (prev.total_reviews + 1)) * 10
        ) / 10;
        tx.update(summaryRef, updates);
      }
    });
  }

  async function uploadPhotos(playgroundId, files) {
    if (!files || files.length === 0) return [];

    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') && f.size <= MAX_PHOTO_SIZE
    );

    const results = await Promise.allSettled(
      validFiles.map(async (file, index) => {
        const safeName = file.name.replace(/[^\w.-]/g, '_');
        const storageRef = ref(storage, `reviews/${playgroundId}/${Date.now()}_${index}_${safeName}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);
  }

  return { reviews, tagSummary, loading, error, submitReview };
}
