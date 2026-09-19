import { Search, Users } from "lucide-react";

export default function TeamSearch({ value, setValue, onSearch }) {
  const submit = (e) => {
    e.preventDefault();
    onSearch?.();
  };

  return (
    <form className="team-search" onSubmit={submit}>
      <Users className="team-search-icon" size={27} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search team..."
        aria-label="Search team"
      />
      {/* <button type="submit"><Search size={21} /> Search</button> */}
    </form>
  );
}
