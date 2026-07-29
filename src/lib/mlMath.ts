export interface Point {
  x: number;
  y: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  mse: number;
  points: { x: number; y: number; yhat: number }[];
}

/** Ordinary least squares — closed-form fit of y = slope*x + intercept. */
export function linearRegression(points: Point[]): LinearRegressionResult {
  const n = points.length;
  if (n < 2) throw new Error('Need at least 2 data points.');

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denom = n * sumXX - sumX * sumX;
  let slope = 0;
  let intercept: number;
  if (Math.abs(denom) > 1e-12) {
    slope = (n * sumXY - sumX * sumY) / denom;
    intercept = (sumY - slope * sumX) / n;
  } else {
    intercept = sumY / n; // all x equal: fall back to the mean of y
  }

  const predicted = points.map(({ x, y }) => {
    const yhat = slope * x + intercept;
    return { x, y, yhat };
  });
  const sse = predicted.reduce((sum, { y, yhat }) => sum + (y - yhat) ** 2, 0);

  return { slope, intercept, mse: sse / n, points: predicted };
}

export interface KMeansResult {
  k: number;
  iterations: number;
  centroids: Point[];
  points: { x: number; y: number; cluster: number }[];
}

/** Lloyd's k-means. Deterministic init: initial centroids are spread evenly across the input
 *  order, so results are reproducible between runs on the same data. */
export function kmeans(points: Point[], k: number, maxIter = 100): KMeansResult {
  const n = points.length;
  if (n === 0 || n < k) throw new Error('Need at least k data points.');
  k = Math.max(1, k);
  maxIter = Math.max(1, maxIter);

  const centroids: Point[] = Array.from({ length: k }, (_, c) => {
    const idx = k === 1 ? 0 : Math.floor((c * (n - 1)) / (k - 1));
    return { ...points[idx] };
  });

  const assignments = new Array(n).fill(-1);
  let iterations = 0;
  let changed = true;

  while (changed && iterations < maxIter) {
    changed = false;
    for (let i = 0; i < n; i++) {
      let best = Infinity;
      let bestC = 0;
      for (let c = 0; c < k; c++) {
        const dx = points[i].x - centroids[c].x;
        const dy = points[i].y - centroids[c].y;
        const d = dx * dx + dy * dy;
        if (d < best) {
          best = d;
          bestC = c;
        }
      }
      if (assignments[i] !== bestC) {
        assignments[i] = bestC;
        changed = true;
      }
    }

    const sums = Array.from({ length: k }, () => ({ x: 0, y: 0 }));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sums[c].x += points[i].x;
      sums[c].y += points[i].y;
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = { x: sums[c].x / counts[c], y: sums[c].y / counts[c] };
      }
    }

    iterations++;
  }

  return {
    k,
    iterations,
    centroids,
    points: points.map((p, i) => ({ x: p.x, y: p.y, cluster: assignments[i] })),
  };
}

/** Parses "x,y" lines, skipping blanks and malformed rows (e.g. a header line). */
export function parseCsvPoints(csv: string): Point[] {
  const points: Point[] = [];
  for (const line of csv.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',');
    if (parts.length < 2) continue;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
  }
  return points;
}
