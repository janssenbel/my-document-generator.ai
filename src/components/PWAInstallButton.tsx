import React, { useState } from 'react';
import { Smartphone, Share, PlusSquare, X, Download } from 'lucide-react';
import { generateDynamicAppleTouchIcon, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  appBrandName: string;
  appIconMonogram: string;
  onOpenSettings: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  appBrandName,
  appIconMonogram,
  onOpenSettings,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const iconPreview = generateDynamicAppleTouchIcon(appIconMonogram || 'SEC');

  return (
    <>
      {isInstallable ? (
        <button
          type="button"
          onClick={install}
          className="min-h-[38px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="min-h-[38px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{isIOS ? 'Add to iPhone' : 'Home Screen Icon'}</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 no-print">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200/80 dark:border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pb-safe">
            <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/70 dark:border-white/[0.08] bg-slate-50/70 dark:bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Add to iPhone Home Screen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Live Home Screen Icon Preview */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-white/[0.08] rounded-xl">
                {iconPreview && (
                  <img
                    src={iconPreview}
                    alt="Home Screen App Icon"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl shadow-md shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold text-slate-900 dark:text-white truncate">
                    {appBrandName || 'SEC Studio'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    180×180px Apple Touch Icon · Badge: {appIconMonogram || 'SEC'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuide(false);
                      onOpenSettings();
                    }}
                    className="mt-1.5 text-[11px] font-semibold text-slate-900 dark:text-slate-200 underline underline-offset-2"
                  >
                    Customize Studio Name & Icon Badge
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Share className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Step 1:</strong> Tap the{' '}
                    <strong>Share</strong> button at the bottom of your iPhone Safari toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" />
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white">Step 2:</strong> Scroll down
                    the share menu and tap <strong>Add to Home Screen</strong>, then tap{' '}
                    <strong>Add</strong> in the top-right corner.
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[42px] px-5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-xl"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
