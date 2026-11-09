import React from 'react';
import { Download, Printer, Share2, X, FileCheck2 } from 'lucide-react';
import {
  GeneratedPdfArtifact,
  sharePdfFileNative,
  triggerPdfFileDownload,
  triggerSafariIframePrint,
} from '../utils/pdfExporter';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: GeneratedPdfArtifact | null;
  referenceNo: string;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  artifact,
  referenceNo,
}) => {
  if (!isOpen || !artifact) return null;

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-xl shadow-xl w-full max-w-lg overflow-hidden pb-safe">
        {/* Mobile drag handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100">
                A4 Document Ready ({referenceNo})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Standard ISO A4 Portrait (210mm × 297mm) · Safari & iPhone Compatible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            aria-label="Close export sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Your A4 PDF (<span className="font-mono font-semibold">{artifact.filename}</span>) has
            been generated. Choose how you would like to save, share, or print on your device:
          </p>

          <div className="space-y-2.5 pt-1">
            {/* Primary Action: Direct A4 PDF Download */}
            <button
              type="button"
              onClick={() => triggerPdfFileDownload(artifact)}
              className="w-full min-h-[48px] px-4 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-semibold rounded-lg flex items-center justify-between hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Download className="w-4 h-4 shrink-0" />
                <span>Download A4 PDF ({artifact.filename})</span>
              </span>
              <span className="text-[11px] font-mono opacity-80">210×297mm</span>
            </button>

            {/* iOS Safari / iPhone Share & AirPrint Sheet */}
            {canNativeShare && (
              <button
                type="button"
                onClick={() => sharePdfFileNative(artifact)}
                className="w-full min-h-[48px] px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-between hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>Share / Save to Files / AirPrint (iPhone & Safari)</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">iOS Sheet</span>
              </button>
            )}

            {/* Safari & Browser Direct Print Dialog */}
            <button
              type="button"
              onClick={() => triggerSafariIframePrint('a4-printable-sheet')}
              className="w-full min-h-[48px] px-4 py-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print A4 Document (Safari / System Print Dialog)</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">A4 Portrait</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
