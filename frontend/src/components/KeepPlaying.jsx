import { Gamepad2 } from "lucide-react";

export default function KeepPlaying() {
  return (
    <button className="keep-playing">
      <Gamepad2 size={31} />
      <span><b>KEEP PLAYING</b><small>KEEP CLIMBING</small></span>
      <strong>▶</strong>
    </button>
  );
}