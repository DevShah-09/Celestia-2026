import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, setPage }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft /></button>
      {pages.map((n) => (
        <button key={n} className={page === n ? "current" : ""} onClick={() => setPage(n)}>{n}</button>
      ))}
      <button disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight /></button>
    </div>
  );
}