import { PYTHON_FUNDAMENTALS_TASKS } from './fundamentals';
import { PYTHON_CRYPTO_TASKS } from './cryptoAndEncoding';
import { PYTHON_OOP_TASKS } from './oop';
import { PYTHON_ADVANCED_TASKS } from './advanced';
import { PYTHON_CAPSTONE_TASKS } from './capstones';
import { PYTHON_AI_AGENT_TASKS } from './aiAgents';
import { PYTHON_ETHICAL_HACKING_AGENT_TASKS } from './ethicalHackingAgents';
import type { CodeTask } from '../codeTypes';
import { enrichCodeTasks } from '../enrichCodeTasks';
import { CLOUD_PROTOCOL_TASKS } from './cloudAndProtocols';
import { SE_TASKS } from './softwareEngineering';

const RAW_PYTHON_TASKS: CodeTask[] = [
  ...PYTHON_FUNDAMENTALS_TASKS,
  ...PYTHON_CRYPTO_TASKS,
  ...PYTHON_OOP_TASKS,
  ...PYTHON_ADVANCED_TASKS,
  ...PYTHON_CAPSTONE_TASKS,
  ...PYTHON_AI_AGENT_TASKS,
  ...PYTHON_ETHICAL_HACKING_AGENT_TASKS,
];

export const PYTHON_TASKS: CodeTask[] = [...enrichCodeTasks(RAW_PYTHON_TASKS), ...CLOUD_PROTOCOL_TASKS, ...SE_TASKS];

export const PYTHON_TASK_CATEGORIES = ['Fundamentals', 'Cryptography & Encoding', 'OOP', 'Advanced', 'Capstone', 'AI Agents', 'Software Engineering'] as const;
