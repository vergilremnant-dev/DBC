import { useState } from 'react';

export interface UserAddress {
  id: string;
  name: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  tag: 'Home' | 'Work' | 'Site' | 'Other';
}

interface AddressCardProps {
  addresses: UserAddress[];
  onAddAddress: (address: Omit<UserAddress, 'id'>) => void;
  onEditAddress: (id: string, address: Partial<UserAddress>) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefaultAddress: (id: string) => void;
}

export function AddressCard({
  addresses,
  onAddAddress,
  onEditAddress,
  onDeleteAddress,
  onSetDefaultAddress,
}: AddressCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<UserAddress | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [state, setState] = useState('Telangana');
  const [pincode, setPincode] = useState('');
  const [tag, setTag] = useState<'Home' | 'Work' | 'Site' | 'Other'>('Home');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setAddressLine('');
    setCity('Hyderabad');
    setState('Telangana');
    setPincode('');
    setTag('Home');
    setShowModal(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingItem(addr);
    setName(addr.name);
    setAddressLine(addr.addressLine);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setTag(addr.tag);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !addressLine.trim() || !pincode.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      name,
      addressLine,
      city,
      state,
      pincode,
      tag,
      isDefault: editingItem ? editingItem.isDefault : addresses.length === 0,
    };

    if (editingItem) {
      onEditAddress(editingItem.id, payload);
    } else {
      onAddAddress(payload);
    }
    setShowModal(false);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
      <div className="flex justify-between items-center border-b border-stone-100 pb-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-stone-900 font-serif">Saved Addresses</h3>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
            Manage your site delivery or calculation coordinates
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="dbc-btn dbc-btn-sm dbc-btn-primary"
        >
          + Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="py-10 text-center space-y-3 bg-stone-50 border border-dashed border-stone-200 rounded-2xl">
          <span className="text-2xl block">📍</span>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-stone-700">No additional addresses added yet</h4>
            <p className="text-[10px] text-stone-400 max-w-xs mx-auto font-medium">
              Save your residential or plot sites to coordinate trade allocations efficiently.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="dbc-btn dbc-btn-sm dbc-btn-outline"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 bg-white hover:shadow-sm ${
                addr.isDefault
                  ? 'border-emerald-600 ring-2 ring-emerald-600/5'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-150">
                      {addr.tag}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
                        Default
                      </span>
                    )}
                  </div>
                  <strong className="text-xs text-stone-900 font-serif leading-none">
                    {addr.name}
                  </strong>
                </div>

                <p className="text-[11px] text-stone-500 font-semibold leading-relaxed">
                  {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>

              {/* Actions row */}
              <div className="mt-4 pt-3 border-t border-stone-50 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-stone-400">
                {!addr.isDefault ? (
                  <button
                    onClick={() => onSetDefaultAddress(addr.id)}
                    className="hover:text-emerald-700 font-bold transition cursor-pointer"
                  >
                    Set Default
                  </button>
                ) : (
                  <span className="text-emerald-800 font-extrabold font-serif">Primary Site</span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="hover:text-stone-700 font-bold transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteAddress(addr.id)}
                    className="hover:text-rose-700 font-bold transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl text-xs space-y-4 font-semibold text-stone-700 text-left"
          >
            <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">
              {editingItem ? 'Edit Saved Address' : 'Add New Address'}
            </h3>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Label / Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Plot / Home Residency"
                required
                className="mt-1 dbc-input"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Address Details *</label>
              <textarea
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Plot no, Street details, Area info..."
                rows={2}
                required
                className="mt-1 dbc-input resize-none"
              />
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-400">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 dbc-input"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-400">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 dbc-input"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-400">Pincode *</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 500081"
                  required
                  className="mt-1 dbc-input"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-stone-400">Type / Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as 'Home' | 'Work' | 'Site' | 'Other')}
                  className="mt-1 dbc-input bg-white"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Site">Plot / Construction Site</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="dbc-btn dbc-btn-md dbc-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
