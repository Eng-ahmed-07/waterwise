import { describe, expect, it } from 'vitest';
import { ar } from '@/locales/ar';
import { shouldShowWelcome } from './WelcomeModal';

function createStorage(value = null) {
  return {
    getItem: () => value,
  };
}

describe('welcome modal session gate', () => {
  it('shows when this browser session has not seen the welcome modal', () => {
    expect(shouldShowWelcome(createStorage())).toBe(true);
  });

  it('does not show again after the welcome modal was seen this session', () => {
    expect(shouldShowWelcome(createStorage('true'))).toBe(false);
  });

  it('provides the exact Arabic welcome copy', () => {
    expect(ar.welcome.title).toBe('مرحبًا بك في WaterWise!');
    expect(ar.welcome.message).toBe(
      'تم تطوير مشروع WaterWise باستخدام تقنيات تطوير الويب الحديثة، بهدف توفير وسيلة ذكية لتقدير ومتابعة استهلاك المياه المنزلي، وتحليل أنماط الاستخدام، والمساعدة في نشر الوعي بأهمية ترشيد استهلاك المياه.',
    );
    expect(ar.welcome.continuation).toBe('والآن، سنبدأ تجربة المشروع لاستعراض أهم الوظائف والإمكانيات التي يقدمها.');
    expect(ar.welcome.start).toBe('ابدأ التجربة');
    expect(ar.welcome.close).toBe('إغلاق');
  });
});
