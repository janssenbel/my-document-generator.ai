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

  const textareaClass =
    'w-full min-h-[84px] px-3.5 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-xl leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden pb-safe">
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#0B2545] text-white border-b-2 border-[#C59B27] shrink-0">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-[#E5B842] shrink-0" />
            <h2 className="font-display text-sm font-bold text-white">
              Studio Settings, Firm Letterhead & iPhone Icon
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: App Studio Brand Name & iPhone Home Screen Icon */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/[0.08] rounded-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-xs font-bold text-slate-900 dark:text-white">
                  1. Studio Brand Name & iPhone Home Screen Icon
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Customize the top bar Studio title (e.g. &ldquo;SEC Studio&rdquo;) and the
                  icon displayed when added to your iPhone Home Screen in Safari.
                </p>
              </div>
              {iconPreviewUrl && (
                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={iconPreviewUrl}
                    alt="iPhone Home Screen Icon Preview"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl shadow-md"
                  />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-[80px] truncate">
                    {form.appBrandName || 'SEC Studio'}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Studio / App Title (Header & Home Screen Name)
                </label>
                <textarea
                  rows={3}
                  value={form.appBrandName}
                  onChange={(e) => updateField('appBrandName', e.target.value)}
                  placeholder="SEC Studio"
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Icon Badge Initials (Max 4)
                </label>
                <textarea
                  rows={3}
                  maxLength={4}
                  value={form.appIconMonogram}
                  onChange={(e) => updateField('appIconMonogram', e.target.value.toUpperCase())}
                  placeholder="SEC"
                  className={`${textareaClass} font-mono uppercase`}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-200/70 dark:border-white/[0.08] text-[11px] text-slate-600 dark:text-slate-400">
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
                <textarea
                  rows={3}
                  value={form.firmName}
                  onChange={(e) => updateField('firmName', e.target.value)}
                  className={textareaClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Practice Subtitle / Specialization
                </label>
                <textarea
                  rows={3}
                  value={form.practiceTitle}
                  onChange={(e) => updateField('practiceTitle', e.target.value)}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax Identification Number (TIN)
                </label>
                <textarea
                  rows={3}
                  value={form.tin}
                  onChange={(e) => updateField('tin', e.target.value)}
                  className={`${textareaClass} font-mono`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SEC / PRC / IBP Accreditation Line
                </label>
                <textarea
                  rows={3}
                  value={form.accreditationNo}
                  onChange={(e) => updateField('accreditationNo', e.target.value)}
                  className={textareaClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Principal Office Address
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Email
                </label>
                <textarea
                  rows={3}
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Telephone / Mobile Number
                </label>
                <textarea
                  rows={3}
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={`${textareaClass} font-mono`}
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
                <textarea
                  rows={3}
                  value={form.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account Name
                </label>
                <textarea
                  rows={3}
                  value={form.bankAccountName}
                  onChange={(e) => updateField('bankAccountName', e.target.value)}
                  className={textareaClass}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Account Number
                </label>
                <textarea
                  rows={3}
                  value={form.bankAccountNo}
                  onChange={(e) => updateField('bankAccountNo', e.target.value)}
                  className={`${textareaClass} font-mono`}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Remittance Instructions (GCash / Maya / Check Payable To)
                </label>
                <textarea
                  rows={3}
                  value={form.altPaymentInfo}
                  onChange={(e) => updateField('altPaymentInfo', e.target.value)}
                  className={textareaClass}
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
              <textarea
                rows={3}
                value={form.signatoryName}
                onChange={(e) => updateField('signatoryName', e.target.value)}
                className={textareaClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Signatory Title / Role
              </label>
              <textarea
                rows={3}
                value={form.signatoryTitle}
                onChange={(e) => updateField('signatoryTitle', e.target.value)}
                className={textareaClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prepared By Name
              </label>
              <textarea
                rows={3}
                value={form.preparedByName}
                onChange={(e) => updateField('preparedByName', e.target.value)}
                className={textareaClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prepared By Role
              </label>
              <textarea
                rows={3}
                value={form.preparedByTitle}
                onChange={(e) => updateField('preparedByTitle', e.target.value)}
                className={textareaClass}
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
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B2545] hover:bg-[#133E7C] border border-[#C59B27]/60 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4 text-[#E5B842]" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
