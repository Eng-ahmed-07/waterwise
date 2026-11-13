import { CalculatorIcon, DashboardIcon, HistoryIcon, SettingsIcon, TipsIcon } from '../ui/Icons';

// Navigation items. `labelKey` points into ar.layout.nav. Only routes from the approved sitemap.
export const PUBLIC_NAV = [
  { to: '/', labelKey: 'home', end: true },
  { to: '/calculator', labelKey: 'calculator' },
  { to: '/about-estimates', labelKey: 'aboutEstimates' },
];

// `mobile: true` items appear in the bottom tab bar (5 tabs); all appear in the desktop top bar.
export const APP_NAV = [
  { to: '/dashboard', labelKey: 'dashboard', Icon: DashboardIcon, mobile: true },
  { to: '/calculator', labelKey: 'calculator', Icon: CalculatorIcon, mobile: true },
  { to: '/history', labelKey: 'history', Icon: HistoryIcon, mobile: true },
  { to: '/recommendations', labelKey: 'recommendations', Icon: TipsIcon, mobile: true },
  { to: '/reports', labelKey: 'reports', mobile: false },
  { to: '/settings', labelKey: 'settings', Icon: SettingsIcon, mobile: true },
];
