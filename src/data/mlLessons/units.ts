export interface MlUnit {
  id: string;
  title: string;
  blurb: string;
}

/** Defines display order — MlPortalPage renders units in this sequence regardless of the order
 *  lesson files happen to be imported in. */
export const ML_UNITS: MlUnit[] = [
  { id: 'foundations', title: '1. Foundations', blurb: 'Python, NumPy, pandas, statistics, linear algebra, and calculus — the toolkit everything else is built on.' },
  { id: 'data-handling', title: '2. Data Handling & Feature Engineering', blurb: 'Cleaning, scaling, encoding, and shaping raw data into something a model can learn from.' },
  { id: 'regression', title: '3. Regression', blurb: 'Predicting continuous values: linear, polynomial, regularized, and the gradient descent that fits them.' },
  { id: 'classification', title: '4. Classification', blurb: 'Predicting categories: logistic regression, trees, ensembles, k-NN, SVM, and naive Bayes.' },
  { id: 'model-evaluation', title: '5. Model Evaluation', blurb: 'Knowing whether a model is actually good — metrics, validation, and tuning.' },
  { id: 'unsupervised', title: '6. Unsupervised Learning', blurb: 'Finding structure without labels: clustering, dimensionality reduction, association rules.' },
  { id: 'neural-networks', title: '7. Neural Networks & Deep Learning', blurb: 'From a single perceptron to CNNs and RNNs.' },
  { id: 'nlp', title: '8. Natural Language Processing', blurb: 'Turning text into features a model can use, from bag-of-words to embeddings.' },
  { id: 'time-series', title: '9. Time Series', blurb: 'Modeling data where order matters.' },
  { id: 'mlops', title: '10. Data Engineering & MLOps', blurb: 'Getting a model from a notebook into the real world, responsibly.' },
];
