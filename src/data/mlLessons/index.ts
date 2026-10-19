import { PYTHON_ML_ENGINEERING_LESSONS } from './pythonEngineering';
import { SQL_ML_DATA_WORK_LESSONS } from './sqlDataWork';
import { SQL_DEEP_DIVE } from './sqlDeepDive';
import { CURRICULUM_DEEP_DIVE } from './curriculumDeepDive';
import { PRACTICAL_EXAMPLES } from './practicalExamples';
import { COMPREHENSIVE_FOUNDATIONS } from './comprehensiveFoundations';
import { COMPREHENSIVE_EVALUATION } from './comprehensiveEvaluation';
import { COMPREHENSIVE_FORECASTING } from './comprehensiveForecasting';
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
import { ML_SYSTEM_DESIGN_LESSONS } from './systemDesign';
import { RESOURCES_BY_UNIT } from './resources';
import type { MlLesson } from './types';
import { enrichMlLessonWithCode } from './mlCodeEnrichment';

export type { MlLesson, MlLessonSection, MlResource } from './types';
export { ML_UNITS, ML_UNITS as ML_MODULES } from './units';
export type { MlUnit } from './units';

const RAW_LESSONS: MlLesson[] = [
  ...PYTHON_ML_ENGINEERING_LESSONS,
  ...SQL_ML_DATA_WORK_LESSONS,
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
  ...ML_SYSTEM_DESIGN_LESSONS,
].map((lesson) => SQL_DEEP_DIVE[lesson.id]
  ? { ...lesson, sections: SQL_DEEP_DIVE[lesson.id] }
  : lesson);

const LAB_BY_LESSON: Record<string, string> = {
  'data-viz': 'ml-found-08',
  'supervised-learning': 'ml-reg-07',
  'model-evaluation': 'ml-eval-06',
  'unsupervised-learning': 'ml-unsup-06',
  'time-series': 'ml-ts-03',
};

function attachLessonResources(lesson: MlLesson): MlLesson {
  return {
    ...lesson,
    challengeTaskId: lesson.challengeTaskId ?? LAB_BY_LESSON[lesson.id],
    resources: RESOURCES_BY_UNIT[lesson.unit],
  };
}

const COMPLETE_SECTIONS = { ...COMPREHENSIVE_FOUNDATIONS, ...COMPREHENSIVE_EVALUATION, ...COMPREHENSIVE_FORECASTING };
const EXPANDED_LESSONS = RAW_LESSONS.map((lesson) => {
  const completeSections = COMPLETE_SECTIONS[lesson.id];
  if (completeSections) return {
    ...lesson,
    sections: completeSections,
    challengeTaskId: lesson.id === 'pandas' ? 'ml-data-join-audit'
      : lesson.id === 'time-series' ? 'ml-ts-walk-forward' : lesson.challengeTaskId,
  };
  const deepDive = CURRICULUM_DEEP_DIVE[lesson.id];
  const practicalExample = PRACTICAL_EXAMPLES[lesson.id];
  return {
    ...lesson,
    sections: [
      ...lesson.sections,
      ...(deepDive ? [deepDive] : []),
      ...(practicalExample ? [practicalExample] : []),
    ],
  };
});

export const ML_LESSONS: MlLesson[] = EXPANDED_LESSONS.map(attachLessonResources).map(enrichMlLessonWithCode);

export function findMlLesson(id: string): MlLesson | undefined {
  return ML_LESSONS.find((l) => l.id === id);
}
