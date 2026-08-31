interface SettingsHeaderProps {
  onSave: () => void;
  onReset: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
}

export default function SettingsHeader({ onSave, onReset, isSaving, hasUnsavedChanges }: SettingsHeaderProps) {
  return (
    <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative select-none text-left">
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
          Administrator Configuration
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-serif leading-tight">
          Platform Settings
        </h1>
        <p className="text-xs text-stone-500 font-medium">
          Configure the DBC platform and marketplace.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold">
        {hasUnsavedChanges && (
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            Unsaved Changes
          </span>
        )}
        <button
          onClick={onReset}
          disabled={isSaving}
          className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          aria-label="Reset settings to last saved state"
        >
          ↺ Reset Changes
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="dbc-btn dbc-btn-md dbc-btn-primary"
          aria-label="Save all platform settings"
        >
          {isSaving ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Saving…
            </>
          ) : (
            <>💾 Save Changes</>
          )}
        </button>
      </div>
    </header>
  );
}
