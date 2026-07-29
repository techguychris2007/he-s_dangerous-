import type { MlLesson } from './types';

export const TIME_SERIES_LESSONS: MlLesson[] = [
  {
    id: 'time-series',
    title: 'Time Series Analysis',
    source: 'Session 12',
    unit: 'time-series',
    sections: [
      {
        heading: 'Why time series is different',
        body: `<p>In time series data, order matters and observations are usually not independent —
        today's value is correlated with yesterday's. Standard random train/test splits can leak future
        information, so splits are typically done chronologically instead.</p>`,
      },
      {
        heading: 'Handling time series data',
        body: `<p>Typical steps: parse timestamps into a proper datetime index, resample to a consistent
        frequency (daily, monthly), and handle missing values without breaking the time order (e.g.
        forward-fill rather than dropping rows).</p>`,
      },
      {
        heading: 'Lag features',
        body: `<p>A common forecasting trick is creating "lag" features — yesterday's value as a column —
        so a standard regression model can be reused for time series prediction, turning a sequence problem
        into an ordinary supervised learning problem.</p>`,
      },
      {
        heading: 'Worked example: building a lag-1 feature',
        body: `<p>Daily sales [100, 110, 105, 120] become a supervised table by shifting the series by one
        day: features=[100, 110, 105], targets=[110, 105, 120] — each row predicts "tomorrow" from "today."
        Adding lag-2 and lag-7 columns the same way lets a single ordinary regression model see yesterday,
        two days ago, and the same weekday last week all at once, which is exactly how the moving-average
        coding challenge below turns a raw sequence into fixed-size windows.</p>`,
      },
    ],
  },
  {
    id: 'time-series-decomposition',
    title: 'Time Series Decomposition',
    source: 'Session 12',
    unit: 'time-series',
    challengeTaskId: 'ml-ts-01',
    sections: [
      {
        heading: 'Three components of a series',
        body: `<p>Most time series can be thought of as the combination of three parts: <strong>trend</strong>
        (the long-term direction), <strong>seasonality</strong> (a repeating pattern at a fixed period —
        daily, weekly, yearly), and <strong>residual</strong> (whatever noise is left over after removing
        both).</p>`,
      },
      {
        heading: 'Additive vs. multiplicative decomposition',
        body: `<p>An <strong>additive</strong> model assumes value = trend + seasonality + residual — appropriate
        when seasonal swings stay roughly constant in absolute size. A <strong>multiplicative</strong> model
        assumes value = trend &times; seasonality &times; residual — appropriate when seasonal swings grow
        proportionally with the trend (e.g. retail sales seasonality that grows as the business grows).</p>`,
      },
      {
        heading: 'Why decompose at all',
        body: `<p>Isolating trend and seasonality makes it far easier to spot genuine anomalies in the
        residual (real deviations from the expected pattern), and is often a preprocessing step before
        forecasting — some models forecast the trend and seasonal components separately, then recombine them.</p>`,
      },
      {
        heading: 'Worked example: a 3-point moving-average trend',
        body: `<p>Daily values [10, 12, 14, 16, 18] smoothed with a 3-point trailing moving average give
        [12, 14, 16] — the average of each point with its two predecessors. The raw series jumps by 2 every
        step; the smoothed trend shows the same steady climb with the noise (if there were any) averaged
        out. Subtracting this trend from the original values at each overlapping point is exactly the first
        step toward isolating a residual — and exactly what the moving-average coding challenge below computes.</p>`,
      },
    ],
  },
  {
    id: 'arima-forecasting',
    title: 'Forecasting with Moving Averages &amp; ARIMA',
    source: 'Extension',
    unit: 'time-series',
    challengeTaskId: 'ml-ts-02',
    sections: [
      {
        heading: 'The simplest forecast: moving average',
        body: `<p>A moving average forecast simply predicts the next value as the average of the last N
        observed values — a surprisingly strong, hard-to-beat baseline for series without a strong trend or
        seasonality, and a useful smoothing tool for visualizing noisy data.</p>`,
      },
      {
        heading: 'ARIMA, piece by piece',
        body: `<ul>
          <li><strong>AR (AutoRegressive)</strong> — predicts the next value from a linear combination of previous
          values, exactly like the lag features from the intro lesson.</li>
          <li><strong>I (Integrated)</strong> — differencing the series (value[t] - value[t-1]) to remove trend and
          make it stationary, which most forecasting models require.</li>
          <li><strong>MA (Moving Average)</strong> — models the next value as a function of past forecast errors,
          not past values directly.</li>
        </ul>`,
      },
      {
        heading: 'Evaluating a forecast honestly',
        body: `<p>Time series models must be evaluated on a chronological holdout — train on the past,
        test on the future — never a random split, since that would let the model "see the future" during
        training. The regression metrics from Unit 3 (MAE, RMSE) apply directly to forecast accuracy.</p>`,
      },
      {
        heading: 'Worked example: differencing away a trend',
        body: `<p>A steadily rising series [1, 3, 5, 7] differences to [2, 2, 2] — the "I" step in ARIMA
        removes the trend entirely, leaving a constant (stationary) series that's far easier for an AR or
        MA model to fit. A series with no trend at all, like [5, 5, 5], differences to [0, 0, 0] — nothing
        left to model, which is exactly the sanity check the differencing coding challenge below tests for.</p>`,
      },
    ],
  },
];
