import { FOUNDATIONS_LESSONS } from './foundations';
import { DATA_HANDLING_LESSONS } from './dataHandling';
import { REGRESSION_LESSONS } from './regression';
import { CLASSIFICATION_LESSONS } from './classification';
import { MODEL_EVALUATION_LESSONS } from './modelEvaluation';
import { UNSUPERVISED_LESSONS } from './unsupervised';
import { NEURAL_NETWORKS_LESSONS } from './neuralNetworks';
import { NLP_LESSONS } from './nlp';
import { TIME_SERIES_LESSONS } from './timeSeries';
import { MLOPS_LESSONS } from './mlops';
import type { MlLesson } from './types';

export type { MlLesson, MlLessonSection } from './types';
export { ML_UNITS } from './units';
export type { MlUnit } from './units';

export const ML_LESSONS: MlLesson[] = [
  ...FOUNDATIONS_LESSONS,
  ...DATA_HANDLING_LESSONS,
  ...REGRESSION_LESSONS,
  ...CLASSIFICATION_LESSONS,
  ...MODEL_EVALUATION_LESSONS,
  ...UNSUPERVISED_LESSONS,
  ...NEURAL_NETWORKS_LESSONS,
  ...NLP_LESSONS,
  ...TIME_SERIES_LESSONS,
  ...MLOPS_LESSONS,
];

export function findMlLesson(id: string): MlLesson | undefined {
  return ML_LESSONS.find((l) => l.id === id);
}
