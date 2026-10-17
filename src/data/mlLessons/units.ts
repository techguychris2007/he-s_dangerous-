export interface MlUnit {
  id: string;
  title: string;
  blurb: string;
}

/** Defines display order - MlPortalPage renders units in this sequence regardless of the order
 *  lesson files happen to be imported in. */
export const ML_UNITS: MlUnit[] = [
  { id: 'python-ml-engineering', title: 'Module 1 · Python for ML Engineering', blurb: 'Variables, strings, functions, data structures, files, OOP, async, testing, and project structure for future ML engineers.' },
  { id: 'sql-ml-data-work', title: 'Module 2 · SQL for ML Data Work', blurb: 'Relational thinking, joins, aggregates, windows, transactions, and feature-dataset queries using real SQL habits.' },
  { id: 'foundations', title: 'Module 3 · Foundations', blurb: 'Python, NumPy, pandas, statistics, linear algebra, and calculus - the toolkit everything else is built on.' },
  { id: 'data-handling', title: 'Module 4 · Data Handling & Feature Engineering', blurb: 'Cleaning, scaling, encoding, and shaping raw data into something a model can learn from.' },
  { id: 'regression', title: 'Module 5 · Regression', blurb: 'Predicting continuous values: linear, polynomial, regularized, and the gradient descent that fits them.' },
  { id: 'classification', title: 'Module 6 · Classification', blurb: 'Predicting categories: logistic regression, trees, ensembles, k-NN, SVM, and naive Bayes.' },
  { id: 'model-evaluation', title: 'Module 7 · Model Evaluation', blurb: 'Knowing whether a model is actually good - metrics, validation, and tuning.' },
  { id: 'unsupervised', title: 'Module 8 · Unsupervised Learning', blurb: 'Finding structure without labels: clustering, dimensionality reduction, association rules.' },
  { id: 'neural-networks', title: 'Module 9 · Neural Networks & Deep Learning', blurb: 'From perceptrons and backpropagation to CNNs, sequence models, attention, and transformers.' },
  { id: 'nlp', title: 'Module 10 · Natural Language Processing', blurb: 'Turning text into features a model can use, from bag-of-words to embeddings.' },
  { id: 'time-series', title: 'Module 11 · Time Series', blurb: 'Modeling data where order matters.' },
  { id: 'mlops', title: 'Module 12 · Data Engineering & MLOps', blurb: 'Getting a model from a notebook into the real world, responsibly.' },
  { id: 'ml-system-design', title: 'Module 13 · ML System Design & Responsible Deployment', blurb: 'Turn a model into a dependable product: frame decisions, define data contracts, prevent leakage, serve predictions, investigate errors, and monitor outcomes.' },
];
