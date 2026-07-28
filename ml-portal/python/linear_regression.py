"""Reads "x,y" pairs from stdin, fits y = slope*x + intercept via
ordinary least squares (closed form), and prints the result as JSON.
Mirrors what Session 5 (Supervised Learning) covers with scikit-learn's
LinearRegression, written from scratch with plain Python for clarity.
"""
import json
import sys


def main():
    xs, ys = [], []
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        parts = line.split(",")
        if len(parts) < 2:
            continue
        try:
            xs.append(float(parts[0]))
            ys.append(float(parts[1]))
        except ValueError:
            continue  # skip malformed rows (e.g. a header line)

    n = len(xs)
    if n < 2:
        print(json.dumps({"error": "need at least 2 data points"}), file=sys.stderr)
        sys.exit(1)

    sum_x = sum(xs)
    sum_y = sum(ys)
    sum_xy = sum(x * y for x, y in zip(xs, ys))
    sum_xx = sum(x * x for x in xs)

    denom = n * sum_xx - sum_x * sum_x
    if abs(denom) > 1e-12:
        slope = (n * sum_xy - sum_x * sum_y) / denom
        intercept = (sum_y - slope * sum_x) / n
    else:
        slope = 0.0
        intercept = sum_y / n  # all x equal: fall back to the mean of y

    predictions = [slope * x + intercept for x in xs]
    mse = sum((y - yhat) ** 2 for y, yhat in zip(ys, predictions)) / n

    result = {
        "slope": slope,
        "intercept": intercept,
        "mse": mse,
        "points": [
            {"x": x, "y": y, "yhat": yhat}
            for x, y, yhat in zip(xs, ys, predictions)
        ],
    }
    print(json.dumps(result))


if __name__ == "__main__":
    main()
