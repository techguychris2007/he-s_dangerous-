// Checks the plan data: every listed lab and module exists, no lab is on two lists, the foundations
// stay free, and the price list is internally consistent.
require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { LABS } = require('../src/data/labs.ts');
const { MODULES, ROADMAP } = require('../src/data/curriculum.ts');
const { MAX_LABS, PRO_LABS, FREE_MODULES, MAX_MODULES, labPlan, lessonPlan } = require('../src/data/planTiers.ts');
const { GHS_PER_USD, MONTHLY_AMOUNT, MONTHLY_USD, PASS_OFFERS, PLAN_RANK, PRO_TO_MAX_DAY_RATIO, findPass } = require('../supabase/functions/_shared/billingPlans.ts');

const slugs = new Set(LABS.map(lab => lab.slug));
for (const slug of [...MAX_LABS, ...PRO_LABS]) assert.ok(slugs.has(slug), `planTiers lists unknown lab ${slug}`);
for (const slug of MAX_LABS) assert.ok(!PRO_LABS.has(slug), `${slug} is on both the Pro and Max lists`);

const moduleSlugs = new Set(MODULES.map(module => module.slug));
for (const slug of [...FREE_MODULES, ...MAX_MODULES]) assert.ok(moduleSlugs.has(slug), `planTiers lists unknown module ${slug}`);
for (const slug of FREE_MODULES) assert.ok(!MAX_MODULES.has(slug), `${slug} is both free and Max`);

// Every pre-security module and lab is free: nobody pays to get started.
for (const stage of ROADMAP.filter(stage => stage.track === 'presecurity' && stage.moduleSlug)) assert.ok(FREE_MODULES.has(stage.moduleSlug), `pre-security module ${stage.moduleSlug} must be free`);
for (const lab of LABS.filter(lab => lab.scenario.difficulty === 'Easy' && !lab.slug.includes('capstone'))) {
  if (labPlan(lab.slug) === 'pro') assert.fail(`Easy lab ${lab.slug} is Pro; Easy labs are free or Max flagships only`);
}

// The first lesson of every module is a free preview.
for (const module of MODULES) assert.equal(lessonPlan(module.slug, 0), 'free', `${module.slug} first lesson must be free`);

const counts = { free: 0, pro: 0, max: 0 };
for (const lab of LABS) counts[labPlan(lab.slug)]++;
assert.ok(counts.free >= 100, `only ${counts.free} free labs`);

// Prices: Max costs more than Pro (the upgrade credit in 0013_billing.sql converts by their ratio), a
// 1-month pass costs the same as one month of subscription, longer passes never cost more per month,
// and every cedi amount is its dollar list price at GHS_PER_USD rounded to a whole cedi.
assert.ok(MONTHLY_AMOUNT.max > MONTHLY_AMOUNT.pro, 'Max must cost more than Pro');
assert.ok(PRO_TO_MAX_DAY_RATIO > 0 && PRO_TO_MAX_DAY_RATIO < 1);
assert.ok(PLAN_RANK.max > PLAN_RANK.pro && PLAN_RANK.pro > PLAN_RANK.free);
const wholeCedis = usd => Math.round(usd * GHS_PER_USD) * 100;
for (const offer of PASS_OFFERS) assert.equal(offer.amount, wholeCedis(offer.usd), `${offer.id}: GH₵${offer.amount / 100} should be US$${offer.usd} at ${GHS_PER_USD}`);
for (const plan of ['pro', 'max']) {
  assert.equal(MONTHLY_AMOUNT[plan], wholeCedis(MONTHLY_USD[plan]), `${plan} monthly cedi price must match its dollar price`);
  const passes = PASS_OFFERS.filter(offer => offer.plan === plan).sort((a, b) => a.days - b.days);
  assert.equal(passes[0].days, 30);
  assert.equal(passes[0].amount, MONTHLY_AMOUNT[plan], `${plan} 1-month pass must match the monthly price`);
  assert.equal(passes[0].usd, MONTHLY_USD[plan], `${plan} 1-month pass must match the monthly dollar price`);
  for (let index = 1; index < passes.length; index++) {
    assert.ok(passes[index].amount / passes[index].days <= passes[index - 1].amount / passes[index - 1].days, `${passes[index].id} costs more per day than a shorter pass`);
  }
}
assert.equal(new Set(PASS_OFFERS.map(offer => offer.id)).size, PASS_OFFERS.length, 'duplicate pass ids');
assert.equal(findPass('pro-monthly'), undefined, 'monthly offers are subscriptions, not passes');

console.log(`Billing data OK — labs: ${counts.free} free, ${counts.pro} Pro, ${counts.max} Max; modules: ${FREE_MODULES.size} free, ${MAX_MODULES.size} Max, ${MODULES.length - FREE_MODULES.size - MAX_MODULES.size} Pro.`);
