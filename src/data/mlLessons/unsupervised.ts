import type { MlLesson } from './types';

export const UNSUPERVISED_LESSONS: MlLesson[] = [
  {
    id: 'unsupervised-learning',
    title: 'Unsupervised Learning &amp; k-means',
    source: 'Session 11',
    unit: 'unsupervised',
    demo: 'kmeans',
    sections: [
      {
        heading: 'Finding structure without labels',
        body: `<p>Unsupervised learning works on unlabeled data, looking for structure — groups of
        similar points (clustering) or lower-dimensional representations — rather than predicting a known
        answer. It's used both as a modeling tool in its own right (customer segmentation) and as an
        exploratory step before supervised modeling.</p>`,
      },
      {
        heading: 'k-means clustering',
        body: `<p>k-means partitions points into k clusters by repeating two steps until stable: assign
        every point to its nearest centroid, then move each centroid to the average position of its
        assigned points.</p>`,
      },
      {
        heading: 'Try it below',
        body: `<p>The panel below runs Lloyd's k-means algorithm on your data entirely in your browser and
        plots the resulting clusters and centroids.</p>`,
      },
    ],
  },
  {
    id: 'elbow-silhouette',
    title: 'Choosing k: Elbow Method &amp; Silhouette Score',
    source: 'Session 11',
    unit: 'unsupervised',
    challengeTaskId: 'ml-unsup-01',
    sections: [
      {
        heading: 'k-means needs to be told k',
        body: `<p>Unlike supervised learning, there's no "correct answer" to check k against — you have to
        decide how many clusters make sense for the data and problem, which is where these two techniques
        come in.</p>`,
      },
      {
        heading: 'The elbow method',
        body: `<p>Plot the total within-cluster sum of squared distances (inertia) against k for several
        values. Inertia always decreases as k increases (more clusters can always fit tighter), but it
        drops sharply at first and then levels off — the "elbow" in that curve is a reasonable choice of k.</p>`,
      },
      {
        heading: 'Silhouette score',
        body: `<p>The silhouette score measures, for each point, how much closer it is to its own cluster
        than to the next-nearest one, averaged across all points, from -1 (likely wrong cluster) to +1
        (well clustered). Unlike inertia, it doesn't automatically favor larger k, making it a more
        reliable way to compare different values of k directly.</p>`,
      },
    ],
  },
  {
    id: 'hierarchical-clustering',
    title: 'Hierarchical Clustering',
    source: 'Session 11',
    unit: 'unsupervised',
    challengeTaskId: 'ml-unsup-02',
    sections: [
      {
        heading: 'Clustering without picking k upfront',
        body: `<p>Hierarchical (agglomerative) clustering starts with every point as its own cluster, then
        repeatedly merges the two closest clusters until everything is in one — building a full tree
        (dendrogram) of nested clusters you can cut at any level to get however many clusters you want.</p>`,
      },
      {
        heading: 'Linkage: defining "closest"',
        body: `<ul>
          <li><strong>Single linkage</strong> — distance between the closest pair of points across two clusters.</li>
          <li><strong>Complete linkage</strong> — distance between the farthest pair of points.</li>
          <li><strong>Average linkage</strong> — average distance across all pairs.</li>
        </ul>`,
      },
      {
        heading: 'k-means vs. hierarchical',
        body: `<p>k-means is fast and scales to large datasets but needs k chosen upfront and assumes
        roughly round, similarly-sized clusters. Hierarchical clustering is slower (it's at least
        O(n&sup2;)) but gives you the whole nested structure at once and makes no assumption about cluster
        shape.</p>`,
      },
    ],
  },
  {
    id: 'pca',
    title: 'Dimensionality Reduction &amp; PCA',
    source: 'Session 11',
    unit: 'unsupervised',
    challengeTaskId: 'ml-unsup-03',
    sections: [
      {
        heading: 'Too many features, not enough signal',
        body: `<p>Datasets with hundreds of correlated columns are slow to train on, hard to visualize, and
        prone to the "curse of dimensionality" — distance-based methods like k-NN and k-means become less
        meaningful as dimensions grow, because points spread out and start looking equally far apart.</p>`,
      },
      {
        heading: 'What PCA actually does',
        body: `<p><strong>Principal Component Analysis</strong> finds new axes — linear combinations of the
        original features — ordered so the first captures the most variance in the data, the second
        captures the most of what's left (while staying perpendicular to the first), and so on. Keeping
        only the first few components compresses the data while preserving as much information as possible.</p>`,
      },
      {
        heading: 'Reading a scree plot',
        body: `<p>Plotting how much variance each successive component explains (a "scree plot") shows
        diminishing returns — the first few components often capture most of the variance, and a scree
        plot's elbow is a common way to decide how many components to keep, echoing the elbow method for
        choosing k.</p>`,
      },
    ],
  },
  {
    id: 'market-basket-analysis',
    title: 'Market Basket Analysis &amp; Association Rules',
    source: 'Session 11',
    unit: 'unsupervised',
    challengeTaskId: 'ml-unsup-04',
    sections: [
      {
        heading: 'What people buy together',
        body: `<p>Market basket analysis mines transaction data (receipts, carts) for patterns like "customers
        who buy bread also buy butter." It's the classic technique behind "customers who bought this also
        bought..." recommendations.</p>`,
      },
      {
        heading: 'Support, confidence, and lift',
        body: `<ul>
          <li><strong>Support</strong> — how often an itemset appears across all transactions: count(A and B) / total.</li>
          <li><strong>Confidence</strong> — given A is in the basket, how often B is too: count(A and B) / count(A).</li>
          <li><strong>Lift</strong> — how much more likely B is given A, compared to B on its own: confidence(A&rarr;B) /
          support(B). Lift &gt; 1 means a real positive association, not just both items being generally popular.</li>
        </ul>`,
      },
      {
        heading: 'Why lift matters',
        body: `<p>A rule can have high confidence just because B is bought by almost everyone regardless of
        A — high confidence alone is misleading. Lift corrects for that by comparing against B's baseline
        popularity, which is why it's the metric usually used to rank candidate rules.</p>`,
      },
    ],
  },
];
