// Checks that audit the whole curriculum need the owner-only tracks too. In the app those modules
// arrive from the private owner-content bucket (src/features/account/lib/ownerContent.ts); here they are registered from
// source, with owner visibility, so MODULES and ROADMAP hold every track exactly as an owner sees them.
require('./register-typescript.cjs');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] ??= module => { module.exports = ''; };
const { registerOwnerCurriculum } = require('../src/features/curriculum/data/curriculum.ts');
const { curriculumModule } = require('../src/features/curriculum/content/curriculumDefinition.ts');
const { SE_MODULE_SOURCES, SE_ROADMAP } = require('../src/features/curriculum/data/softwareEngineeringCurriculum.ts');
const { DN_MODULE_SOURCES, DN_ROADMAP } = require('../src/features/curriculum/data/dotnetCurriculum.ts');
const { setOwnerSession } = require('../src/features/account/lib/ownerSession.ts');

registerOwnerCurriculum([...SE_MODULE_SOURCES, ...DN_MODULE_SOURCES].map(({ meta, lessons }) => curriculumModule(meta, lessons)), [...SE_ROADMAP, ...DN_ROADMAP]);
setOwnerSession(true);
