import { useState } from 'react';
import Navbar from './Navbar';
export default function PageShell({ children }) {
  const [open, setOpen] = useState(false);
  return <div className="page"><div className="background-art" /><Navbar open={open} setOpen={setOpen} /><main className="portal-content">{children}</main></div>;
}
