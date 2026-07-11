export interface HackerLegend {
  name: string;
  blurb: string;
}

/** Real, publicly celebrated figures in hacker/security history — used only for upbeat, factual "you're
 *  moving like..." flavor text when a learner is working through labs fast. Framed on their legitimate,
 *  documented legacy, never on wrongdoing. */
export const HACKER_LEGENDS: HackerLegend[] = [
  { name: 'Ada Lovelace', blurb: 'wrote the world\'s first published algorithm a century before a computer existed to run it' },
  { name: 'Alan Turing', blurb: 'broke the Enigma cipher at Bletchley Park and helped shorten a world war by years' },
  { name: 'Kevin Mitnick', blurb: 'went from the FBI\'s most-wanted hacker to one of the industry\'s most in-demand security consultants' },
  { name: 'Jeff Moss ("The Dark Tangent")', blurb: 'founded DEF CON and Black Hat, the two conferences that built modern hacker culture' },
  { name: 'Katie Moussouris', blurb: 'designed the bug bounty program model Microsoft, the Pentagon, and hundreds of companies now run on' },
  { name: 'HD Moore', blurb: 'created the Metasploit Framework — the exact exploitation tool you\'ve been using in these labs' },
  { name: 'Parisa Tabriz ("Google\'s Security Princess")', blurb: 'led the team that hardened Chrome into one of the most attacked, most resilient browsers on earth' },
  { name: 'Peiter "Mudge" Zatko', blurb: 'co-founded the legendary L0pht hacker collective, then went on to advise the White House on cybersecurity policy' },
];

export function pickHackerLegend(seed: number): HackerLegend {
  const idx = ((seed % HACKER_LEGENDS.length) + HACKER_LEGENDS.length) % HACKER_LEGENDS.length;
  return HACKER_LEGENDS[idx];
}
