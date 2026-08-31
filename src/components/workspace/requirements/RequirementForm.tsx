import { useState, useEffect, startTransition } from 'react';

const CATEGORIES = [
  'Architect',
  'Interior Designer',
  'Civil Engineer',
  'Structural Engineer',
  'Landscape Designer',
  'Quantity Surveyor',
  'Vastu Consultant',
  'Pest Control',
  'False Ceiling',
  'Tiles Specialist',
  'Masonry Work',
  'CCTV Installation',
];

/** Typed shape of a requirement form's field values. */
export interface RequirementValues {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  address: string;
}

interface RequirementFormProps {
  initialValues?: Partial<RequirementValues>;
  onSubmit: (values: RequirementValues, status: 'Open' | 'Draft') => void;
  onCancel: () => void;
}

export function RequirementForm({ initialValues, onSubmit, onCancel }: RequirementFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Architect',
    budgetMin: 5000,
    budgetMax: 50000,
    city: 'Hyderabad',
    address: '',
  });

  useEffect(() => {
    if (initialValues) {
      startTransition(() => {
        setFormData({
          title: initialValues.title || '',
          description: initialValues.description || '',
          category: initialValues.category || 'Architect',
          budgetMin: initialValues.budgetMin || 5000,
          budgetMax: initialValues.budgetMax || 50000,
          city: initialValues.city || 'Hyderabad',
          address: initialValues.address || '',
        });
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.startsWith('budget') ? Number(value) : value,
    }));
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinalSubmit = (status: 'Open' | 'Draft') => {
    onSubmit(formData, status);
  };

  const stepsList = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Category' },
    { num: 3, label: 'Budget' },
    { num: 4, label: 'Location' },
    { num: 5, label: 'Review' },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-md p-6 max-w-2xl mx-auto space-y-6 text-left transition duration-200">
      
      {/* Wizard Steps indicator */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        {stepsList.map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition ${
                step === s.num
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-55/20 border-emerald-300 text-emerald-800 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400'
              }`}
            >
              {s.num}
            </span>
            <span
              className={`text-[9px] uppercase tracking-wider font-extrabold hidden sm:inline ${
                step === s.num ? 'text-stone-850' : 'text-stone-400'
              }`}
            >
              {s.label}
            </span>
            {s.num < 5 && <span className="text-stone-300 hidden sm:inline">→</span>}
          </div>
        ))}
      </div>

      {/* Step Contents */}
      <div className="min-h-[220px] flex flex-col justify-between">
        
        {/* STEP 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider">Step 1: Project Title & Details</h4>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Requirement Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Modern Villa Design Layout, Tiles Repair"
                className="dbc-input"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Project Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your project size, timelines, specifications, and files required..."
                className="dbc-input"
                required
              />
            </div>
          </div>
        )}

        {/* STEP 2: Category Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider">Step 2: Service Category</h4>
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-stone-400">Target Specialist Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="dbc-input bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-stone-400 font-semibold leading-relaxed">
              Selecting the appropriate category ensures your requirements are visible to matching verified providers.
            </p>
          </div>
        )}

        {/* STEP 3: Budget Settings */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider">Step 3: Budget Range Setting</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400">Minimum Budget (₹)</label>
                <input
                  type="number"
                  name="budgetMin"
                  value={formData.budgetMin}
                  onChange={handleChange}
                  min={1000}
                  className="dbc-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400">Maximum Budget (₹)</label>
                <input
                  type="number"
                  name="budgetMax"
                  value={formData.budgetMax}
                  onChange={handleChange}
                  min={formData.budgetMin}
                  className="dbc-input"
                />
              </div>
            </div>
            <p className="text-[10px] text-stone-400 font-semibold leading-relaxed">
              Setting budget thresholds protects you from out-of-range pricing estimates.
            </p>
          </div>
        )}

        {/* STEP 4: Location Settings */}
        {step === 4 && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider">Step 4: Location details</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="dbc-input"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-stone-400">Street Address & Area</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Plot 404, Banjara Hills, Hyderabad"
                  className="dbc-input"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-stone-800 tracking-wider">Step 5: Review Specifications</h4>
            
            <div className="border border-stone-250 bg-stone-50/50 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="font-bold text-stone-800">{formData.title || 'Untitled Requirement'}</span>
                <span className="font-black text-emerald-800 uppercase tracking-wider">{formData.category}</span>
              </div>
              <p className="text-[10px] text-stone-500 font-semibold leading-relaxed italic">
                "{formData.description || 'No description provided.'}"
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-stone-600">
                <span>Budget: ₹{formData.budgetMin.toLocaleString()} - ₹{formData.budgetMax.toLocaleString()}</span>
                <span>Address: {formData.address}, {formData.city}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-stone-100 mt-6">
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700"
            >
              Cancel
            </button>
            {step === 5 && (
              <button
                onClick={() => handleFinalSubmit('Draft')}
                className="dbc-btn dbc-btn-md dbc-btn-secondary bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-800"
              >
                Save Draft
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700"
              >
                Back
              </button>
            )}
            
            {step < 5 ? (
              <button
                onClick={nextStep}
                disabled={step === 1 && !formData.title.trim()}
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => handleFinalSubmit('Open')}
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Publish Requirement
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
