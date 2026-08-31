import { useState } from 'react';
import SectionCard from './SectionCard';

export interface LocationItem {
  id: string;
  name: string;
  type: 'Country' | 'State' | 'City' | 'Service Area';
  parent?: string;
  active: boolean;
}

interface LocationModalProps {
  item: Partial<LocationItem> | null;
  onSave: (item: LocationItem) => void;
  onClose: () => void;
}

function LocationModal({ item, onSave, onClose }: LocationModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<LocationItem['type']>(item?.type || 'City');
  const [parent, setParent] = useState(item?.parent || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: item?.id || `loc-${Date.now()}`,
      name: name.trim(),
      type,
      parent: parent.trim() || undefined,
      active: item?.active ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={item?.id ? 'Edit Location' : 'Add Location'}>
      <div className="bg-white rounded-3xl border border-light-border shadow-apple-lg p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-stone-900 font-serif">{item?.id ? 'Edit Location' : 'Add Location'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-lg font-bold cursor-pointer focus:outline-none" aria-label="Close">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="loc-name" className="block text-xs font-bold text-stone-700 mb-1.5">Location Name <span className="text-red-500">*</span></label>
            <input
              id="loc-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="dbc-input text-xs"
              placeholder="e.g. Hyderabad"
              autoFocus
              maxLength={80}
            />
          </div>
          <div>
            <label htmlFor="loc-type" className="block text-xs font-bold text-stone-700 mb-1.5">Type</label>
            <select
              id="loc-type"
              value={type}
              onChange={e => setType(e.target.value as LocationItem['type'])}
              className="dbc-input bg-white text-xs cursor-pointer"
            >
              <option value="Country">Country</option>
              <option value="State">State</option>
              <option value="City">City</option>
              <option value="Service Area">Service Area</option>
            </select>
          </div>
          {(type === 'State' || type === 'City' || type === 'Service Area') && (
            <div>
              <label htmlFor="loc-parent" className="block text-xs font-bold text-stone-700 mb-1.5">Parent Region</label>
              <input
                id="loc-parent"
                type="text"
                value={parent}
                onChange={e => setParent(e.target.value)}
                className="dbc-input text-xs"
                placeholder="e.g. Telangana, India"
              />
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 dbc-btn dbc-btn-sm dbc-btn-primary">
            {item?.id ? 'Save Changes' : 'Add Location'}
          </button>
        </div>
      </div>
    </div>
  );
}

const LOC_TYPE_COLORS: Record<LocationItem['type'], string> = {
  Country: 'bg-blue-50 text-blue-700 border-blue-200',
  State: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  City: 'bg-amber-50 text-amber-700 border-amber-200',
  'Service Area': 'bg-stone-100 text-stone-600 border-stone-200',
};

interface LocationsManagerProps {
  locations: LocationItem[];
  onChange: (locs: LocationItem[]) => void;
}

export default function LocationsManager({ locations, onChange }: LocationsManagerProps) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Partial<LocationItem> | null | false>(false);

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.parent || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (item: LocationItem) => {
    const idx = locations.findIndex(l => l.id === item.id);
    const next = idx >= 0
      ? locations.map(l => l.id === item.id ? item : l)
      : [...locations, item];
    onChange(next);
    setModal(false);
  };

  const handleToggle = (id: string) => {
    onChange(locations.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  return (
    <>
      <SectionCard title="Locations Management" subtitle="Manage supported countries, states, cities, and service areas." icon="📍">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 text-xs pointer-events-none">🔍</span>
              <input
                type="search"
                placeholder="Search locations…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="dbc-input pl-8 text-xs"
                aria-label="Search locations"
              />
            </div>
            <button
              onClick={() => setModal({})}
              className="dbc-btn dbc-btn-sm dbc-btn-primary shrink-0"
              aria-label="Add new location"
            >
              + Add Location
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <span className="text-2xl block">📍</span>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {search ? 'No locations match your search.' : 'No locations configured.'}
              </p>
              {!search && (
                <button onClick={() => setModal({})} className="text-[10px] text-brand-emerald font-bold hover:underline cursor-pointer focus:outline-none">
                  Add your first location →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-light-border">
              <table className="w-full text-left text-xs" aria-label="Locations table">
                <thead>
                  <tr className="bg-stone-50 border-b border-light-border">
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500">Location</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500">Type</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500 hidden sm:table-cell">Parent</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500">Status</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border">
                  {filtered.map(loc => (
                    <tr key={loc.id} className={`hover:bg-stone-50 transition-colors ${!loc.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-stone-800">{loc.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${LOC_TYPE_COLORS[loc.type]}`}>{loc.type}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 font-medium hidden sm:table-cell">{loc.parent || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${loc.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                          {loc.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setModal(loc)} className="text-[9px] font-bold text-stone-600 hover:text-brand-emerald transition cursor-pointer focus:outline-none" aria-label={`Edit ${loc.name}`}>Edit</button>
                          <button onClick={() => handleToggle(loc.id)} className={`text-[9px] font-bold transition cursor-pointer focus:outline-none ${loc.active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`} aria-label={`${loc.active ? 'Deactivate' : 'Activate'} ${loc.name}`}>
                            {loc.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[9px] text-stone-400 font-medium">
            {locations.filter(l => l.active).length} active · {locations.filter(l => !l.active).length} inactive · {locations.length} total
          </p>
        </div>
      </SectionCard>

      {modal !== false && (
        <LocationModal item={modal} onSave={handleSave} onClose={() => setModal(false)} />
      )}
    </>
  );
}
