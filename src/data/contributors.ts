export interface Contributor {
  name: string;
  role: string;
  contribution: string;
  linkedin?: string;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: 'ChrisB',
    role: 'Co-builder',
    contribution:
      'Built DarkWorld together with Benedict Adjei, turning a shared vision for practical cybersecurity learning into this academy.',
    linkedin: 'https://www.linkedin.com/in/christopher-bondam-53bb973b8/',
  },
  {
    name: 'Benedict Adjei',
    role: 'Idea champion & co-builder',
    contribution:
      'Championed the idea behind DarkWorld and helped build it alongside ChrisB. His dedication, ideas and hands-on contributions have been central to bringing the platform to life.',
    linkedin: 'https://www.linkedin.com/in/benedictadjei/',
  },
];
