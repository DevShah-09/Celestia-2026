import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
export function useLiveData(path) {
  const [state, setState] = useState({ data: null, loading: true, error: '', updated: null });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true;
    let timer;
    let controller;
    async function load() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const data = await api(path, { signal: controller.signal });
        if (active) setState({ data, loading: false, error: '', updated: new Date() });
      } catch (error) {
        if (active) setState(previous => ({ ...previous, loading: false, error: error.name === 'AbortError' ? 'Request timed out. Please retry.' : error.message }));
      } finally {
        clearTimeout(timeout);
        if (active) timer = setTimeout(load, 10000);
      }
    }
    load();
    return () => { active = false; clearTimeout(timer); controller?.abort(); };
  }, [path, revision]);
  return { ...state, refresh };
}
