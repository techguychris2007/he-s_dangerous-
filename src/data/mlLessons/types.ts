export interface MlLessonSection {
  heading: string;
  /** trusted, hand-authored HTML — never render user input through this field */
  body: string;
}

export interface MlResource {
  title: string;
  url: string;
  kind: 'book' | 'course' | 'video' | 'repo' | 'docs';
  /** why this specific resource, in this lesson's context */
  note: string;
}

export interface MlLesson {
  id: string;
  title: string;
  /** which GCI World session this lesson's topic traces back to, or "Extension" for lessons added
   *  to round the curriculum out into a full course */
  source: string;
  unit: string;
  demo?: 'linear-regression' | 'kmeans';
  /** id of a CodeTask in src/labs/mlTasks — rendered as a "practice this" link on the lesson page */
  challengeTaskId?: string;
  sections: MlLessonSection[];
  /** real, verified external resources for going deeper than this lesson can — never fabricated */
  resources?: MlResource[];
}
