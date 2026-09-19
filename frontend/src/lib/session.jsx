import { createContext, useContext, useState } from 'react';
const SessionContext = createContext(null);
function read(key) {
  try { return JSON.parse(sessionStorage.getItem(key)) || null; } catch { return null; }
}
export function SessionProvider({ children }) {
  const [team, setTeam] = useState(() => read('celestia.team'));
  const [admin, setAdmin] = useState(() => read('celestia.admin'));
  function save(key, value, setter) {
    try {
      if (value) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
    } catch { /* Allow in-memory sessions if storage is unavailable. */ }
    setter(value);
  }
  return <SessionContext.Provider value={{ team, admin,
    saveTeam: value => save('celestia.team', value, setTeam),
    saveAdmin: value => save('celestia.admin', value, setAdmin),
  }}>{children}</SessionContext.Provider>;
}
export const useSession = () => useContext(SessionContext);
