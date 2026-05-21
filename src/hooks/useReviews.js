import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp,
  doc, runTransaction, increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

const REVIEWS_COL = 'reviews';
const TAG_SUMMARY_COL = 'tag_summary';

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
      (snap) => {
        if (snap.exists()) setTagSummary(snap.data());
      }
    );

    return () => {
      unsubReviews();
      unsubSummary();
    };
  }, [playgroundId]);

  async function submitReview(playgroundId, playgroundName, formData, photoFiles) {
    const photoUrls = await uploadPhotos(playgroundId, photoFiles);

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

    try {
      await addDoc(collection(db, REVIEWS_COL), reviewDoc);

      // tag_summary 원자적 업데이트
      const summaryRef = doc(db, TAG_SUMMARY_COL, playgroundId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(summaryRef);
        if (!snap.exists()) {
          const initial = {
            휠체어편리: 0, 조용함: 0, 촉감놀이기구: 0, 쉴공간있음: 0,
            청결함: 0, 안전한울타리: 0, 물놀이가능: 0, 바닥안전: 0,
            total_reviews: 0, average_rating: formData.rating, updatedAt: serverTimestamp(),
          };
          formData.tags.forEach((t) => { initial[t] = 1; });
          tx.set(summaryRef, initial);
        } else {
          const updates = { total_reviews: increment(1), updatedAt: serverTimestamp() };
          formData.tags.forEach((t) => { updates[t] = increment(1); });
          // 평점 재계산은 서버에서 하기 어려우니 근사치
          const prev = snap.data();
          const newAvg =
            (prev.average_rating * prev.total_reviews + formData.rating) /
            (prev.total_reviews + 1);
          updates.average_rating = Math.round(newAvg * 10) / 10;
          tx.update(summaryRef, updates);
        }
      });
    } catch (err) {
      throw err;
    }
  }

  async function uploadPhotos(playgroundId, files) {
    if (!files || files.length === 0) return [];
    const urls = await Promise.all(
      files.map(async (file) => {
        const storageRef = ref(storage, `reviews/${playgroundId}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      })
    );
    return urls;
  }

  return { reviews, tagSummary, loading, error, submitReview };
}
