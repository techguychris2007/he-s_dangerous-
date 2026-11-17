export interface Contributor {
  name: string;
  role: string;
  contribution: string;
  linkedin?: string;
  photo?: string;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Benedict Adjei',
    role: 'Founder & CEO',
    contribution:
      'Benedict founded DarkWorld and leads its vision, strategy and growth. A computer science student and SOC analyst focused on threat detection, incident response and SIEM operations, he brings a defender’s perspective to every room and lab — ensuring learners build the practical, job-ready skills real security teams depend on.',
    linkedin: 'https://www.linkedin.com/in/benedictadjei/',
    photo: '/team/benedict-adjei.jpg',
  },
  {
    name: 'Bondam Christopher Kweku',
    role: 'Co-Founder',
    contribution:
      'Christopher co-founded DarkWorld and leads the engineering behind the platform. A software engineer, he designs and builds the academy’s learning experience, hands-on labs and infrastructure — turning a shared vision for accessible, practical cybersecurity education into a reliable product learners can trust.',
    linkedin: 'https://www.linkedin.com/in/christopher-bondam-53bb973b8/',
    photo: '/team/christopher-bondam.jpg',
  },
];
