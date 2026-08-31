import { useState } from 'react';
import SectionCard from './SectionCard';

export interface CategoryItem {
  id: string;
  name: string;
  type: 'Service' | 'Project' | 'Property' | 'Construction';
  active: boolean;
}

interface CategoryModalProps {
  item: Partial<CategoryItem> | null;
  onSave: (item: CategoryItem) => void;
  onClose: () => void;
}

function CategoryModal({ item, onSave, onClose }: CategoryModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [type, setType] = useState<CategoryItem['type']>(item?.type || 'Service');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: item?.id || `cat-${Date.now()}`,
      name: name.trim(),
      type,
      active: item?.active ?? true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={item?.id ? 'Edit Category' : 'Add Category'}>
      <div className="bg-white rounded-3xl border border-light-border shadow-apple-lg p-6 w-full max-w-md space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-stone-900 font-serif">{item?.id ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 focus:outline-none text-lg font-bold cursor-pointer" aria-label="Close modal">✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="cat-name" className="block text-xs font-bold text-stone-700 mb-1.5">Category Name <span className="text-brick-red">*</span></label>
            <input
              id="cat-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="dbc-input text-xs"
              placeholder="e.g. Electrical, Plumbing"
              autoFocus
              maxLength={60}
            />
          </div>
          <div>
            <label htmlFor="cat-type" className="block text-xs font-bold text-stone-700 mb-1.5">Category Type</label>
            <select
              id="cat-type"
              value={type}
              onChange={e => setType(e.target.value as CategoryItem['type'])}
              className="dbc-input bg-white text-xs cursor-pointer"
            >
              <option value="Service">Service Category</option>
              <option value="Project">Project Category</option>
              <option value="Property">Property Type</option>
              <option value="Construction">Construction Type</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 dbc-btn dbc-btn-sm dbc-btn-primary">
            {item?.id ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPE_COLORS: Record<CategoryItem['type'], string> = {
  Service: 'bg-blue-50 text-blue-700 border-blue-200',
  Project: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Property: 'bg-amber-50 text-amber-700 border-amber-200',
  Construction: 'bg-stone-100 text-stone-600 border-stone-200',
};

interface CategoriesManagerProps {
  categories: CategoryItem[];
  onChange: (cats: CategoryItem[]) => void;
}

export default function CategoriesManager({ categories, onChange }: CategoriesManagerProps) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<Partial<CategoryItem> | null | false>(false);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (item: CategoryItem) => {
    const idx = categories.findIndex(c => c.id === item.id);
    const next = idx >= 0
      ? categories.map(c => c.id === item.id ? item : c)
      : [...categories, item];
    onChange(next);
    setModal(false);
  };

  const handleToggle = (id: string) => {
    onChange(categories.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <>
      <SectionCard title="Categories Management" subtitle="Manage service, project, property, and construction categories." icon="🗂️">
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 text-xs pointer-events-none">🔍</span>
              <input
                type="search"
                placeholder="Search categories…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="dbc-input pl-8 text-xs"
                aria-label="Search categories"
              />
            </div>
            <button
              onClick={() => setModal({})}
              className="dbc-btn dbc-btn-sm dbc-btn-primary shrink-0"
              aria-label="Add new category"
            >
              + Add Category
            </button>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <span className="text-2xl block">🗂️</span>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                {search ? 'No categories match your search.' : 'No categories yet.'}
              </p>
              {!search && (
                <button onClick={() => setModal({})} className="text-[10px] text-brand-emerald font-bold hover:underline cursor-pointer focus:outline-none">
                  Add your first category →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-light-border">
              <table className="w-full text-left text-xs" aria-label="Categories table">
                <thead>
                  <tr className="bg-stone-50 border-b border-light-border">
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500">Name</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500">Type</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500">Status</th>
                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-wider text-stone-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border">
                  {filtered.map(cat => (
                    <tr key={cat.id} className={`hover:bg-stone-50 transition-colors ${!cat.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-stone-800">{cat.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${TYPE_COLORS[cat.type]}`}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${cat.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                          {cat.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setModal(cat)}
                            className="text-[9px] font-bold text-stone-600 hover:text-brand-emerald transition focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-emerald rounded cursor-pointer"
                            aria-label={`Edit ${cat.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggle(cat.id)}
                            className={`text-[9px] font-bold transition focus:outline-none focus-visible:ring-1 rounded cursor-pointer ${cat.active ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}`}
                            aria-label={`${cat.active ? 'Deactivate' : 'Activate'} ${cat.name}`}
                          >
                            {cat.active ? 'Deactivate' : 'Activate'}
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
            {categories.filter(c => c.active).length} active · {categories.filter(c => !c.active).length} inactive · {categories.length} total
          </p>
        </div>
      </SectionCard>

      {modal !== false && (
        <CategoryModal
          item={modal}
          onSave={handleSave}
          onClose={() => setModal(false)}
        />
      )}
    </>
  );
}
