import type { ComponentType } from 'react';

export type ModuleStatus = 'available' | 'coming-soon';

export type RoadmapTrack = 'presecurity' | 'security' | 'defensive' | 'programming' | 'software' | 'ml';

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonMeta {
  id: string;
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  objectives?: string[];
  prerequisite?: string;
  Content: ComponentType;
  quiz?: QuizQuestion[];
  /** Typed-answer questions (TryHackMe style) asked at the end of the lesson. */
  questions?: TypedQuestion[];
  /** Lesson vocabulary; also feeds typed questions when none are authored. */
  keyTerms?: { term: string; meaning: string }[];
  labId?: string;
}

/** A question answered by typing. Answers are compared case-insensitively, ignoring punctuation,
 *  extra spaces and leading articles; `accept` lists other spellings that also count. */
export interface TypedQuestion {
  prompt: string;
  answer: string;
  accept?: string[];
  hint?: string;
}

export interface ModuleMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  status: ModuleStatus;
  sourceBooks: string[];
  icon: string;
  lessons: LessonMeta[];
}

export interface RoadmapStage {
  title: string;
  status: ModuleStatus;
  moduleSlug?: string;
  href?: string;
  sourceBooks: string[];
  track: RoadmapTrack;
}
