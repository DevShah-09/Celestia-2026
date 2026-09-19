export default function DataStatus({ loading, error, refresh }) {
  return <>{loading && <p role="status">Loading...</p>}{error && <p role="alert" className="portal-error">{error} <button onClick={refresh}>Retry</button></p>}</>;
}
