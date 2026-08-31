interface ProjectSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export default function ProjectSearch({ value, onChange }: ProjectSearchProps) {
  return (
    <div className="relative text-left">
      <span className="absolute left-3 top-2.5 text-stone-400 text-sm" role="img" aria-label="Search icon">
        🔍
      </span>
      <input
        type="text"
        placeholder="Search projects by ID, name, customer, professional, requirement ID, or location..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dbc-input pl-9 text-xs"
        aria-label="Search platform projects portfolio"
      />
    </div>
  );
}
