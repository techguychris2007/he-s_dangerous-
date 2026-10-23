import type { TypedQuestion } from '../../types';

/** IoT/embedded and AI/LLM security lessons. */
export const IOT_AI_QUESTIONS: Record<string, TypedQuestion[]> = {
  'iot-1': [
    { prompt: 'Tiny devices often run a stripped-down real-time OS instead of embedded Linux. What is its acronym?', answer: 'RTOS' },
    { prompt: 'How many layers does the IoT assessment model in this module have?', answer: 'four', accept: ['4'] },
  ],
  'iot-2': [
    { prompt: 'Which tool pulls a firmware image apart?', answer: 'binwalk' },
    { prompt: 'Which compressed read-only filesystem is extracted from the image?', answer: 'SquashFS' },
  ],
  'iot-3': [
    { prompt: 'Which serial debug interface often leads straight to a root shell?', answer: 'UART' },
    { prompt: 'UART uses TX, RX and which third pin?', answer: 'GND', accept: ['ground'] },
  ],
  'iot-4': [
    { prompt: 'Which BusyBox component is a common embedded web server?', answer: 'httpd' },
    { prompt: 'Over-the-air firmware updates are abbreviated as what?', answer: 'OTA' },
  ],
  'iot-5': [
    { prompt: 'Which IoT botnet is this lesson about?', answer: 'Mirai' },
    { prompt: 'Which port did Mirai scan for Telnet?', answer: '23' },
  ],
  'iot-6': [
    { prompt: 'Which publish/subscribe IoT protocol routes messages through a broker?', answer: 'MQTT' },
    { prompt: 'Which Z-Wave security framework can be downgraded?', answer: 'S2' },
  ],
  'iot-7': [
    { prompt: 'What does SCADA stand for?', answer: 'Supervisory Control and Data Acquisition' },
    { prompt: 'Which unauthenticated industrial protocol is named in this lesson?', answer: 'Modbus' },
  ],
  'iot-8': [
    { prompt: 'What does FSTM stand for?', answer: 'Firmware Security Testing Methodology' },
    { prompt: 'How many stages does OWASP FSTM have?', answer: 'nine', accept: ['9'] },
  ],
  'iot-modern-1': [
    { prompt: 'Installing an older, vulnerable firmware version is called a what attack?', answer: 'rollback' },
    { prompt: 'A hash without an authenticated expected value can simply be what along with the file?', answer: 'replaced' },
  ],
  'iot-modern-2': [
    { prompt: 'MQTT publishers send messages to named what?', answer: 'topics' },
    { prompt: 'Which subscription-filter feature can expose more devices than one exact topic?', answer: 'wildcards', accept: ['wildcard'] },
  ],
  'iot-modern-3': [
    { prompt: 'Establishing a device’s identity, network configuration and owner is called what?', answer: 'provisioning' },
    { prompt: 'One universal credential shipped across a whole product line is a product-wide what?', answer: 'secret' },
  ],
  'ai-1': [
    { prompt: 'Which genuinely new untrusted input channel do LLM applications introduce?', answer: 'natural language' },
    { prompt: 'What does LLM stand for?', answer: 'large language model' },
  ],
  'ai-2': [
    { prompt: 'Which OWASP LLM Top 10 ID is prompt injection?', answer: 'LLM01' },
    { prompt: 'Getting a model to ignore its safety training is called what?', answer: 'jailbreaking', accept: ['jailbreak'] },
  ],
  'ai-3': [
    { prompt: 'Which DOM property treats an assigned string as plain text rather than HTML?', answer: 'textContent' },
    { prompt: 'Which OWASP 2025 ID is excessive agency?', answer: 'LLM06' },
  ],
  'ai-4': [
    { prompt: 'Which Python serialisation format makes downloaded model files dangerous?', answer: 'pickle' },
    { prompt: 'Reconstructing a private model through repeated queries is model what?', answer: 'extraction' },
  ],
  'ai-5': [
    { prompt: 'What does RAG stand for?', answer: 'Retrieval-Augmented Generation', accept: ['retrieval augmented generation'] },
    { prompt: 'Which company’s ChatGPT incident is covered?', answer: 'Samsung' },
  ],
  'ai-6': [
    { prompt: 'Inputs crafted to fool a classifier imperceptibly are called adversarial what?', answer: 'examples' },
    { prompt: 'Which road sign was used in the physical-world study?', answer: 'stop sign', accept: ['stop-sign'] },
  ],
  'ai-7': [
    { prompt: 'Which NIST framework for AI risk is covered? (acronym form)', answer: 'AI RMF', accept: ['nist ai rmf'] },
    { prompt: 'Which European law is covered?', answer: 'EU AI Act', accept: ['ai act'] },
  ],
  'ai-8': [
    { prompt: 'Which tool-calling standard (three letters) is discussed for agents?', answer: 'MCP' },
    { prompt: 'Multi-agent systems compound which problem from lesson 3?', answer: 'excessive agency' },
  ],
};
