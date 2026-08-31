interface UserSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export default function UserSearch({ value, onChange }: UserSearchProps) {
  return (
    <div className="relative text-left">
      <span className="absolute left-3 top-2.5 text-stone-400 text-sm" role="img" aria-label="Search icon">
        🔍
      </span>
      <input
        type="text"
        placeholder="Search users by name, email, phone, ID, or company..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dbc-input pl-9 text-xs"
        aria-label="Search user accounts"
      />
    </div>
  );
}
