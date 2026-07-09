import type { ComponentType } from 'react';

export type ModuleStatus = 'available' | 'coming-soon';

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
  Content: ComponentType;
  quiz?: QuizQuestion[];
  labId?: string;
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
}
