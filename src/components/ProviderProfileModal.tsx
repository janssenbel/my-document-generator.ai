import React, { useState } from 'react';
import { Building2, X, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_PROVIDER_PROFILE } from '../data/secPresets';
import { ProviderProfile } from '../types/document';

interface ProviderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: ProviderProfile;
  onSave: (updated: ProviderProfile) => void;
}

export const ProviderProfileModal: React.FC<ProviderProfileModalProps> = ({
  isOpen,
  onClose,
  provider,
  onSave,
}) => {
  const [form, setForm] = useState<ProviderProfile>(provider);

  if (!isOpen) return null;

  const updateField = (key: keyof ProviderProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const inputClass =
    'w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:border-slate-900 dark:focus:border-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden pb-safe">
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Practice / Firm Letterhead & Bank Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Firm / Service Provider Name (Letterhead Title)
              </label>
              <input
                type="text"
                value={form.firmName}
                onChange={(e) => updateField('firmName', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Practice Subtitle / Specialization
              </label>
              <input
                type="text"
                value={form.practiceTitle}
                onChange={(e) => updateField('practiceTitle', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={form.tin}
                onChange={(e) => updateField('tin', e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SEC / PRC / IBP Accreditation Line
              </label>
              <input
                type="text"
                value={form.accreditationNo}
                onChange={(e) => updateField('accreditationNo', e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Principal Office Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telephone / Mobile Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank & Branch
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Account Name
              </label>
              <input
                type="text"
                value={form.bankAccountName}
                onChange={(e) => updateField('bankAccountName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={form.bankAccountNo}
                onChange={(e) => updateField('bankAccountNo', e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Remittance Instructions (GCash / Maya / Check Payable To)
              </label>
              <input
                type="text"
                value={form.altPaymentInfo}
                onChange={(e) => updateField('altPaymentInfo', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Authorized Signatory Name
              </label>
              <input
                type="text"
                value={form.signatoryName}
                onChange={(e) => updateField('signatoryName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Signatory Title / Role
              </label>
              <input
                type="text"
                value={form.signatoryTitle}
                onChange={(e) => updateField('signatoryTitle', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prepared By Name
              </label>
              <input
                type="text"
                value={form.preparedByName}
                onChange={(e) => updateField('preparedByName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prepared By Role
              </label>
              <input
                type="text"
                value={form.preparedByTitle}
                onChange={(e) => updateField('preparedByTitle', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setForm(DEFAULT_PROVIDER_PROFILE)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(form);
                onClose();
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              Save Firm Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
