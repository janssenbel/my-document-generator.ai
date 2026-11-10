import React, { useState } from 'react';
import { Calculator, X, Check } from 'lucide-react';
import { formatPHP } from '../data/secPresets';
import { computeSECCapitalFees, SECCapitalCalculationResult } from '../utils/calculations';

interface SECFeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode: 'registration' | 'increase_acs';
  onApplyToDocument: (result: SECCapitalCalculationResult, mode: 'registration' | 'increase_acs') => void;
}

export const SECFeeCalculatorModal: React.FC<SECFeeCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultMode,
  onApplyToDocument,
}) => {
  const [mode, setMode] = useState<'registration' | 'increase_acs'>(defaultMode);
  const [acs, setAcs] = useState<number>(mode === 'registration' ? 1000000 : 10000000);
  const [subscribed, setSubscribed] = useState<number>(mode === 'registration' ? 250000 : 2500000);
  const [paidUp, setPaidUp] = useState<number>(mode === 'registration' ? 62500 : 625000);

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: 'registration' | 'increase_acs') => {
    setMode(newMode);
    if (newMode === 'registration') {
      setAcs(1000000);
      setSubscribed(250000);
      setPaidUp(62500);
    } else {
      setAcs(10000000);
      setSubscribed(2500000);
      setPaidUp(625000);
    }
  };

  const handleAcsChange = (val: number) => {
    const clean = Math.max(0, val);
    setAcs(clean);
    const minSub = Math.round(clean * 0.25);
    setSubscribed(minSub);
    setPaidUp(Math.round(minSub * 0.25));
  };

  const result = computeSECCapitalFees(mode, acs, subscribed, paidUp);

  const inputClass =
    'w-full min-h-[44px] px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-950/80 border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-300 focus:ring-2 focus:ring-slate-900/5 dark:focus:ring-white/10 tabular-nums rounded-xl transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden pb-safe">
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200/70 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-4 h-4 text-slate-800 dark:text-slate-200 shrink-0" />
            <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
              SEC Statutory Filing Fee & BIR DST Calculator
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            aria-label="Close calculator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Segmented Mode Control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/[0.06] rounded-xl">
            <button
              type="button"
              onClick={() => handleModeSwitch('registration')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                mode === 'registration'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              New Stock Incorporation (eSPARC)
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('increase_acs')}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                mode === 'increase_acs'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Increase of Authorized Capital Stock
            </button>
          </div>

          {/* Capital Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {mode === 'registration' ? 'Authorized Capital Stock (ACS)' : 'Increase in ACS (PHP)'}
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                value={acs}
                onChange={(e) => handleAcsChange(Number(e.target.value))}
                className={inputClass}
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Basis for 0.20% (1/5 of 1%) SEC fee
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {mode === 'registration' ? 'Subscribed Capital Stock' : 'New Subscribed Capital'}
              </label>
              <input
                type="number"
                min={0}
                step={25000}
                value={subscribed}
                onChange={(e) => setSubscribed(Math.max(0, Number(e.target.value)))}
                className={inputClass}
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Basis for 1.0% BIR Documentary Stamp Tax
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Paid-Up Capital (PHP)
              </label>
              <input
                type="number"
                min={0}
                step={10000}
                value={paidUp}
                onChange={(e) => setPaidUp(Math.max(0, Number(e.target.value)))}
                className={inputClass}
              />
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                25% of Subscribed: {formatPHP(subscribed * 0.25)}
              </span>
            </div>
          </div>

          {/* Quick Capital Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Quick Capital Tiers:</span>
            {[1000000, 5000000, 10000000, 25000000, 50000000, 100000000].map((presetCap) => (
              <button
                key={presetCap}
                type="button"
                onClick={() => handleAcsChange(presetCap)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-mono border border-slate-200/90 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors tabular-nums rounded-lg whitespace-nowrap shrink-0"
              >
                ₱{(presetCap / 1000000).toFixed(0)}M
              </button>
            ))}
          </div>

          {/* Statutory Assessment Breakdown */}
          <div className="border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-950/60 p-4 rounded-xl space-y-2.5 text-xs">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-200/70 dark:border-white/[0.08]">
              Computed Statutory Assessment Schedule
            </div>

            <div className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
              <span>
                {mode === 'registration'
                  ? 'SEC Filing Fee — Articles of Incorporation (0.20% of ACS, min ₱2,000):'
                  : 'SEC Filing Fee — Increase of Capital Stock (0.20% of Increase, min ₱3,000):'}
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                {formatPHP(result.aoiFilingFee)}
              </span>
            </div>

            <div className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
              <span>
                {mode === 'registration'
                  ? 'By-Laws (₱1,000) + STB Registration (₱470) + Name Reservation (₱100):'
                  : 'SEC Amended Articles of Incorporation Filing Fee:'}
              </span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                {formatPHP(result.bylawsOrAmendedFee + result.stbFee + result.nameReservationFee)}
              </span>
            </div>

            <div className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
              <span>SEC Legal Research Fee (LRF — 1% of SEC Filing Fee, min ₱20):</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                {formatPHP(result.lrfFee)}
              </span>
            </div>

            <div className="flex justify-between gap-2 text-slate-700 dark:text-slate-300">
              <span>BIR Documentary Stamp Tax (DST — 1% of Subscribed + ₱30 stamp):</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                {formatPHP(result.birDstFee)}
              </span>
            </div>

            <div className="flex justify-between gap-2 pt-2.5 border-t border-slate-200/80 dark:border-white/10 font-bold text-slate-950 dark:text-white text-sm">
              <span>Total Statutory SEC & BIR Fees:</span>
              <span className="font-mono tabular-nums shrink-0">
                {formatPHP(result.totalStatutoryEstimate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-white/[0.08] shrink-0">
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
              onApplyToDocument(result, mode);
              onClose();
            }}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <Check className="w-4 h-4" />
            Apply Statutory Fees to Document
          </button>
        </div>
      </div>
    </div>
  );
};
