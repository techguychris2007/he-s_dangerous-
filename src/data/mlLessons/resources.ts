import type { MlResource } from './types';

/** Curated, real, independently-verified resources — every URL here was found via live web
 *  search and confirmed to resolve before being added. Grouped per unit and attached to that
 *  unit's lessons in index.ts. Nothing here is fabricated or guessed from memory. */
export const RESOURCES_BY_UNIT: Record<string, MlResource[]> = {
  foundations: [
    {
      title: 'Kaggle Learn',
      url: 'https://www.kaggle.com/learn',
      kind: 'course',
      note: 'Free, in-browser micro-courses on Python, Pandas, and intro ML — no install required, each with hands-on exercises on real datasets.',
    },
    {
      title: '3Blue1Brown — Essence of Linear Algebra',
      url: 'https://www.3blue1brown.com/?topic=linear-algebra',
      kind: 'video',
      note: 'The clearest visual intuition for vectors, dot products, and matrix transformations available anywhere, free.',
    },
    {
      title: '3Blue1Brown — Calculus & Probability',
      url: 'https://www.3blue1brown.com/?topic=calculus',
      kind: 'video',
      note: 'Companion series building the same visual intuition for derivatives and gradients that gradient descent depends on.',
    },
    {
      title: 'Hands-On Machine Learning (3rd ed.) — source code',
      url: 'https://github.com/ageron/handson-ml3',
      kind: 'repo',
      note: "Aurélien Géron's companion notebooks for the O'Reilly book — clone it and run real scikit-learn/Keras code end to end.",
    },
  ],
  'data-handling': [
    {
      title: 'Kaggle Learn — Feature Engineering',
      url: 'https://www.kaggle.com/learn/feature-engineering',
      kind: 'course',
      note: 'Free hands-on course covering mutual information, creating features, clustering for features, and target encoding.',
    },
    {
      title: 'An Introduction to Statistical Learning (2nd ed.)',
      url: 'https://www.statlearning.com/',
      kind: 'book',
      note: 'Free official PDF (R and Python editions) — chapters on model selection and shrinkage cover the theory behind why scaling and regularization matter.',
    },
    {
      title: 'Hands-On Machine Learning (3rd ed.) — source code',
      url: 'https://github.com/ageron/handson-ml3',
      kind: 'repo',
      note: 'Chapter 2\'s end-to-end project notebook builds a full cleaning/encoding/scaling pipeline on a real housing dataset.',
    },
  ],
  regression: [
    {
      title: 'An Introduction to Statistical Learning (2nd ed.)',
      url: 'https://www.statlearning.com/',
      kind: 'book',
      note: 'The canonical free textbook for this whole unit — linear regression, polynomial regression, ridge/lasso, and logistic regression are dedicated chapters.',
    },
    {
      title: 'scikit-learn (source)',
      url: 'https://github.com/scikit-learn/scikit-learn',
      kind: 'repo',
      note: 'Clone it and read the actual LinearRegression/Ridge/Lasso/LogisticRegression implementations under sklearn/linear_model.',
    },
    {
      title: 'Hands-On Machine Learning (3rd ed.) — source code',
      url: 'https://github.com/ageron/handson-ml3',
      kind: 'repo',
      note: 'Chapter 4 implements gradient descent and regularized regression from scratch, notebook by notebook.',
    },
  ],
  classification: [
    {
      title: 'An Introduction to Statistical Learning (2nd ed.)',
      url: 'https://www.statlearning.com/',
      kind: 'book',
      note: 'Dedicated chapters on classification, tree-based methods, and support vector machines, with worked R/Python labs.',
    },
    {
      title: 'scikit-learn (source)',
      url: 'https://github.com/scikit-learn/scikit-learn',
      kind: 'repo',
      note: 'Real implementations of KNeighborsClassifier, DecisionTreeClassifier, RandomForestClassifier, SVC, and GaussianNB to read alongside these lessons.',
    },
    {
      title: 'Kaggle Learn',
      url: 'https://www.kaggle.com/learn',
      kind: 'course',
      note: 'The Intro to Machine Learning and Intermediate Machine Learning micro-courses cover trees, forests, and boosting hands-on.',
    },
  ],
  'model-evaluation': [
    {
      title: 'An Introduction to Statistical Learning (2nd ed.)',
      url: 'https://www.statlearning.com/',
      kind: 'book',
      note: 'Chapter 5 ("Resampling Methods") is the canonical treatment of cross-validation this lesson builds on.',
    },
    {
      title: 'scikit-learn (source)',
      url: 'https://github.com/scikit-learn/scikit-learn',
      kind: 'repo',
      note: 'sklearn/metrics implements precision, recall, F1, and ROC-AUC exactly as described here — worth reading the actual formulas in code.',
    },
  ],
  unsupervised: [
    {
      title: 'An Introduction to Statistical Learning (2nd ed.)',
      url: 'https://www.statlearning.com/',
      kind: 'book',
      note: 'Chapter 12 ("Unsupervised Learning") covers PCA and clustering with the same rigor as the supervised chapters.',
    },
    {
      title: 'scikit-learn (source)',
      url: 'https://github.com/scikit-learn/scikit-learn',
      kind: 'repo',
      note: 'KMeans, AgglomerativeClustering, and PCA implementations live under sklearn/cluster and sklearn/decomposition.',
    },
    {
      title: 'Kaggle Learn — Feature Engineering',
      url: 'https://www.kaggle.com/learn/feature-engineering',
      kind: 'course',
      note: 'Includes a hands-on lesson using k-means clustering as a feature-engineering technique.',
    },
  ],
  'neural-networks': [
    {
      title: 'Dive into Deep Learning',
      url: 'https://d2l.ai/',
      kind: 'book',
      note: 'Free interactive textbook — every chapter is a runnable notebook. Covers MLPs, CNNs, and RNN/LSTM/GRU in exactly this lesson order.',
    },
    {
      title: 'Dive into Deep Learning (source)',
      url: 'https://github.com/d2l-ai/d2l-en',
      kind: 'repo',
      note: 'Clone the book itself — every figure and result in it comes from code you can run and modify.',
    },
    {
      title: '3Blue1Brown — Neural Networks',
      url: 'https://www.3blue1brown.com/?topic=neural-networks',
      kind: 'video',
      note: 'The best free visual explanation of backpropagation and the chain rule anywhere.',
    },
  ],
  nlp: [
    {
      title: 'Speech and Language Processing (3rd ed. draft)',
      url: 'https://web.stanford.edu/~jurafsky/slp3/',
      kind: 'book',
      note: 'Jurafsky & Martin\'s free draft textbook — the standard NLP reference, covering tokenization through embeddings and transformers.',
    },
    {
      title: 'scikit-learn (source)',
      url: 'https://github.com/scikit-learn/scikit-learn',
      kind: 'repo',
      note: 'TfidfVectorizer and CountVectorizer (under sklearn/feature_extraction/text.py) are the real implementations behind the TF-IDF lesson.',
    },
  ],
  'time-series': [
    {
      title: 'Forecasting: Principles and Practice (3rd ed.)',
      url: 'https://otexts.com/fpp3/',
      kind: 'book',
      note: "Rob Hyndman's free, continuously-updated textbook — the standard reference for time series decomposition and forecasting.",
    },
  ],
  mlops: [
    {
      title: 'Made With ML — MLOps Course',
      url: 'https://madewithml.com/courses/mlops/',
      kind: 'course',
      note: 'Free, project-based course covering the full pipeline this unit summarizes: data, modeling, serving, testing, and production monitoring.',
    },
    {
      title: 'Made With ML (source)',
      url: 'https://github.com/GokuMohandas/Made-With-ML',
      kind: 'repo',
      note: 'Clone the actual production-grade ML application the course builds, including its CI/CD and monitoring setup.',
    },
    {
      title: 'An Introduction to Statistical Learning (2nd ed.)',
      url: 'https://www.statlearning.com/',
      kind: 'book',
      note: 'For the SQL/data lesson\'s modeling context — same book used throughout Units 3-6, free official PDF.',
    },
  ],
};
