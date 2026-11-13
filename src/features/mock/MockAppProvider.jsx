import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultAssumptions } from '@/features/calculator/domain/activityDefinitions';
import { todayISO } from '@/features/calculator/domain/dates';
import { confirmPeriodReset } from '@/features/calculator/domain/periodReset';
import { upsertLog } from '@/features/calculator/domain/logValidation';
import { ar } from '@/locales/ar';
import { buildMockLogs } from './mockData';

// TEMPORARY stand-in for authentication and the database (Phase 3 only).
// It has the shape the real app will have, so pages do not change in Phase 5:
//   isAuthenticated, user, household, logs, saveLog, deleteLog, signIn, register, signOut ...
// Any login succeeds and loads a demo account. Data lives in memory and sessionStorage only.
// Nothing here talks to a server. Phase 5 replaces this file with Supabase Auth + TanStack Query hooks.

const MockAppContext = createContext(null);
const STORAGE_KEY = 'waterwise.mock.v1';

const GUEST_STATE = () => ({ isAuthenticated: false, user: null, household: null, logs: [], assumptions: createDefaultAssumptions() });

const demoState = (today) => ({
  isAuthenticated: true,
  user: { name: ar.mock.userName, email: 'demo@example.com' },
  household: { name: ar.mock.householdName, size: 4, governorate: 'cairo' },
  logs: buildMockLogs(today),
  assumptions: createDefaultAssumptions(),
});

function readSaved(today) {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
    return saved && saved.today === today ? saved.state : null;
  } catch {
    return null; // storage unavailable or corrupt: start fresh
  }
}

export function MockAppProvider({ children, today: todayProp, authenticated = false, persist = true }) {
  const today = useMemo(() => todayProp ?? todayISO(), [todayProp]);
  const [state, setState] = useState(() => (persist && readSaved(today)) || (authenticated ? demoState(today) : GUEST_STATE()));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!persist) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ today, state }));
    } catch {
      /* storage unavailable: the mock still works for this page view */
    }
  }, [persist, today, state]);

  const signIn = useCallback(() => setState(demoState(today)), [today]);
  const register = useCallback(({ name, email }) => setState({ ...GUEST_STATE(), isAuthenticated: true, user: { name, email } }), []);
  const signOut = useCallback(() => setState(GUEST_STATE()), []);
  const saveHousehold = useCallback((household) => setState((s) => ({ ...s, household })), []);

  const saveLog = useCallback(
    (log) => {
      const result = upsertLog(stateRef.current.logs, log, { today });
      if (result.ok) setState((s) => ({ ...s, logs: result.logs }));
      return result;
    },
    [today],
  );

  const deleteLog = useCallback((confirmation) => {
    const result = confirmPeriodReset(stateRef.current.logs, confirmation);
    if (result.ok) setState((s) => ({ ...s, logs: result.logs }));
    return result;
  }, []);

  const value = useMemo(
    () => ({ ...state, today, signIn, register, signOut, saveHousehold, saveLog, deleteLog }),
    [state, today, signIn, register, signOut, saveHousehold, saveLog, deleteLog],
  );
  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>;
}

export function useMockApp() {
  const context = useContext(MockAppContext);
  if (!context) throw new Error('useMockApp must be used inside <MockAppProvider>.');
  return context;
}
