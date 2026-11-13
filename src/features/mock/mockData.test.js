import { describe, expect, it } from 'vitest';
import { calculateDashboardMetrics } from '../calculator/domain/dashboardMetrics';
import { validateLog } from '../calculator/domain/logValidation';
import { findOverlaps } from '../calculator/domain/periodValidation';
import { buildMockLogs } from './mockData';

// The mock account is built through the REAL domain, so these tests guard against the demo data
// drifting out of step with the rules (a broken demo would hide real bugs).
const TODAYS = ['2026-11-20', '2026-01-05', '2028-03-01', '2026-12-31', '2026-03-29'];

describe('buildMockLogs', () => {
  for (const today of TODAYS) {
    it(`builds a valid, non-overlapping mix for ${today}`, () => {
      const logs = buildMockLogs(today);
      expect(logs).toHaveLength(11);
      expect(new Set(logs.map((l) => l.id)).size).toBe(11);
      for (const log of logs) {
        expect(validateLog(log, { today, existingLogs: logs }).isValid).toBe(true);
        expect(log.periodEnd <= today).toBe(true);
        expect(findOverlaps(log, logs, { ignoreLogId: log.id })).toEqual([]);
      }
    });
  }

  it('has nine complete logs (one week + eight days) and two drafts', () => {
    const logs = buildMockLogs('2026-11-20');
    expect(logs.filter((l) => l.status === 'complete')).toHaveLength(9);
    expect(logs.filter((l) => l.status === 'draft')).toHaveLength(2);
    expect(logs.filter((l) => l.periodType === 'week')).toHaveLength(1);
  });

  it('only completes logs that really are complete (drafts have partial entries)', () => {
    for (const log of buildMockLogs('2026-11-20')) {
      const { isComplete } = validateLog(log, { today: '2026-11-20' });
      expect(isComplete).toBe(log.status === 'complete');
    }
  });

  it('is deterministic: the same date gives identical data', () => {
    expect(JSON.stringify(buildMockLogs('2026-11-20'))).toBe(JSON.stringify(buildMockLogs('2026-11-20')));
  });

  it('feeds the dashboard with real figures and excludes the drafts', () => {
    const m = calculateDashboardMetrics({ logs: buildMockLogs('2026-11-20'), today: '2026-11-20', householdSize: 4 });
    expect(m.latest).not.toBeNull();
    expect(m.draftLogsExcluded).toBe(2);
    expect(m.recent.coveredDays).toBeGreaterThan(7);
    expect(m.perMemberDailyLiters).toBeGreaterThan(0);
  });
});
