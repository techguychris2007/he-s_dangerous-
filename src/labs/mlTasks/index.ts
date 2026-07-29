import { ML_FOUNDATIONS_TASKS } from './foundations';
import { ML_DATA_HANDLING_TASKS } from './dataHandling';
import { ML_REGRESSION_TASKS } from './regression';
import { ML_CLASSIFICATION_TASKS } from './classification';
import { ML_MODEL_EVALUATION_TASKS } from './modelEvaluation';
import { ML_UNSUPERVISED_TASKS } from './unsupervised';
import { ML_NEURAL_NETWORKS_TASKS } from './neuralNetworks';
import { ML_NLP_TASKS } from './nlp';
import { ML_TIME_SERIES_TASKS } from './timeSeries';
import { ML_MLOPS_TASKS } from './mlops';
import type { CodeTask } from '../codeTypes';

export const ML_TASKS: CodeTask[] = [
  ...ML_FOUNDATIONS_TASKS,
  ...ML_DATA_HANDLING_TASKS,
  ...ML_REGRESSION_TASKS,
  ...ML_CLASSIFICATION_TASKS,
  ...ML_MODEL_EVALUATION_TASKS,
  ...ML_UNSUPERVISED_TASKS,
  ...ML_NEURAL_NETWORKS_TASKS,
  ...ML_NLP_TASKS,
  ...ML_TIME_SERIES_TASKS,
  ...ML_MLOPS_TASKS,
];

export const ML_TASK_CATEGORIES = [
  'ML: Foundations',
  'ML: Data Handling',
  'ML: Regression',
  'ML: Classification',
  'ML: Model Evaluation',
  'ML: Unsupervised Learning',
  'ML: Neural Networks',
  'ML: NLP',
  'ML: Time Series',
  'ML: Data Engineering & MLOps',
] as const;
