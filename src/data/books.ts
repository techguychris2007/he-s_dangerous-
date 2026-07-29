export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  language: 'python' | 'cpp' | 'java' | 'javascript';
  /** served from public/books/ — the exact, unmodified official PDF, cached locally so reading
   *  and downloading never require leaving the portal */
  filename: string;
  fileSizeMb: string;
  license: string;
  licenseUrl: string;
  /** the book's own official site — credited for attribution, not required for reading */
  officialUrl: string;
  description: string;
}

/** Every PDF here is the exact, unmodified file downloaded directly from each book's official
 *  site — verified as a valid, complete PDF (correct %PDF header and %%EOF trailer, matching
 *  Content-Length) before being added. All four are released under a Creative Commons license
 *  that explicitly permits free copying and redistribution; nothing here is paraphrased,
 *  summarized, or otherwise altered from the original. */
export const BOOKS: Book[] = [
  {
    id: 'think-python',
    title: 'Think Python',
    subtitle: 'How to Think Like a Computer Scientist',
    author: 'Allen B. Downey',
    language: 'python',
    filename: 'think-python.pdf',
    fileSizeMb: '0.9',
    license: 'CC BY-NC-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    officialUrl: 'https://greenteapress.com/wp/think-python-2e/',
    description:
      'A widely-used introduction to Python and programming itself — variables, functions, ' +
      'recursion, and data structures, building toward real programs rather than just syntax.',
  },
  {
    id: 'think-cpp',
    title: 'Think C++',
    subtitle: 'How to Think Like a Computer Scientist',
    author: 'Allen B. Downey',
    language: 'cpp',
    filename: 'think-cpp.pdf',
    fileSizeMb: '0.8',
    license: 'CC BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    officialUrl: 'https://greenteapress.com/wp/think-c/',
    description:
      'The C++ companion to Think Python — the same clear, problem-first teaching style applied ' +
      'to C++ fundamentals: types, pointers, classes, and vectors.',
  },
  {
    id: 'think-java',
    title: 'Think Java',
    subtitle: 'How to Think Like a Computer Scientist',
    author: 'Allen B. Downey &amp; Chris Mayfield',
    language: 'java',
    filename: 'think-java.pdf',
    fileSizeMb: '2.0',
    license: 'CC BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    officialUrl: 'https://greenteapress.com/wp/think-java-2e/',
    description:
      'A full introduction to Java and object-oriented programming, used in college courses ' +
      'worldwide — one chapter per week, from Hello World through classes and objects.',
  },
  {
    id: 'eloquent-javascript',
    title: 'Eloquent JavaScript',
    subtitle: '4th Edition',
    author: 'Marijn Haverbeke',
    language: 'javascript',
    filename: 'eloquent-javascript.pdf',
    fileSizeMb: '2.0',
    license: 'CC BY-NC 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc/3.0/',
    officialUrl: 'https://eloquentjavascript.net/',
    description:
      'A modern, respected deep dive into JavaScript — from language fundamentals through the ' +
      'browser DOM, async programming, and Node.js — with a well-known project-based teaching style.',
  },
];

export function findBook(id: string): Book | undefined {
  return BOOKS.find((b) => b.id === id);
}
