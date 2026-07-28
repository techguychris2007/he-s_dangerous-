# ML Portal

A teaching portal for the GCI World machine learning curriculum. It walks
through the course topics (Python basics → NumPy → pandas → visualization →
supervised learning → model evaluation → feature engineering & ensembles →
unsupervised learning → time series → SQL), and two lessons include a
hands-on demo backed by a real Python compute engine (linear regression and
k-means clustering) — matching the language the GCI World course itself uses.

C++ and JavaScript programming practice lives separately in the sibling
[`code-portal`](../code-portal) folder; this portal is Python + JavaScript
(JS only for the browser UI) throughout.

## Structure

```
ml-portal/
  python/      ML engines (linear_regression.py, kmeans.py)
  server/      Node.js server: serves the frontend and runs the Python engines
  public/      Frontend: index.html, style.css, app.js, lessons.js
  data/        Sample CSV datasets used by the demos
```

## Run it

Requires Python 3 and Node.js on PATH (both already installed on this
machine). No build step — Python runs directly.

```powershell
node server\server.js
```

Then open <http://localhost:3000>.

## How the demo works

1. The browser posts CSV data to `POST /api/run` with `{ algorithm, data }`.
2. `server/server.js` spawns the matching Python script and pipes the CSV to its stdin.
3. The Python script computes the result and prints JSON to stdout.
4. The server relays that JSON back to the browser, which renders it with Chart.js.

## Adding a new lesson

Lesson content lives in `public/lessons.js` as a plain data array — add an
entry to a group's `lessons` list with `id`, `title`, `source`, and `sections`
(each `{ heading, body }`, `body` is HTML). Set `demo: 'linear_regression'` or
`demo: 'kmeans'` to embed an existing demo, or leave it out for a text-only lesson.
