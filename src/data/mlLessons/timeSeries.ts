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
    ],
  },
];
