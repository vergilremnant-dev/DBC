interface ProfileHeaderProps {
  avatarUrl?: string;
  fullName: string;
  memberSince: string;
  customerId: string;
  status: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onAvatarChange?: () => void;
}

export function ProfileHeader({
  avatarUrl,
  fullName,
  memberSince,
  customerId,
  status,
  isEditing,
  onToggleEdit,
  onAvatarChange,
}: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
      {/* Ambient decorative light background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        {/* Avatar Area */}
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-emerald-700 text-white font-black text-xl flex items-center justify-center border-2 border-white shadow select-none uppercase">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              getInitials(fullName)
            )}
          </div>
          <button
            type="button"
            onClick={onAvatarChange}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-2xs font-bold uppercase opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
          >
            Edit 📷
          </button>
        </div>

        {/* Member metadata */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-black text-stone-900 font-display leading-none">
              {fullName}
            </h2>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-full px-2.5 py-0.5 text-3xs font-black uppercase tracking-wider">
              {status}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-stone-400 font-bold">
            <span>Customer ID: <strong className="text-stone-700 font-mono">{customerId}</strong></span>
            <span className="hidden sm:inline text-stone-250">•</span>
            <span>Member Since: <strong className="text-stone-700">{memberSince}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Edit button */}
      <div>
        <button
          onClick={onToggleEdit}
          className={`rounded-xl border font-bold text-xs uppercase tracking-wider px-5 py-2.5 transition duration-200 cursor-pointer shadow-sm ${
            isEditing
              ? 'bg-stone-900 hover:bg-stone-850 text-white border-stone-900'
              : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
          }`}
        >
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>
    </div>
  );
}
