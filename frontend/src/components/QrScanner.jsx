import { useEffect, useId, useRef, useState } from 'react';
export default function QrScanner({ onScan }) {
  const id = `qr-${useId().replace(/:/g, '')}`;
  const callback = useRef(onScan);
  callback.current = onScan;
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let scanner;
    let scanned = false;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      if (!active) return;
      scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: { width: 220, height: 220 }, rememberLastUsedCamera: false }, false);
      scanner.render(text => {
        if (!active || scanned) return;
        scanned = true;
        callback.current(text);
      }, () => {});
    }).catch(() => { if (active) setError('Scanner could not load. Use a team ID or retry.'); });
    return () => { active = false; scanner?.clear().catch(() => {}); };
  }, [id]);
  return <div className="qr-scanner"><p>Scan with your camera or choose a QR image. Camera access requires HTTPS or localhost.</p>{error && <p role="alert">{error}</p>}<div id={id} /></div>;
}
