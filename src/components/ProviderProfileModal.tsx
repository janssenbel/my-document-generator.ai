import React, { useEffect, useState } from 'react';
import { Settings, X, Check, RotateCcw, Smartphone } from 'lucide-react';
import { DEFAULT_PROVIDER_PROFILE } from '../data/secPresets';
import { ProviderProfile } from '../types/document';
import { generateDynamicAppleTouchIcon } from '../hooks/usePWAInstall';

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
  const [form, setForm] = useState<ProviderProfile>(() => ({
    ...DEFAULT_PROVIDER_PROFILE,
    ...provider,
  }));
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string>('');

  useEffect(() => {
    setForm({
      ...DEFAULT_PROVIDER_PROFILE,
      ...provider,
    });
  }, [provider, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const preview = generateDynamicAppleTouchIcon(form.appIconMonogram || 'SEC');
      setIconPreviewUrl(preview);
    }
  }, [form.appIconMonogram, isOpen]);

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
            <Settings className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              Studio Settings, Firm Letterhead & iPhone Icon
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
          {/* Section 1: App Studio Brand Name & iPhone Home Screen Icon */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  1. Studio Brand Name & iPhone Home Screen Icon
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize the top bar Studio title (e.g. &ldquo;LexCorp SEC Studio&rdquo;) and the
                  icon displayed when added to your iPhone Home Screen in Safari.
                </p>
              </div>
              {iconPreviewUrl && (
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={iconPreviewUrl}
                    alt="iPhone Home Screen Icon Preview"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl shadow-md border border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-[80px] truncate">
                    {form.appBrandName || 'LexCorp SEC'}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Studio / App Title (Header & Home Screen Name)
                </label>
                <input
                  type="text"
                  value={form.appBrandName}
                  onChange={(e) => updateField('appBrandName', e.target.value)}
                  placeholder="LexCorp SEC Studio"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Icon Badge Initials (Max 4)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.appIconMonogram}
                  onChange={(e) => updateField('appIconMonogram', e.target.value.toUpperCase())}
                  placeholder="SEC"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <Smartphone className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 dark:text-slate-200">
                  How to Add to iPhone Home Screen:
                </strong>{' '}
                Save your settings below, tap the <strong>Share</strong> icon in iOS Safari, and
                select <strong>Add to Home Screen</strong>. Your custom Studio Name and icon badge
                will appear on your iPhone.
              </div>
            </div>
          </div>

          {/* Section 2: Document Letterhead Details */}
          <div className="space-y-3">
            <div className="font-display text-xs font-bold text-slate-900 dark:text-white">
              2. Document Letterhead & Practice Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Firm / Service Provider Name (Printed on A4 Document Letterhead)
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
          </div>

          {/* Section 3: Bank & Remittance Details */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="font-display text-xs font-bold text-slate-900 dark:text-white">
              3. Bank Remittance & Settlement Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>

          {/* Section 4: Signatories */}
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
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
