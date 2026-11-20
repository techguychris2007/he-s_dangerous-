import type { MlLesson } from './types';

/** Stable SQL lesson IDs and lab relationships. The full, lesson-specific teaching is maintained
 *  in sqlDeepDive.ts and attached in the curriculum index before any lesson is rendered. */
const SQL_LESSON_INDEX: Array<[string, string, string]> = [
  ['sql-ml-relational-model', 'Relational Thinking: Tables, Rows, Keys, and Features', 'ml-sql-01'],
  ['sql-ml-select-filter-sort', 'SELECT, WHERE, ORDER BY, LIMIT', 'ml-sql-02'],
  ['sql-ml-aggregates-groupby', 'Aggregates and GROUP BY for Feature Summaries', 'ml-sql-03'],
  ['sql-ml-joins', 'INNER, LEFT, and Many-to-One Joins', 'ml-sql-04'],
  ['sql-ml-case-nulls', 'CASE, NULL, COALESCE, and Data Cleaning in SQL', 'ml-sql-05'],
  ['sql-ml-ctes-subqueries', 'Subqueries and CTEs for Readable Feature Pipelines', 'ml-sql-06'],
  ['sql-ml-window-functions', 'Window Functions for Time-Aware Features', 'ml-sql-07'],
  ['sql-ml-schema-indexes', 'Schema Design, Constraints, and Indexes', 'ml-sql-08'],
  ['sql-ml-transactions', 'Transactions, Isolation, and Reliable Data Loads', 'ml-sql-09'],
  ['sql-ml-feature-store-query', 'End-to-End SQL Feature Dataset', 'ml-sql-10'],
];

export const SQL_ML_DATA_WORK_LESSONS: MlLesson[] = SQL_LESSON_INDEX.map(([id, title, challengeTaskId]) => ({
  id,
  title,
  source: 'SQL for ML data work',
  unit: 'sql-ml-data-work',
  challengeTaskId,
  sections: [],
}));
