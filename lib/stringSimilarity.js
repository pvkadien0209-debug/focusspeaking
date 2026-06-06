/**
 * Bigram similarity (same algorithm as string-similarity npm)
 */
export function compareTwoStrings(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const firstBigrams = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const bigram = a.slice(i, i + 2);
    firstBigrams.set(bigram, (firstBigrams.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bigram = b.slice(i, i + 2);
    const count = firstBigrams.get(bigram) || 0;
    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2 * intersectionSize) / (a.length + b.length - 2);
}

export function findBest(statement, answerTexts, threshold = 0.35) {
  if (!statement || !Array.isArray(answerTexts)) return { index: -1, score: 0 };
  const stmt = statement.toLowerCase().trim();
  let maxSim = -1;
  let bestIdx = -1;

  answerTexts.forEach((text, i) => {
    const sim = compareTwoStrings(stmt, text.toLowerCase().trim());
    if (sim >= threshold && sim > maxSim) {
      maxSim = sim;
      bestIdx = i;
    }
  });

  return { index: bestIdx, score: maxSim };
}
