import type { MlResource } from './types';

/** Curated, real, independently-verified resources — every URL here was found via live web
 *  search and confirmed to resolve before being added. Grouped per unit and attached to that
 *  unit's lessons in index.ts. Nothing here is fabricated or guessed from memory. */
export const RESOURCES_BY_UNIT: Record<string, MlResource[]> = {
  'python-ml-engineering': [
    { title: 'Python Data Science Handbook', url: 'https://github.com/jakevdp/PythonDataScienceHandbook', kind: 'repo', note: 'Hands-on notebooks for IPython, NumPy, pandas, visualization, and scikit-learn. Use its concepts with current package documentation because notebook dependencies can age.' },
    { title: 'Automate the Boring Stuff with Python', url: 'https://automatetheboringstuff.com/', kind: 'book', note: 'Practical beginner material for functions, files, regular expressions, CSV/JSON, and safe automation patterns used in data preparation.' },
    { title: 'Machine Learning for Beginners', url: 'https://github.com/microsoft/ML-For-Beginners', kind: 'repo', note: 'Project-based curriculum with Python and scikit-learn foundations, quizzes, and lessons on responsible ML.' },
    { title: 'Complete Machine Learning Package', url: 'https://github.com/Nyandwi/machine_learning_complete', kind: 'repo', note: 'A broad notebook sequence across Python data tools, classical ML, computer vision, NLP, and deployment concepts.' },
  ],
  foundations: [
    { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course/', kind: 'course', note: 'A current, practical companion for linear and logistic models, data preparation, generalization, neural networks, and responsible ML.' },
    { title: 'NumPy user guide', url: 'https://numpy.org/doc/stable/user/', kind: 'docs', note: 'Official explanations and examples for arrays, shapes, broadcasting, indexing, and numerical operations used in the code walkthroughs.' },
    { title: 'pandas user guide', url: 'https://pandas.pydata.org/docs/user_guide/', kind: 'docs', note: 'Current documentation for data cleaning, missing values, joins, grouping, indexing, and time series.' },
    { title: 'Python Data Science Handbook', url: 'https://github.com/jakevdp/PythonDataScienceHandbook', kind: 'repo', note: 'Concrete NumPy, pandas, plotting, and scikit-learn examples to accompany the data-science foundations.' },
    { title: 'ISLP Python labs', url: 'https://github.com/intro-stat-learning/ISLP_labs', kind: 'repo', note: 'Official Python exercises for statistical learning, including regression, classification, resampling, and unsupervised methods.' },
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
    { title: 'scikit-learn: preprocessing and pipelines', url: 'https://scikit-learn.org/stable/modules/compose.html', kind: 'docs', note: 'Official examples show how transformers and estimators fit together and why pipelines prevent preprocessing leakage in cross-validation.' },
    { title: 'scikit-learn: preprocessing data', url: 'https://scikit-learn.org/stable/modules/preprocessing.html', kind: 'docs', note: 'Reference for scaling, categorical encoding, imputation, and their assumptions.' },
    { title: 'Machine Learning for Beginners', url: 'https://github.com/microsoft/ML-For-Beginners', kind: 'repo', note: 'Structured lessons and projects that reinforce data preparation, model evaluation, and responsible practice.' },
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
    { title: 'scikit-learn: linear models', url: 'https://scikit-learn.org/stable/modules/linear_model.html', kind: 'docs', note: 'Current API and practical guidance for linear regression, Ridge, Lasso, and logistic regression.' },
    { title: 'ISLP Python labs', url: 'https://github.com/intro-stat-learning/ISLP_labs', kind: 'repo', note: 'Runnable companion labs for linear models, regularization, classification, model selection, and nonlinear methods.' },
    { title: 'ML From Scratch', url: 'https://github.com/eriklindernoren/ML-From-Scratch', kind: 'repo', note: 'Readable NumPy implementations help expose algorithm mechanics; compare them with mature libraries before production use.' },
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
    { title: 'scikit-learn: supervised learning', url: 'https://scikit-learn.org/stable/supervised_learning.html', kind: 'docs', note: 'Official user guide for nearest neighbors, trees, ensembles, support-vector machines, and probabilistic classifiers.' },
    { title: 'ISLP Python labs', url: 'https://github.com/intro-stat-learning/ISLP_labs', kind: 'repo', note: 'Companion exercises cover classification, resampling, support-vector machines, and ensemble methods.' },
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
    { title: 'scikit-learn: cross-validation', url: 'https://scikit-learn.org/stable/modules/cross_validation.html', kind: 'docs', note: 'Official guide to held-out evaluation, splitters, multiple metrics, and avoiding leakage during model selection.' },
    { title: 'Google ML Crash Course: classification metrics', url: 'https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall', kind: 'docs', note: 'Beginner-friendly explanations and exercises for confusion matrices, precision, recall, and classification thresholds.' },
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
    { title: 'PyTorch: automatic differentiation', url: 'https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html', kind: 'docs', note: 'Official walkthrough of computational graphs, gradient calculation, and the backpropagation step used in these lessons.' },
    { title: 'TensorFlow: overfitting and underfitting', url: 'https://www.tensorflow.org/tutorials/keras/overfit_and_underfit', kind: 'docs', note: 'Executable examples that compare model capacity, validation curves, weight regularization, and dropout.' },
    { title: 'Dive into Deep Learning', url: 'https://github.com/d2l-ai/d2l-en', kind: 'repo', note: 'Integrated explanations, mathematics, and executable code for modern deep-learning techniques and applications.' },
    { title: 'Deep Learning with Python notebooks', url: 'https://github.com/fchollet/deep-learning-with-python-notebooks', kind: 'repo', note: 'Companion notebooks for Keras-based deep learning, including vision, sequence models, transformers, and practical workflows.' },
    { title: 'Hands-On Machine Learning 3rd edition', url: 'https://github.com/ageron/handson-ml3', kind: 'repo', note: 'End-to-end notebooks spanning scikit-learn, deep learning, computer vision, NLP, and deployment. Check current framework docs before installing older notebook pins.' },
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
    { title: 'Dive into Deep Learning — NLP', url: 'https://github.com/d2l-ai/d2l-en', kind: 'repo', note: 'Code and explanations for sequence modeling, attention, and transformer-based NLP.' },
    { title: 'Deep Learning with Python notebooks', url: 'https://github.com/fchollet/deep-learning-with-python-notebooks', kind: 'repo', note: 'Practical Keras examples for text classification, sequence models, and transformer-era NLP.' },
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
    { title: 'MLflow: experiment tracking', url: 'https://mlflow.org/docs/latest/tracking/', kind: 'docs', note: 'Current reference for recording model parameters, metrics, code versions, and artifacts as reproducible experiment runs.' },
    { title: 'MLflow: model evaluation', url: 'https://mlflow.org/docs/latest/ml/evaluation/', kind: 'docs', note: 'Examples for assessing regression and classification models, producing diagnostic artifacts, and validating release thresholds.' },
    { title: 'Machine Learning Systems Design', url: 'https://github.com/chiphuyen/machine-learning-systems-design', kind: 'repo', note: 'A concise system-design reading on problem framing, data pipelines, modeling, serving, and maintenance; treat it as a foundational overview and verify implementation details with current docs.' },
    { title: 'Hands-On Machine Learning 3rd edition', url: 'https://github.com/ageron/handson-ml3', kind: 'repo', note: 'End-to-end practice for pipelines, model training, tuning, and deployment. The concepts remain useful; dependency versions in notebooks may need updating.' },
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
  'ml-system-design': [
    { title: 'Google: Rules of Machine Learning', url: 'https://developers.google.com/machine-learning/guides/rules-of-ml', kind: 'docs', note: 'Engineering guidance on problem framing, reliable data, launch decisions, and monitoring production ML systems.' },
    { title: 'Machine Learning Systems Design', url: 'https://github.com/chiphuyen/machine-learning-systems-design', kind: 'repo', note: 'Source reading for problem setup, data contracts, error analysis, serving, testing, and ongoing maintenance.' },
    { title: 'ISLP package and labs', url: 'https://github.com/intro-stat-learning/ISLP', kind: 'repo', note: 'Official code and lab materials for statistical learning methods, model selection, resampling, and evaluation.' },
    { title: 'Microsoft ML for Beginners', url: 'https://github.com/microsoft/ML-For-Beginners', kind: 'repo', note: 'Beginner-friendly project lessons that connect model building with data quality, interpretation, and responsible use.' },
    { title: 'Awesome Machine Learning', url: 'https://github.com/josephmisiti/awesome-machine-learning', kind: 'repo', note: 'A discovery index for libraries and learning material. Check each project’s maintenance status, license, and official documentation before adopting it.' },
  ],
  'sql-ml-data-work': [
    { title: 'PostgreSQL: SQL language tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html', kind: 'docs', note: 'Official, executable introduction to relational queries, joins, aggregates, transactions, and database concepts used to prepare ML datasets.' },
    { title: 'PostgreSQL: window functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html', kind: 'docs', note: 'Explains partitions, ordering, frames, and the difference between a window calculation and a grouped aggregate.' },
    { title: 'pandas: combining tables', url: 'https://pandas.pydata.org/docs/user_guide/merging.html', kind: 'docs', note: 'Current reference for SQL-style joins, keys, cardinality, and combining feature tables after extraction.' },
  ],
};
