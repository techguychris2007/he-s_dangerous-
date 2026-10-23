import { ML_PYTHON_ENGINEERING_TASKS } from './pythonEngineering';
import { ML_SQL_DATA_WORK_TASKS } from './sqlDataWork';
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
import { ML_ENGINEERING_PRACTICE } from './engineeringPractice';
import type { CodeTask } from '../codeTypes';
import { enrichCodeTasks } from '../enrichCodeTasks';

const RAW_ML_TASKS: CodeTask[] = [
  ...ML_PYTHON_ENGINEERING_TASKS,
  ...ML_SQL_DATA_WORK_TASKS,
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
  ...ML_ENGINEERING_PRACTICE,
];

export const ML_TASKS: CodeTask[] = enrichCodeTasks(RAW_ML_TASKS);

export const ML_TASK_CATEGORIES = [
  'ML: Python Engineering',
  'ML: SQL for Data Work',
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
