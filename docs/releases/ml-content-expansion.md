# Machine learning content audit and expansion

Seven existing lessons now use complete replacement teaching sequences rather than short summaries followed by unrelated additions. Their IDs and roadmap positions are unchanged.

| Lesson | Added teaching and demonstrations |
| --- | --- |
| NumPy | Sample/feature/target dimensions, indexing, label alignment, axis reductions, variance conventions, broadcasting failures, matrix multiplication, training-only standardization, finite values and storage ownership |
| pandas | Row grain, key validation, parsing/quarantine, label alignment, explicit assignment, missing versus zero, aggregation denominators, merge cardinality and point-in-time availability |
| Model evaluation | Prediction question, label maturity, group/time splits, baselines, pipelines, leakage, learning curves, tuning, ranking/calibration/thresholds, uncertainty and monitoring |
| Confusion matrix | Positive-class convention, axis order, counts, metric denominators, corrected F1 interpretation, undefined metrics, threshold effects and multiclass averaging |
| Time series | Origins/horizons, timestamp regularity, gaps, safe lags/rolling features, fixed versus updated forecasts, baselines, walk-forward windows and forecast reporting |
| Decomposition | Additive identities, period semantics, multiplicative/log limits, centered-filter leakage, classical decomposition, STL and cautious remainder interpretation |
| ARIMA | AR versus differencing versus innovations, arithmetic moving averages versus MA(q), inverse differences, full fitting/forecasting example, intervals, order selection and residual diagnostics |

The seven lessons contain 28 original Python demonstrations. Each supplies its data or explicitly declares that it is an API-configuration fragment, avoiding hidden datasets or fake results. NumPy, pandas, scikit-learn and statsmodels documentation support the implementation choices; source links appear in the lessons. Source examples were not copied wholesale.

Two new standard-library Python assignments are connected directly to the pandas and introductory time-series lesson practice buttons and are also included in the ML task catalog:

- `ml-data-join-audit`: four functions for validated unique indexes, a grain-preserving left join, coverage auditing and dataset assembly. The reference implementation is 58 lines and passes 17 checks.
- `ml-ts-walk-forward`: five functions for expanding windows, lag construction, fixed-origin forecasting, error scoring and a fold-level evaluation report. The reference implementation is 93 lines and passes 24 checks.

Starter workspaces contain comments, signatures, docstrings and `pass` only. Learners implement every function; the reference solutions remain behind the existing solution action. Neither assignment requires a third-party package. Existing smaller practices remain available in the catalog.

## Correctness fixes

F1 for precision 0.6 and recall 0.75 is approximately 0.667: between the inputs, not below both. Both the replacement lesson and original source text have been corrected.

The Python/SQL enrichment code helper now escapes ampersands and angle brackets before inserting code into authored HTML. Comparisons and HTML-looking strings consequently render as code text rather than being interpreted as document markup.

## Verification

`npm run test:platform` includes the lightweight ML structure check: unique task IDs, reachable practice links, exact use of replacement content and escaped example markup.

`npm run test:ml-content` executes all 28 demonstrations in separate Python namespaces, runs both reference graders and confirms unfinished starters do not pass. It also parses starter functions to prevent preimplemented helpers from entering the assignment.

For the full execution check, use a Python environment with NumPy, pandas, scikit-learn and statsmodels. Set `DARKWORLD_ML_PYTHON` to its interpreter path when needed. The verification environment used an ignored workspace virtual environment, not a new application dependency. Verified with scikit-learn 1.9.1 and statsmodels 0.15.0. Frontend lint, platform checks and the production/PWA build also passed. A browser walkthrough could not be completed because the browser tool connection was unavailable.
