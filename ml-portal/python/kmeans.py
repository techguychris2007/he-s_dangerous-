"""Reads "x,y" points from stdin, clusters them with Lloyd's k-means
algorithm (k and max-iterations taken from argv), and prints JSON.
Mirrors what Session 11 (Unsupervised Learning) covers with scikit-learn's
KMeans, written from scratch with plain Python for clarity.
"""
import json
import sys


def main():
    k = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    max_iter = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    k = max(1, k)
    max_iter = max(1, max_iter)

    points = []
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        parts = line.split(",")
        if len(parts) < 2:
            continue
        try:
            points.append((float(parts[0]), float(parts[1])))
        except ValueError:
            continue  # skip malformed rows (e.g. a header line)

    n = len(points)
    if n == 0 or n < k:
        print(json.dumps({"error": "need at least k data points"}), file=sys.stderr)
        sys.exit(1)

    # Deterministic init: spread initial centroids evenly across the
    # input order so results are reproducible between runs.
    if k == 1:
        centroids = [points[0]]
    else:
        centroids = [points[(c * (n - 1)) // (k - 1)] for c in range(k)]

    assignments = [-1] * n
    iterations = 0
    changed = True
    while changed and iterations < max_iter:
        changed = False
        for i, (px, py) in enumerate(points):
            best_dist = float("inf")
            best_c = 0
            for c, (cx, cy) in enumerate(centroids):
                dist = (px - cx) ** 2 + (py - cy) ** 2
                if dist < best_dist:
                    best_dist = dist
                    best_c = c
            if assignments[i] != best_c:
                assignments[i] = best_c
                changed = True

        sums = [[0.0, 0.0] for _ in range(k)]
        counts = [0] * k
        for (px, py), c in zip(points, assignments):
            sums[c][0] += px
            sums[c][1] += py
            counts[c] += 1
        for c in range(k):
            if counts[c] > 0:
                centroids[c] = (sums[c][0] / counts[c], sums[c][1] / counts[c])

        iterations += 1

    result = {
        "k": k,
        "iterations": iterations,
        "centroids": [{"x": cx, "y": cy} for cx, cy in centroids],
        "points": [
            {"x": px, "y": py, "cluster": c}
            for (px, py), c in zip(points, assignments)
        ],
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
