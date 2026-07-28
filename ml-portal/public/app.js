const SAMPLE_DATA = {
  linear_regression: `1,2.1
2,4.3
3,5.8
4,8.2
5,9.9
6,12.3
7,13.8
8,16.1
9,17.9
10,20.2`,
  kmeans: `2,2
2.5,1.8
1.8,2.4
2.2,2.1
1.5,1.9
8,3
8.5,2.7
7.8,3.3
8.2,3.1
7.5,2.9
5,9
5.4,8.7
4.8,9.3
5.2,9.1
4.9,8.8`,
};

let activeChart = null;

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  const homeBtn = document.createElement('button');
  homeBtn.className = 'nav-item';
  homeBtn.textContent = 'Course Overview';
  homeBtn.dataset.id = 'home';
  sidebar.appendChild(homeBtn);

  for (const group of CURRICULUM) {
    const h3 = document.createElement('h3');
    h3.textContent = group.group;
    sidebar.appendChild(h3);
    for (const lesson of group.lessons) {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.textContent = lesson.title.replace(/&amp;/g, '&');
      btn.dataset.id = lesson.id;
      sidebar.appendChild(btn);
    }
  }

  sidebar.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (!btn) return;
    location.hash = btn.dataset.id;
  });
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.id === id);
  });
}

function renderHome() {
  const content = document.getElementById('content');
  let cards = '';
  for (const group of CURRICULUM) {
    for (const lesson of group.lessons) {
      cards += `<div class="lesson-card" data-id="${lesson.id}">
        <h4>${lesson.title}</h4>
        <span>${lesson.source}</span>
      </div>`;
    }
  }
  content.innerHTML = `
    <h1>Machine Learning Portal</h1>
    <p>A self-paced walkthrough of the GCI World data science &amp; ML curriculum, from
    Python basics through supervised and unsupervised learning, with two hands-on demos
    backed by a real C++ compute engine. Pick a topic from the sidebar or a card below.</p>
    <div class="card-grid">${cards}</div>
  `;
  content.querySelectorAll('.lesson-card').forEach((card) => {
    card.addEventListener('click', () => { location.hash = card.dataset.id; });
  });
}

function renderLesson(lesson) {
  const content = document.getElementById('content');
  let html = `<h1>${lesson.title}</h1>`;
  html += `<div class="lesson-source">${lesson.source}</div>`;
  for (const section of lesson.sections) {
    html += `<div class="section"><h2>${section.heading}</h2>${section.body}</div>`;
  }
  if (lesson.demo) {
    html += `<div class="demo-panel" id="demo-panel"></div>`;
  }
  content.innerHTML = html;

  if (lesson.demo === 'linear_regression') renderLinearRegressionDemo();
  if (lesson.demo === 'kmeans') renderKMeansDemo();
}

function renderLinearRegressionDemo() {
  const panel = document.getElementById('demo-panel');
  panel.innerHTML = `
    <h3>Try it: Linear Regression</h3>
    <div class="demo-controls">
      <div>
        <textarea id="lr-data">${SAMPLE_DATA.linear_regression}</textarea>
        <div class="demo-buttons">
          <button class="action" id="lr-run">Run</button>
          <button class="secondary" id="lr-sample">Load sample data</button>
        </div>
        <div class="demo-status" id="lr-status"></div>
      </div>
      <div class="demo-side">
        <canvas id="lr-chart"></canvas>
        <div class="demo-results" id="lr-results"></div>
      </div>
    </div>
  `;

  document.getElementById('lr-sample').addEventListener('click', () => {
    document.getElementById('lr-data').value = SAMPLE_DATA.linear_regression;
  });

  document.getElementById('lr-run').addEventListener('click', async () => {
    const data = document.getElementById('lr-data').value;
    const status = document.getElementById('lr-status');
    status.textContent = 'Running C++ engine...';
    status.className = 'demo-status';
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: 'linear_regression', data }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'request failed');

      status.textContent = 'Done.';
      status.className = 'demo-status ok';
      document.getElementById('lr-results').textContent =
        `slope = ${json.slope.toFixed(4)}, intercept = ${json.intercept.toFixed(4)}, MSE = ${json.mse.toFixed(4)}`;

      const sorted = [...json.points].sort((a, b) => a.x - b.x);
      drawChart('lr-chart', {
        type: 'scatter',
        data: {
          datasets: [
            { label: 'data', data: json.points.map((p) => ({ x: p.x, y: p.y })), backgroundColor: '#5b8def' },
            { label: 'fit', data: sorted.map((p) => ({ x: p.x, y: p.yhat })), type: 'line', borderColor: '#7bd88f', backgroundColor: '#7bd88f', pointRadius: 0 },
          ],
        },
        options: chartOptions(),
      });
    } catch (err) {
      status.textContent = err.message;
      status.className = 'demo-status error';
    }
  });
}

function renderKMeansDemo() {
  const panel = document.getElementById('demo-panel');
  panel.innerHTML = `
    <h3>Try it: k-means Clustering</h3>
    <div class="demo-controls">
      <div>
        <textarea id="km-data">${SAMPLE_DATA.kmeans}</textarea>
        <div class="demo-params">
          <label>k <input type="number" id="km-k" value="3" min="1" max="10" /></label>
          <label>max iterations <input type="number" id="km-iter" value="100" min="1" max="1000" /></label>
        </div>
        <div class="demo-buttons">
          <button class="action" id="km-run">Run</button>
          <button class="secondary" id="km-sample">Load sample data</button>
        </div>
        <div class="demo-status" id="km-status"></div>
      </div>
      <div class="demo-side">
        <canvas id="km-chart"></canvas>
        <div class="demo-results" id="km-results"></div>
      </div>
    </div>
  `;

  document.getElementById('km-sample').addEventListener('click', () => {
    document.getElementById('km-data').value = SAMPLE_DATA.kmeans;
  });

  document.getElementById('km-run').addEventListener('click', async () => {
    const data = document.getElementById('km-data').value;
    const k = document.getElementById('km-k').value;
    const maxIter = document.getElementById('km-iter').value;
    const status = document.getElementById('km-status');
    status.textContent = 'Running C++ engine...';
    status.className = 'demo-status';
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algorithm: 'kmeans', data, k, maxIter }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'request failed');

      status.textContent = 'Done.';
      status.className = 'demo-status ok';
      document.getElementById('km-results').textContent =
        `k = ${json.k}, converged in ${json.iterations} iteration(s)`;

      const palette = ['#5b8def', '#7bd88f', '#e0a95e', '#e06c75', '#c48bee', '#5ec9d6'];
      const byCluster = {};
      for (const p of json.points) {
        (byCluster[p.cluster] ??= []).push({ x: p.x, y: p.y });
      }
      const datasets = Object.keys(byCluster).map((c) => ({
        label: `cluster ${c}`,
        data: byCluster[c],
        backgroundColor: palette[c % palette.length],
      }));
      datasets.push({
        label: 'centroids',
        data: json.centroids.map((c) => ({ x: c.x, y: c.y })),
        backgroundColor: '#e7ecf7',
        pointStyle: 'cross',
        radius: 10,
        borderWidth: 2,
      });

      drawChart('km-chart', { type: 'scatter', data: { datasets }, options: chartOptions() });
    } catch (err) {
      status.textContent = err.message;
      status.className = 'demo-status error';
    }
  });
}

function chartOptions() {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: '#e7ecf7' } } },
    scales: {
      x: { ticks: { color: '#9aa7c2' }, grid: { color: '#2a3452' } },
      y: { ticks: { color: '#9aa7c2' }, grid: { color: '#2a3452' } },
    },
  };
}

function drawChart(canvasId, config) {
  if (activeChart) activeChart.destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');
  activeChart = new Chart(ctx, config);
}

function route() {
  const id = location.hash.replace('#', '') || 'home';
  setActiveNav(id);
  if (id === 'home' || !LESSON_INDEX[id]) {
    renderHome();
  } else {
    renderLesson(LESSON_INDEX[id]);
  }
}

renderSidebar();
window.addEventListener('hashchange', route);
route();
