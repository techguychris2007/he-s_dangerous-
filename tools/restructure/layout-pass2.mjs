// Second pass: keeps the dependency direction app → features → shared by moving the few modules
// that shared code needed out of features (the cast, icons, logo, iso blocks) into shared, and the
// lab "room" pieces that only labs-style pages use into features/labs.
const C = 'src/features/progress/components/characters/';
export const RULES = [
  ['src/app/layout/icons.tsx', 'src/shared/components/layout/icons.tsx'],
  ['src/app/layout/Logo.tsx', 'src/shared/components/layout/Logo.tsx'],
  ['src/app/layout/PortalHero.tsx', 'src/shared/components/layout/PortalHero.tsx'],
  ['src/app/layout/portal-hero.css', 'src/shared/components/layout/portal-hero.css'],
  ['src/features/labs/components/IsoBlock.tsx', 'src/shared/components/IsoBlock.tsx'],
  ['src/features/labs/components/iso-block.css', 'src/shared/components/iso-block.css'],
  ['src/features/progress/data/characters.ts', 'src/shared/characters/characters.ts'],
  ['src/features/account/data/handles.ts', 'src/shared/characters/handles.ts'],
  [C + 'HandleWelcome.tsx', 'src/features/account/components/HandleWelcome.tsx'],
  [C, 'src/shared/characters/'],
  ...['RoomHero.tsx', 'RoomAside.tsx', 'room-hero.css', 'MissionPlan.tsx', 'TaskList.tsx']
    .map(name => [`src/shared/components/${name}`, `src/features/labs/components/room/${name}`]),
  ['src/shared/lib/pdfGenerator.ts', 'src/features/labs/lib/pdfGenerator.ts'],
  ['src/', 'src/'],
];
export const TOOLING = { testPattern: /^$/, testDir: 'tests', sqlChecks: {}, keepInScripts: [] };
