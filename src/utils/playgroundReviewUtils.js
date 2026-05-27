export { TAG_ICONS, TAG_COLORS } from './tagUtils';

export const getReviewsForPlayground = (playgroundId, dummyReviews) => {
  if (!playgroundId || !dummyReviews?.length) return [];
  const idStr = String(playgroundId);
  const seed = parseInt(idStr.slice(-4)) || 0;
  const start = seed % dummyReviews.length;
  const count = 3 + (seed % 3);
  const assigned = [];
  for (let i = 0; i < count; i++) {
    assigned.push(dummyReviews[(start + i) % dummyReviews.length]);
  }
  return assigned;
};

export const getTagSummary = (reviews) => {
  if (!reviews?.length) return { tagCounts: {}, topTags: [], averageRating: 0, totalReviews: 0 };

  const tagCounts = {};
  let ratingSum = 0;

  reviews.forEach((review) => {
    review.tags?.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    ratingSum += review.rating || 0;
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => ({ tag, count }));

  return {
    tagCounts,
    topTags,
    averageRating: Math.round((ratingSum / reviews.length) * 10) / 10,
    totalReviews: reviews.length,
  };
};
