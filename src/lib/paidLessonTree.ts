import { createElement, Fragment, type ComponentType, type ReactNode } from 'react';
import CodeBlock from '../components/lesson/CodeBlock';
import Callout from '../components/lesson/Callout';
import PracticeTasksCallout from '../components/lesson/PracticeTasksCallout';
import CurriculumArticle from '../content/CurriculumArticle';

/** A lesson body as a plain element tree (see scripts/paid-content.cjs, serializeElement): a string,
 *  an HTML element {t}, a known component {k}, or a fragment {f}. */
export type LessonNode = string | { t: string; p: Record<string, unknown>; c: LessonNode[] } | { k: string; p: Record<string, unknown>; c: LessonNode[] } | { f: 1; c: LessonNode[] };
type Node = LessonNode;

const COMPONENTS: Record<string, ComponentType<any>> = { CodeBlock, Callout, PracticeTasksCallout, CurriculumArticle };

function reviveProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) out[key] = value && typeof value === 'object' && '$el' in value ? renderNode((value as { $el: Node }).$el) : value;
  return out;
}

export function renderNode(node: Node | Node[] | null): ReactNode {
  if (node === null) return null;
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return createElement(Fragment, null, ...node.map(renderNode));
  const children = node.c.map(renderNode);
  if ('f' in node) return createElement(Fragment, null, ...children);
  if ('t' in node) return createElement(node.t, reviveProps(node.p), ...children);
  const component = COMPONENTS[node.k];
  if (!component) return null;
  return createElement(component, reviveProps(node.p), ...children);
}

