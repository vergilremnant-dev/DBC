interface VerificationSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export default function VerificationSearch({ value, onChange }: VerificationSearchProps) {
  return (
    <div className="relative text-left select-none">
      <span className="absolute left-3 top-2.5 text-stone-400 text-sm" role="img" aria-label="Search icon">
        🔍
      </span>
      <input
        type="text"
        placeholder="Search verification requests by applicant name, business name, verification ID, email, or registration number..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dbc-input pl-9 text-xs"
        aria-label="Search verification center backlog"
      />
    </div>
  );
}
