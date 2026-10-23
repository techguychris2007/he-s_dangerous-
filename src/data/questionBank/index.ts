import type { TypedQuestion } from '../../types';
import { PRE_SECURITY_QUESTIONS } from './preSecurity';
import { NETWORKING_QUESTIONS } from './networking';
import { LINUX_RECON_QUESTIONS } from './linuxRecon';
import { PYTHON_WEB_QUESTIONS } from './pythonWeb';
import { OFFENSIVE_QUESTIONS } from './offensive';
import { DEFENSIVE_QUESTIONS } from './defensive';
import { CLOUD_GRC_QUESTIONS } from './cloudGrc';
import { BINARY_ENGINEERING_QUESTIONS } from './binaryEngineering';
import { PROGRAMMING_QUESTIONS } from './programming';
import { MOBILE_WIRELESS_QUESTIONS } from './mobileWireless';
import { IOT_AI_QUESTIONS } from './iotAi';
import { ADVANCED_QUESTIONS } from './advanced';
import { PRACTITIONER_QUESTIONS } from './practitioner';

/** Hand-written typed-answer questions, keyed by lesson id. Every answer is a short term, command,
 *  number or path that appears in the lesson itself (checked by scripts/check-lesson-questions.cjs). */
export const QUESTION_BANK: Record<string, TypedQuestion[]> = {
  ...PRE_SECURITY_QUESTIONS,
  ...NETWORKING_QUESTIONS,
  ...LINUX_RECON_QUESTIONS,
  ...PYTHON_WEB_QUESTIONS,
  ...OFFENSIVE_QUESTIONS,
  ...DEFENSIVE_QUESTIONS,
  ...CLOUD_GRC_QUESTIONS,
  ...BINARY_ENGINEERING_QUESTIONS,
  ...PROGRAMMING_QUESTIONS,
  ...MOBILE_WIRELESS_QUESTIONS,
  ...IOT_AI_QUESTIONS,
  ...ADVANCED_QUESTIONS,
  ...PRACTITIONER_QUESTIONS,
};
