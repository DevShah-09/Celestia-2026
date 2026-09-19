export default function FloatingEnvironment() {
  return (
    <div className="fx-layer" aria-hidden="true">
      <span className="float-rock rock-a" />
      <span className="float-rock rock-b" />
      <span className="float-rock rock-c" />
      <span className="crystal crystal-a" />
      <span className="crystal crystal-b" />
      <span className="spark spark-a">✦</span>
      <span className="spark spark-b">✦</span>
      <span className="spark spark-c">•</span>

      <div className="stone-snake">
        <span /><span /><span /><span /><span /><span /><span /><span />
      </div>
    </div>
  );
}