import { useEffect, useState } from 'react';
import { useAdmin } from '../components/AdminLayout';

export function useAdminData(path) {
  const { request } = useAdmin();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setData(null);
    if (!path) { setLoading(false); return; }
    request(path).then(result => { if (active) setData(result); })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, request, version]);
  return { data, loading, error, refresh: () => setVersion(value => value + 1) };
}
