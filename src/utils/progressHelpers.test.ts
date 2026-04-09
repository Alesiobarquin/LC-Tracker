import { describe, it, expect } from 'vitest';
import { allProblems, isProblemPremium, problemMatchesTargetCurriculum } from '../data/problems';
import {
  getSprintPoolProblems,
  migrateLegacyRatingHistoryIfNeeded,
  pickUnsolvedForRandomRecommendation,
  deriveMomentumState,
} from './progressHelpers';
import type { AppSettings, ProblemProgress } from '../types';
import { DEFAULT_SETTINGS } from '../types';

describe('problemMatchesTargetCurriculum', () => {
  it('NEET_75 matches only NeetCode 75 flags', () => {
    const in75 = allProblems.find((p) => p.isNeetCode75);
    const only150 = allProblems.find((p) => !p.isNeetCode75 && p.isNeetCode150);
    expect(in75 && problemMatchesTargetCurriculum(in75, 'NEET_75')).toBe(true);
    expect(only150 && problemMatchesTargetCurriculum(only150, 'NEET_75')).toBe(false);
  });
});

describe('migrateLegacyRatingHistoryIfNeeded', () => {
  it('does nothing when any 4 or 5 exists', () => {
    const progress: Record<string, ProblemProgress> = {
      a: {
        firstSolvedAt: '2026-01-01',
        lastReviewedAt: '2026-01-01',
        nextReviewAt: '2026-01-01',
        reviewCount: 1,
        retired: false,
        consecutiveThrees: 0,
        history: [{ date: '2026-01-01', rating: 4 }],
      },
      b: {
        firstSolvedAt: '2026-01-01',
        lastReviewedAt: '2026-01-01',
        nextReviewAt: '2026-01-01',
        reviewCount: 1,
        retired: false,
        consecutiveThrees: 0,
        history: [{ date: '2026-01-01', rating: 3 }],
      },
    };
    const { map, changed } = migrateLegacyRatingHistoryIfNeeded(progress);
    expect(changed).toBe(false);
    expect(map.b.history[0].rating).toBe(3);
  });

  it('maps 3 to 4 when no 4/5 anywhere', () => {
    const progress: Record<string, ProblemProgress> = {
      a: {
        firstSolvedAt: '2026-01-01',
        lastReviewedAt: '2026-01-01',
        nextReviewAt: '2026-01-01',
        reviewCount: 1,
        retired: false,
        consecutiveThrees: 0,
        history: [{ date: '2026-01-01', rating: 3 }],
      },
    };
    const { map, changed } = migrateLegacyRatingHistoryIfNeeded(progress);
    expect(changed).toBe(true);
    expect(map.a.history[0].rating).toBe(4);
  });
});

describe('getSprintPoolProblems', () => {
  const emptySolved = new Set<string>();
  const emptyReserved = new Set<string>();
  const cat = 'Arrays & Hashing';

  it('default order prefers NeetCode 75 tier', () => {
    const pool = getSprintPoolProblems(cat, emptySolved, emptyReserved);
    expect(pool.length).toBeGreaterThan(0);
    expect(pool[0].isNeetCode75).toBe(true);
  });

  it('align NEET_150 can start with 150-only when present', () => {
    const pool = getSprintPoolProblems(cat, emptySolved, emptyReserved, {
      alignPoolToTargetCurriculum: true,
      targetCurriculum: 'NEET_150',
    });
    expect(pool.length).toBeGreaterThan(0);
    const first = pool[0];
    expect(first.isNeetCode150 && !first.isNeetCode75).toBe(true);
  });

  it('excludes premium by default and includes when setting allows it', () => {
    const category = [...new Set(allProblems.map((p) => p.category))].find((candidateCategory) => {
      const inCategory = allProblems.filter((p) => p.category === candidateCategory);
      return inCategory.some((p) => isProblemPremium(p)) && inCategory.some((p) => !isProblemPremium(p));
    });

    expect(category).toBeTruthy();
    if (!category) return;

    const inCategory = allProblems.filter((p) => p.category === category);
    const solvedNonPremium = new Set(inCategory.filter((p) => !isProblemPremium(p)).map((p) => p.id));

    const defaultPool = getSprintPoolProblems(category, solvedNonPremium, emptyReserved);
    expect(defaultPool.length).toBe(0);

    const premiumEnabledPool = getSprintPoolProblems(category, solvedNonPremium, emptyReserved, {
      includePremiumInAssignments: true,
    });
    expect(premiumEnabledPool.length).toBeGreaterThan(0);
    expect(premiumEnabledPool.every((p) => isProblemPremium(p))).toBe(true);
  });
});

describe('pickUnsolvedForRandomRecommendation', () => {
  const baseSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    interviewType: 'FULL_TIME',
    targetCompanyTier: 'MIXED',
    targetCurriculum: 'NEET_75',
  };

  it('returns undefined when no candidates', () => {
    const p = pickUnsolvedForRandomRecommendation([], new Set(), baseSettings, {});
    expect(p).toBeUndefined();
  });

  it('returns the only unsolved candidate', () => {
    const candidates = allProblems.filter((x) => x.category === 'Arrays & Hashing').slice(0, 3);
    const solved = new Set(candidates.slice(0, 2).map((c) => c.id));
    const picked = pickUnsolvedForRandomRecommendation(candidates, solved, baseSettings, {});
    expect(picked?.id).toBe(candidates[2].id);
  });

  it('skips premium-only candidates when premium assignment is disabled', () => {
    const premiumCandidate = allProblems.find((p) => isProblemPremium(p));
    expect(premiumCandidate).toBeTruthy();
    if (!premiumCandidate) return;

    const picked = pickUnsolvedForRandomRecommendation(
      [premiumCandidate],
      new Set(),
      { ...baseSettings, includePremiumInAssignments: false },
      {}
    );
    expect(picked).toBeUndefined();
  });

  it('allows premium-only candidates when premium assignment is enabled', () => {
    const premiumCandidate = allProblems.find((p) => isProblemPremium(p));
    expect(premiumCandidate).toBeTruthy();
    if (!premiumCandidate) return;

    const picked = pickUnsolvedForRandomRecommendation(
      [premiumCandidate],
      new Set(),
      { ...baseSettings, includePremiumInAssignments: true },
      {}
    );
    expect(picked?.id).toBe(premiumCandidate.id);
  });
});


describe('deriveMomentumState', () => {
  const createBaseProgress = (): ProblemProgress => ({
    firstSolvedAt: '2023-01-01',
    lastReviewedAt: '2023-01-01',
    nextReviewAt: '2023-01-02',
    reviewCount: 0,
    retired: false,
    consecutiveThrees: 0,
    history: []
  });

  it('returns zeros/false and null for empty progress', () => {
    const result = deriveMomentumState({});
    expect(result.consecutiveLowConfByCategory).toEqual({});
    expect(result.categoryStruggling).toEqual({});
    expect(result.consecutiveLowConfTotal).toBe(0);
    expect(result.proactiveNeetCodeProblemId).toBeNull();
  });

  it('returns zeros/false and null when there is no low confidence (rating 3+)', () => {
    const progress: Record<string, ProblemProgress> = {
      'valid-anagram': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-01T10:00:00Z', rating: 3, sessionType: 'new' }]
      },
      'valid-palindrome': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-02T10:00:00Z', rating: 4, sessionType: 'new' }]
      }
    };
    const result = deriveMomentumState(progress);
    expect(result.consecutiveLowConfTotal).toBe(0);
    expect(result.proactiveNeetCodeProblemId).toBeNull();
    expect(result.categoryStruggling['Arrays & Hashing']).toBeFalsy();
    expect(result.categoryStruggling['Two Pointers']).toBeFalsy();
  });

  it('sets consecutiveLowConfTotal=2 and sets proactiveNeetCodeProblemId on two consecutive 1s', () => {
    const progress: Record<string, ProblemProgress> = {
      'valid-anagram': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-01T10:00:00Z', rating: 1, sessionType: 'new' }]
      },
      'valid-palindrome': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-02T10:00:00Z', rating: 1, sessionType: 'new' }]
      }
    };
    const result = deriveMomentumState(progress);
    expect(result.consecutiveLowConfTotal).toBe(2);
    expect(result.proactiveNeetCodeProblemId).toBe('valid-palindrome');
  });

  it('sets categoryStruggling to true for two consecutive 1s on Mediums in same category', () => {
    const progress: Record<string, ProblemProgress> = {
      'group-anagrams': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-01T10:00:00Z', rating: 1, sessionType: 'new' }]
      },
      'top-k-frequent-elements': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-02T10:00:00Z', rating: 1, sessionType: 'new' }]
      }
    };
    const result = deriveMomentumState(progress);
    expect(result.consecutiveLowConfByCategory['Arrays & Hashing']).toBe(2);
    expect(result.categoryStruggling['Arrays & Hashing']).toBe(true);
  });

  it('clears categoryStruggling on a 3+ rating for an Easy problem in the struggling category', () => {
    const progress: Record<string, ProblemProgress> = {
      'group-anagrams': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-01T10:00:00Z', rating: 1, sessionType: 'new' }]
      },
      'top-k-frequent-elements': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-02T10:00:00Z', rating: 1, sessionType: 'new' }]
      },
      'contains-duplicate': {
        ...createBaseProgress(),
        history: [{ date: '2023-01-03T10:00:00Z', rating: 3, sessionType: 'new' }]
      }
    };
    const result = deriveMomentumState(progress);
    expect(result.categoryStruggling['Arrays & Hashing']).toBe(false);
    expect(result.consecutiveLowConfByCategory['Arrays & Hashing']).toBe(0);
  });

  it('ignores non-new events entirely', () => {
    const progress: Record<string, ProblemProgress> = {
      'group-anagrams': {
        ...createBaseProgress(),
        history: [
          // Index 0 is treated as 'new' if sessionType is undefined, so we give it a 3
          { date: '2023-01-01T10:00:00Z', rating: 3, sessionType: 'new' },
          // Index 1 with sessionType='review' is a non-new event, should be ignored
          { date: '2023-01-02T10:00:00Z', rating: 1, sessionType: 'review' }
        ]
      },
      'top-k-frequent-elements': {
        ...createBaseProgress(),
        history: [
          { date: '2023-01-03T10:00:00Z', rating: 3, sessionType: 'new' },
          { date: '2023-01-04T10:00:00Z', rating: 1, sessionType: 'review' }
        ]
      }
    };
    const result = deriveMomentumState(progress);
    // Even though there are two '1' ratings, they are non-new, so they shouldn't count.
    expect(result.consecutiveLowConfTotal).toBe(0);
    expect(result.categoryStruggling['Arrays & Hashing']).toBeFalsy();
    expect(result.proactiveNeetCodeProblemId).toBeNull();
  });
});
