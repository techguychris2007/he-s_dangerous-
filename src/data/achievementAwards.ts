export type AwardFinish = 'bronze' | 'silver' | 'gold' | 'platinum';
export interface AwardDesign { finish: AwardFinish; form: 'medal' | 'crest' | 'star' | 'trophy'; inscription: string; label: string }

/** Platform awards only. These designs do not change achievement requirements or imply accreditation. */
export const ACHIEVEMENT_AWARDS: Record<string, AwardDesign> = {
  'first-blood': { finish: 'bronze', form: 'medal', inscription: '01', label: 'First capture medal' },
  'first-lesson': { finish: 'bronze', form: 'crest', inscription: 'I', label: 'Foundation crest' },
  'ten-labs': { finish: 'silver', form: 'medal', inscription: '10', label: 'Practitioner medal' },
  'fifty-labs': { finish: 'gold', form: 'trophy', inscription: '50', label: 'Half-century trophy' },
  'hundred-labs': { finish: 'gold', form: 'crest', inscription: '100', label: 'Centurion crest' },
  coder: { finish: 'silver', form: 'crest', inscription: '10', label: 'Developer crest' },
  'master-coder': { finish: 'gold', form: 'star', inscription: '50', label: 'Master developer star' },
  'perfect-score': { finish: 'gold', form: 'medal', inscription: '100', label: 'Precision medal' },
  'quiz-master': { finish: 'silver', form: 'star', inscription: '10', label: 'Knowledge star' },
  bookworm: { finish: 'bronze', form: 'medal', inscription: 'V', label: 'Scholar medal' },
  'on-fire': { finish: 'bronze', form: 'crest', inscription: 'III', label: 'Consistency crest' },
  unstoppable: { finish: 'silver', form: 'medal', inscription: 'VII', label: 'Resolve medal' },
  legendary: { finish: 'gold', form: 'star', inscription: '30', label: 'Legendary star' },
  'jack-of-all-trades': { finish: 'gold', form: 'crest', inscription: 'ALL', label: 'Versatility crest' },
  'category-master': { finish: 'gold', form: 'medal', inscription: 'M', label: 'Mastery medal' },
  completionist: { finish: 'platinum', form: 'trophy', inscription: 'ALL', label: 'Academy distinction' },
};
export function achievementAward(id?: string): AwardDesign {
  return id && ACHIEVEMENT_AWARDS[id] || { finish: 'bronze', form: 'medal', inscription: 'DW', label: 'Academy medal' };
}
