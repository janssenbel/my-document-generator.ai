import React, { useState, useEffect } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Calculator,
  Copy,
  Check,
  ArrowRight,
  Bookmark,
  FileText,
  FolderOpen,
  Search,
  Moon,
  Sun,
  Eye,
  Edit3,
  Download,
  Settings,
} from 'lucide-react';
import {
  createDocumentFromPreset,
  DEFAULT_PROVIDER_PROFILE,
  formatPHP,
  SEC_TRANSACTION_PRESETS,
  amountToWordsPHP,
} from './data/secPresets';
import {
  DocumentType,
  LineItem,
  LineItemCategory,
  ProviderProfile,
  SECDocument,
  SECTransactionCategory,
} from './types/document';
import { calculateDocumentTotals, SECCapitalCalculationResult } from './utils/calculations';
import {
  buildA4VectorPdf,
  GeneratedPdfArtifact,
  triggerPdfFileDownload,
  triggerSafariIframePrint,
} from './utils/pdfExporter';
import { syncAppIdentityToDOM } from './hooks/usePWAInstall';
import { DocumentPreview } from './components/DocumentPreview';
import { SECFeeCalculatorModal } from './components/SECFeeCalculatorModal';
import { ProviderProfileModal } from './components/ProviderProfileModal';
import { PdfExportModal } from './components/PdfExportModal';
import { PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEY_DOCS = 'lexcorp_sec_saved_docs_v1';
const STORAGE_KEY_PROVIDER = 'lexcorp_sec_provider_v1';
const STORAGE_KEY_THEME = 'lexcorp_sec_theme_v1';

type EditorTab = 'items' | 'client' | 'tax_receipt' | 'checklist' | 'saved';

const DOC_TYPE_OPTIONS: {
  id: DocumentType;
  label: string;
  shortLabel: string;
  prefix: string;
  nextType: DocumentType;
  nextLabel: string;
}[] = [
  {
    id: 'quotation',
    label: 'Quotation',
    shortLabel: 'Quotation',
    prefix: 'QTN',
    nextType: 'billing',
    nextLabel: 'Convert to Billing Statement',
  },
  {
    id: 'billing',
    label: 'Billing Statement',
    shortLabel: 'Billing',
    prefix: 'SOA',
    nextType: 'invoice',
    nextLabel: 'Convert to Service Invoice',
  },
  {
    id: 'invoice',
    label: 'Service Invoice',
    shortLabel: 'Invoice',
    prefix: 'INV',
    nextType: 'receipt',
    nextLabel: 'Issue Acknowledgement Receipt',
  },
  {
    id: 'receipt',
    label: 'Acknowledgement Receipt',
    shortLabel: 'Receipt',
    prefix: 'AR',
    nextType: 'quotation',
    nextLabel: 'Start New Quotation',
  },
];

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  const [provider, setProvider] = useState<ProviderProfile>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROVIDER);
      return raw
        ? { ...DEFAULT_PROVIDER_PROFILE, ...JSON.parse(raw) }
        : DEFAULT_PROVIDER_PROFILE;
    } catch {
      return DEFAULT_PROVIDER_PROFILE;
    }
  });

  const [doc, setDoc] = useState<SECDocument>(() =>
    createDocumentFromPreset('amendment', 'quotation')
  );

  const [savedDocs, setSavedDocs] = useState<SECDocument[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_DOCS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage error
    }
    return [
      createDocumentFromPreset('amendment', 'quotation'),
      createDocumentFromPreset('increase_acs', 'billing'),
      createDocumentFromPreset('registration', 'invoice'),
      createDocumentFromPreset('dissolution', 'receipt'),
    ];
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('items');
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [pdfArtifact, setPdfArtifact] = useState<GeneratedPdfArtifact | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilterType, setLedgerFilterType] = useState<DocumentType | 'all'>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROVIDER, JSON.stringify(provider));
    } catch {
      // ignore
    }
    // Sync Studio Brand Name & Dynamic iPhone Apple Touch Icon to DOM
    syncAppIdentityToDOM(
      provider.appBrandName || 'LexCorp SEC Studio',
      provider.appIconMonogram || 'SEC'
    );
  }, [provider]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(savedDocs));
    } catch {
      // ignore
    }
  }, [savedDocs]);

  const showNotice = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2600);
  };

  const totals = calculateDocumentTotals(doc);

  // Generate A4 PDF & open Safari / iPhone compatible Export & Print Modal
  const handleExportOrPrintA4 = () => {
    const generated = buildA4VectorPdf(doc, provider);
    setPdfArtifact(generated);
    triggerPdfFileDownload(generated);
    setIsPdfModalOpen(true);
  };

  const handleDirectSafariPrint = () => {
    triggerSafariIframePrint('a4-printable-sheet');
  };

  // Switch between Quotation, Billing, Invoice, and Acknowledgement Receipt
  const handleSelectDocType = (newType: DocumentType) => {
    const meta = DOC_TYPE_OPTIONS.find((d) => d.id === newType)!;
    const preset = SEC_TRANSACTION_PRESETS[doc.secCategory];
    const currentNumberSuffix = doc.referenceNo.split('-').slice(-2).join('-') || '2026-0108';

    setDoc((prev) => ({
      ...prev,
      docType: newType,
      referenceNo: `SEC-${meta.prefix}-${currentNumberSuffix}`,
      notesAndTerms:
        preset && preset.defaultNotes[newType]
          ? [...preset.defaultNotes[newType]]
          : prev.notesAndTerms,
      receiptDetails: {
        ...prev.receiptDetails,
        totalContractPrice: totals.fullNetPayable,
        amountReceived: prev.taxConfig.applyTrancheSplit
          ? totals.trancheTotalDueNow
          : totals.fullNetPayable,
        paymentPurpose: `Payment for ${prev.transactionTitle}`,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  // Apply SEC Transaction Preset from Dropdown List
  const handleSelectSECPreset = (category: SECTransactionCategory) => {
    const preset = SEC_TRANSACTION_PRESETS[category];
    const newLineItems: LineItem[] = preset.defaultLineItems.map((item, idx) => ({
      ...item,
      id: `item-${category}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    }));

    const newTotal = newLineItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    setDoc((prev) => ({
      ...prev,
      secCategory: category,
      transactionTitle: preset.transactionTitle,
      secPortalSystem: preset.secPortalSystem,
      processingTimeline: preset.processingTimeline,
      scopeSummary: preset.scopeSummary,
      lineItems: newLineItems,
      requirementsChecklist: [...preset.requirementsChecklist],
      notesAndTerms: [...preset.defaultNotes[prev.docType]],
      receiptDetails: {
        ...prev.receiptDetails,
        paymentPurpose: `Payment for ${preset.transactionTitle}`,
        totalContractPrice: newTotal,
        amountReceived: newTotal,
      },
      updatedAt: new Date().toISOString(),
    }));
    showNotice(`Loaded ${preset.shortLabel} template`);
  };

  // Convert current document to the next stage in workflow & save current snapshot
  const handleConvertWorkflow = () => {
    const currentMeta = DOC_TYPE_OPTIONS.find((d) => d.id === doc.docType)!;
    const nextMeta = DOC_TYPE_OPTIONS.find((d) => d.id === currentMeta.nextType)!;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const preset = SEC_TRANSACTION_PRESETS[doc.secCategory];

    setSavedDocs((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      if (exists) {
        return prev.map((d) => (d.id === doc.id ? doc : d));
      }
      return [doc, ...prev];
    });

    const convertedDoc: SECDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      docType: nextMeta.id,
      referenceNo: `SEC-${nextMeta.prefix}-2026-${randomSeq}`,
      notesAndTerms: [...preset.defaultNotes[nextMeta.id]],
      receiptDetails: {
        ...doc.receiptDetails,
        totalContractPrice: totals.fullNetPayable,
        amountReceived: doc.taxConfig.applyTrancheSplit
          ? totals.trancheTotalDueNow
          : totals.fullNetPayable,
        paymentPurpose: `Payment for ${doc.transactionTitle}`,
      },
      updatedAt: new Date().toISOString(),
    };

    setDoc(convertedDoc);
    setSavedDocs((prev) => [convertedDoc, ...prev]);
    showNotice(`Converted to ${nextMeta.label} & saved`);
  };

  const handleSaveToLedger = () => {
    const updated = { ...doc, updatedAt: new Date().toISOString() };
    setDoc(updated);
    setSavedDocs((prev) => {
      const exists = prev.some((d) => d.id === updated.id);
      if (exists) {
        return prev.map((d) => (d.id === updated.id ? updated : d));
      }
      return [updated, ...prev];
    });
    showNotice(`Saved ${updated.referenceNo} to Ledger`);
  };

  const handleAddLineItem = (category: LineItemCategory) => {
    const defaultTitles: Record<LineItemCategory, string> = {
      professional_fee: 'SEC Corporate Assistance & Secretarial Fee',
      sec_statutory_fee: 'SEC Statutory Filing Fee & Legal Research Fee (LRF)',
      bir_tax_dst: 'BIR Documentary Stamp Tax (DST — BIR Form 2000)',
      out_of_pocket: 'Notarial, Certification & Dossier Transmittal Expenses',
    };
    const newItem: LineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      description: defaultTitles[category],
      subtext: '',
      category,
      quantity: 1,
      unitPrice: category === 'professional_fee' ? 10000 : 1500,
    };
    setDoc((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  };

  const handleUpdateLineItem = (id: string, patch: Partial<LineItem>) => {
    setDoc((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const handleRemoveLineItem = (id: string) => {
    setDoc((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== id),
    }));
  };

  const handleApplyCalculatorResult = (
    res: SECCapitalCalculationResult,
    mode: 'registration' | 'increase_acs'
  ) => {
    const keptProfessionalAndOop = doc.lineItems.filter(
      (i) => i.category === 'professional_fee' || i.category === 'out_of_pocket'
    );

    const computedStatutoryItems: LineItem[] =
      mode === 'registration'
        ? [
            {
              id: `calc-name-${Date.now()}`,
              description: 'SEC Corporate Name Reservation Fee',
              subtext: '30-day corporate name reservation via SEC eSPARC',
              category: 'sec_statutory_fee',
              quantity: 1,
              unitPrice: res.nameReservationFee,
            },
            {
              id: `calc-aoi-${Date.now()}`,
              description: `SEC Filing Fee — Articles of Incorporation & By-Laws (ACS: ${formatPHP(res.authorizedCapitalOrIncrease)})`,
              subtext: `Computed at 1/5 of 1% of Authorized Capital Stock (${formatPHP(res.aoiFilingFee)}) + ₱1,000 By-Laws + ₱470 STB`,
              category: 'sec_statutory_fee',
              quantity: 1,
              unitPrice: res.aoiFilingFee + res.bylawsOrAmendedFee + res.stbFee,
            },
            {
              id: `calc-lrf-${Date.now()}`,
              description: 'SEC Legal Research Fee (LRF — 1% of Filing Fee)',
              subtext: 'Mandatory 1% UP Law Center Legal Research Fund fee (min. ₱20.00)',
              category: 'sec_statutory_fee',
              quantity: 1,
              unitPrice: res.lrfFee,
            },
            {
              id: `calc-dst-${Date.now()}`,
              description: `BIR Documentary Stamp Tax on Subscribed Capital (${formatPHP(res.subscribedCapital)})`,
              subtext:
                'Computed at ₱2.00 per ₱200.00 (1.0%) of Subscribed Capital Stock + ₱30 stamp',
              category: 'bir_tax_dst',
              quantity: 1,
              unitPrice: res.birDstFee,
            },
          ]
        : [
            {
              id: `calc-inc-${Date.now()}`,
              description: `SEC Filing Fee — Increase of Authorized Capital Stock (Increase: ${formatPHP(res.authorizedCapitalOrIncrease)})`,
              subtext: `Computed at 1/5 of 1% of Capital Increase (${formatPHP(res.aoiFilingFee)}) + ₱2,000 Amended AOI`,
              category: 'sec_statutory_fee',
              quantity: 1,
              unitPrice: res.totalSecFilingFee,
            },
            {
              id: `calc-lrf-${Date.now()}`,
              description: 'SEC Legal Research Fee (LRF — 1% of SEC Filing Fee)',
              subtext: 'Mandatory 1% UP Law Center Legal Research Fund fee',
              category: 'sec_statutory_fee',
              quantity: 1,
              unitPrice: res.lrfFee,
            },
            {
              id: `calc-dst-${Date.now()}`,
              description: `BIR Documentary Stamp Tax on New Subscriptions (${formatPHP(res.subscribedCapital)})`,
              subtext:
                'Computed at ₱2.00 per ₱200.00 (1.0%) of newly subscribed shares under BIR Form 2000',
              category: 'bir_tax_dst',
              quantity: 1,
              unitPrice: res.birDstFee,
            },
          ];

    setDoc((prev) => ({
      ...prev,
      lineItems: [...keptProfessionalAndOop, ...computedStatutoryItems],
    }));
    showNotice('Applied statutory SEC & BIR capital fees');
  };

  const handleCopyClientSummary = () => {
    const docLabel = DOC_TYPE_OPTIONS.find((d) => d.id === doc.docType)?.label.toUpperCase();
    const lines = [
      `${docLabel} — ${doc.referenceNo}`,
      `Client: ${doc.client.companyName}`,
      `SEC Transaction: ${doc.transactionTitle}`,
      `Date: ${doc.issueDate}`,
      `----------------------------------------`,
      `Professional / Assistance Fee (Net): ${formatPHP(totals.profFeeNetReceivable)}`,
      `SEC Statutory Fees & LRF: ${formatPHP(totals.secStatutoryTotal)}`,
      ...(totals.birTaxDstTotal > 0
        ? [`BIR Documentary Stamp Tax: ${formatPHP(totals.birTaxDstTotal)}`]
        : []),
      ...(totals.outOfPocketTotal > 0
        ? [`Out-of-Pocket / Notarial: ${formatPHP(totals.outOfPocketTotal)}`]
        : []),
      `TOTAL AMOUNT: ${formatPHP(totals.fullNetPayable)}`,
      ...(doc.taxConfig.applyTrancheSplit
        ? [`AMOUNT DUE THIS TRANCHE: ${formatPHP(totals.trancheTotalDueNow)}`]
        : []),
      `----------------------------------------`,
      `Bank Remittance: ${provider.bankName}`,
      `Account Name: ${provider.bankAccountName}`,
      `Account No.: ${provider.bankAccountNo}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const filteredLedger = savedDocs.filter((item) => {
    const matchesType = ledgerFilterType === 'all' || item.docType === ledgerFilterType;
    const q = ledgerSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.client.companyName.toLowerCase().includes(q) ||
      item.referenceNo.toLowerCase().includes(q) ||
      item.transactionTitle.toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const inputBaseClass =
    'w-full min-h-[42px] sm:min-h-[34px] px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md focus:outline-none focus:border-slate-900 dark:focus:border-slate-300';

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 lg:pb-8">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pt-safe">
        {/* Zone 1: Single text element wordmark (Editable in Studio Settings) */}
        <a
          href="#studio-settings"
          onClick={(e) => {
            e.preventDefault();
            setIsProviderOpen(true);
          }}
          title="Click to edit Studio Brand Name & Settings"
          className="font-display text-base font-bold tracking-tight text-slate-950 dark:text-white hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
        >
          {provider.appBrandName || 'LexCorp SEC Studio'}
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => {
              setActiveTab('items');
              setMobilePane('edit');
            }}
            className={`hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'items'
                ? 'text-slate-950 dark:text-white underline underline-offset-4'
                : ''
            }`}
          >
            Document Builder
          </button>
          <button
            type="button"
            onClick={() => setIsCalcOpen(true)}
            className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            SEC Fee Calculator
          </button>
          <button
            type="button"
            onClick={() => setIsProviderOpen(true)}
            className="hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Studio Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('saved');
              setMobilePane('edit');
            }}
            className={`hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'saved'
                ? 'text-slate-950 dark:text-white underline underline-offset-4'
                : ''
            }`}
          >
            Saved Ledger ({savedDocs.length})
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleExportOrPrintA4}
            className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white dark:text-slate-950 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Print / Export A4 PDF
          </button>
        </div>
      </header>

      {/* Workspace Control Bar (Document Type Switcher, Studio Settings, iPhone Home Screen Icon, Dark Mode, & Workflow Actions) */}
      <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Document Type Segmented Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            <span className="hidden sm:inline text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0">
              Document:
            </span>
            <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full sm:w-auto">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectDocType(opt.id)}
                  className={`min-h-[38px] sm:min-h-[32px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    doc.docType === opt.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <span className="sm:hidden">{opt.shortLabel}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Toolbar: Studio Settings, Add to iPhone Home Screen, Dark Mode, Print, Copy, Save, & Next Stage */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {savedToast && (
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mr-1">
                {savedToast}
              </span>
            )}

            {/* Studio & Firm Settings Button */}
            <button
              type="button"
              onClick={() => setIsProviderOpen(true)}
              className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Studio Settings</span>
            </button>

            {/* In-App PWA / iPhone Home Screen Icon Button */}
            <PWAInstallButton
              appBrandName={provider.appBrandName || 'LexCorp SEC Studio'}
              appIconMonogram={provider.appIconMonogram || 'SEC'}
              onOpenSettings={() => setIsProviderOpen(true)}
            />

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDirectSafariPrint}
              className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Safari Print</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToLedger}
              className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={handleCopyClientSummary}
              className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleConvertWorkflow}
              className="min-h-[40px] sm:min-h-[34px] inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold border border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-950 text-slate-900 dark:text-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <span>{DOC_TYPE_OPTIONS.find((d) => d.id === doc.docType)?.nextLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Only View Switcher Banner (Edit Form vs. Live A4 Sheet) */}
      <div className="no-print lg:hidden px-4 pt-3">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMobilePane('edit')}
            className={`min-h-[42px] flex items-center justify-center gap-2 text-xs font-semibold rounded-lg transition-colors ${
              mobilePane === 'edit'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit SEC Details</span>
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('preview')}
            className={`min-h-[42px] flex items-center justify-center gap-2 text-xs font-semibold rounded-lg transition-colors ${
              mobilePane === 'preview'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View A4 Document ({formatPHP(totals.fullNetPayable)})</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <main
        id="workspace"
        className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left Column: Editor & SEC Presets (5 Cols on Desktop, Toggled on Mobile, Hidden on Print) */}
        <section
          className={`no-print lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col ${
            mobilePane === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* SEC Transaction Template Dropdown Selector */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="sec-transaction-template-select"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                SEC Philippines Transaction Template
              </label>
              <button
                type="button"
                onClick={() => setIsCalcOpen(true)}
                className="min-h-[34px] inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-slate-200 hover:underline whitespace-nowrap shrink-0"
              >
                <Calculator className="w-3.5 h-3.5" />
                Capital Stock Calculator
              </button>
            </div>

            <select
              id="sec-transaction-template-select"
              value={doc.secCategory}
              onChange={(e) =>
                handleSelectSECPreset(e.target.value as SECTransactionCategory)
              }
              className="w-full min-h-[44px] sm:min-h-[38px] px-3 py-2 text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
            >
              {(Object.keys(SEC_TRANSACTION_PRESETS) as SECTransactionCategory[]).map(
                (catKey) => {
                  const preset = SEC_TRANSACTION_PRESETS[catKey];
                  return (
                    <option key={catKey} value={catKey}>
                      {preset.shortLabel} — {preset.transactionTitle}
                    </option>
                  );
                }
              )}
            </select>
          </div>

          {/* Editor Navigation Tabs */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 overflow-x-auto">
            {[
              { id: 'items', label: '1. Fees & Scope' },
              { id: 'client', label: '2. Client & Dates' },
              {
                id: 'tax_receipt',
                label: doc.docType === 'receipt' ? '3. Receipt & Tax' : '3. VAT, EWT & Tranche',
              },
              { id: 'checklist', label: '4. Checklist & Notes' },
              { id: 'saved', label: `5. Ledger (${savedDocs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as EditorTab)}
                className={`min-h-[44px] px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'border-slate-900 dark:border-slate-100 text-slate-950 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Editor Tab Body */}
          <div className="p-4 sm:p-5 space-y-5 text-xs">
            {/* TAB 1: PARTICULARS, SCOPE & LINE ITEMS */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    SEC Transaction Title / Subject
                  </label>
                  <textarea
                    rows={3}
                    value={doc.transactionTitle}
                    onChange={(e) => setDoc({ ...doc, transactionTitle: e.target.value })}
                    className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SEC Portal / Division Track
                    </label>
                    <textarea
                      rows={3}
                      value={doc.secPortalSystem}
                      onChange={(e) => setDoc({ ...doc, secPortalSystem: e.target.value })}
                      className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Estimated Processing Timeline
                    </label>
                    <textarea
                      rows={3}
                      value={doc.processingTimeline}
                      onChange={(e) => setDoc({ ...doc, processingTimeline: e.target.value })}
                      className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scope of Corporate Secretarial Assistance
                  </label>
                  <textarea
                    rows={4}
                    value={doc.scopeSummary}
                    onChange={(e) => setDoc({ ...doc, scopeSummary: e.target.value })}
                    className="w-full min-h-[96px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                  />
                </div>

                {/* Line Items List */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Itemized Fee Breakdown ({doc.lineItems.length} items)
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddLineItem('professional_fee')}
                        className="min-h-[38px] sm:min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-md hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        Assistance Fee
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLineItem('sec_statutory_fee')}
                        className="min-h-[38px] sm:min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        SEC Statutory Fee
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddLineItem('out_of_pocket')}
                        className="min-h-[38px] sm:min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        Out-of-Pocket
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {doc.lineItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 rounded-xl space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            Item #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                            <select
                              value={item.category}
                              onChange={(e) =>
                                handleUpdateLineItem(item.id, {
                                  category: e.target.value as LineItemCategory,
                                })
                              }
                              className="min-h-[40px] sm:min-h-[32px] px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md focus:outline-none"
                            >
                              <option value="professional_fee">
                                Professional / SEC Assistance Fee
                              </option>
                              <option value="sec_statutory_fee">
                                SEC Statutory Filing Fee / LRF
                              </option>
                              <option value="bir_tax_dst">
                                BIR Documentary Stamp Tax (DST)
                              </option>
                              <option value="out_of_pocket">
                                Out-of-Pocket / Notarial / Publication
                              </option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Remove line item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Particulars / Line Item Description
                          </label>
                          <textarea
                            rows={3}
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateLineItem(item.id, { description: e.target.value })
                            }
                            placeholder="Line item title and description"
                            className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Statutory Computation Basis / Sub-details (Optional)
                          </label>
                          <textarea
                            rows={3}
                            value={item.subtext || ''}
                            onChange={(e) =>
                              handleUpdateLineItem(item.id, { subtext: e.target.value })
                            }
                            placeholder="Statutory basis or sub-details (optional)"
                            className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 pt-1 items-end">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateLineItem(item.id, {
                                  quantity: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="w-full min-h-[42px] sm:min-h-[36px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 rounded-md tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Unit Price (PHP)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateLineItem(item.id, {
                                  unitPrice: Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="w-full min-h-[42px] sm:min-h-[36px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 rounded-md tabular-nums"
                            />
                          </div>
                          <div className="text-right pb-2">
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Subtotal
                            </label>
                            <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                              {formatPHP(item.quantity * item.unitPrice)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CLIENT CORPORATION & DOCUMENT METADATA */}
            {activeTab === 'client' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Document Ref. No.
                    </label>
                    <textarea
                      rows={3}
                      value={doc.referenceNo}
                      onChange={(e) => setDoc({ ...doc, referenceNo: e.target.value })}
                      className="w-full min-h-[84px] px-3 py-2 font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Issue / Billing Date
                    </label>
                    <input
                      type="date"
                      value={doc.issueDate}
                      onChange={(e) => setDoc({ ...doc, issueDate: e.target.value })}
                      className={`${inputBaseClass} font-mono`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Valid Until / Due Date
                    </label>
                    <input
                      type="date"
                      value={doc.validUntilOrDueDate}
                      onChange={(e) => setDoc({ ...doc, validUntilOrDueDate: e.target.value })}
                      className={`${inputBaseClass} font-mono`}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Client Corporation / Incorporator Details
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Name / Proposed Company Name
                    </label>
                    <textarea
                      rows={3}
                      value={doc.client.companyName}
                      onChange={(e) =>
                        setDoc({
                          ...doc,
                          client: { ...doc.client, companyName: e.target.value },
                        })
                      }
                      className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        SEC Registration No.
                      </label>
                      <textarea
                        rows={3}
                        value={doc.client.secRegNo}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            client: { ...doc.client, secRegNo: e.target.value },
                          })
                        }
                        placeholder="e.g., CS201948219 or For Registration"
                        className="w-full min-h-[84px] px-3 py-2 font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Client Corporate TIN
                      </label>
                      <textarea
                        rows={3}
                        value={doc.client.tin}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            client: { ...doc.client, tin: e.target.value },
                          })
                        }
                        placeholder="000-000-000-000"
                        className="w-full min-h-[84px] px-3 py-2 font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Principal Office Address
                    </label>
                    <textarea
                      rows={3}
                      value={doc.client.address}
                      onChange={(e) =>
                        setDoc({
                          ...doc,
                          client: { ...doc.client, address: e.target.value },
                        })
                      }
                      className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Attention To (Authorized Representative)
                      </label>
                      <textarea
                        rows={3}
                        value={doc.client.attentionTo}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            client: { ...doc.client, attentionTo: e.target.value },
                          })
                        }
                        className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Designation / Corporate Position
                      </label>
                      <textarea
                        rows={3}
                        value={doc.client.designation}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            client: { ...doc.client, designation: e.target.value },
                          })
                        }
                        placeholder="e.g., Corporate Secretary / President"
                        className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      Studio Name, iPhone Icon & Firm Letterhead
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {provider.appBrandName} · {provider.firmName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProviderOpen(true)}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Studio Settings
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: TAX, EWT, TRANCHES & ACKNOWLEDGEMENT RECEIPT LEDGER */}
            {activeTab === 'tax_receipt' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Philippine Tax & Expanded Withholding Tax (BIR Form 2307)
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    VAT and Expanded Withholding Tax (EWT) are computed strictly on the{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      Professional / Assistance Fee
                    </strong>{' '}
                    component. Reimbursable SEC and BIR statutory fees are pass-through advances.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        VAT Registration Treatment
                      </label>
                      <select
                        value={doc.taxConfig.taxMode}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            taxConfig: {
                              ...doc.taxConfig,
                              taxMode: e.target.value as SECDocument['taxConfig']['taxMode'],
                            },
                          })
                        }
                        className={inputBaseClass}
                      >
                        <option value="non_vat">Non-VAT (0% VAT / Percentage Tax)</option>
                        <option value="vat_exclusive">
                          12% VAT Exclusive (+12% on Assistance Fee)
                        </option>
                        <option value="vat_inclusive">
                          12% VAT Inclusive (Assistance Fee includes 12% VAT)
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Less: Expanded Withholding Tax (EWT)
                      </label>
                      <select
                        value={doc.taxConfig.ewtRate}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            taxConfig: {
                              ...doc.taxConfig,
                              ewtRate: Number(e.target.value) as 0 | 2 | 5 | 10 | 15,
                            },
                          })
                        }
                        className={inputBaseClass}
                      >
                        <option value={0}>None (0% Withholding)</option>
                        <option value={2}>2% EWT (Top Withholding Agent — Services)</option>
                        <option value={5}>
                          5% EWT (Professional / Consultancy — Ind./Corp.)
                        </option>
                        <option value={10}>10% EWT (Professional Fees — Standard Rate)</option>
                        <option value={15}>15% EWT (Professional Fees &gt; ₱3M / Gross)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Milestone / Tranche Split */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <label className="flex items-center gap-2.5 cursor-pointer min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={doc.taxConfig.applyTrancheSplit}
                      onChange={(e) =>
                        setDoc({
                          ...doc,
                          taxConfig: {
                            ...doc.taxConfig,
                            applyTrancheSplit: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-slate-900 dark:accent-slate-100 shrink-0"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Enable Milestone / Tranche Downpayment Split (e.g., 50% Assistance Fee + 100%
                      SEC Fees)
                    </span>
                  </label>

                  {doc.taxConfig.applyTrancheSplit && (
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Milestone / Tranche Label
                        </label>
                        <textarea
                          rows={3}
                          value={doc.taxConfig.trancheDescription}
                          onChange={(e) =>
                            setDoc({
                              ...doc,
                              taxConfig: {
                                ...doc.taxConfig,
                                trancheDescription: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            % of Assistance Fee Now
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={doc.taxConfig.profFeeBillingPercent}
                            onChange={(e) =>
                              setDoc({
                                ...doc,
                                taxConfig: {
                                  ...doc.taxConfig,
                                  profFeeBillingPercent: Number(e.target.value),
                                },
                              })
                            }
                            className={`${inputBaseClass} font-mono tabular-nums`}
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            % of SEC Statutory Fees Now
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={doc.taxConfig.statutoryBillingPercent}
                            onChange={(e) =>
                              setDoc({
                                ...doc,
                                taxConfig: {
                                  ...doc.taxConfig,
                                  statutoryBillingPercent: Number(e.target.value),
                                },
                              })
                            }
                            className={`${inputBaseClass} font-mono tabular-nums`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acknowledgement Receipt Specific Fields */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Acknowledgement Receipt Payment & Ledger Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Mode of Payment
                      </label>
                      <select
                        value={doc.receiptDetails.paymentMethod}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            receiptDetails: {
                              ...doc.receiptDetails,
                              paymentMethod: e.target
                                .value as SECDocument['receiptDetails']['paymentMethod'],
                            },
                          })
                        }
                        className={inputBaseClass}
                      >
                        <option value="Bank Transfer / PESONet / InstaPay">
                          Bank Transfer / PESONet / InstaPay
                        </option>
                        <option value="Corporate / Manager's Check">
                          Corporate / Manager&apos;s Check
                        </option>
                        <option value="Digital Wallet (GCash / Maya)">
                          Digital Wallet (GCash / Maya)
                        </option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date Payment Credited
                      </label>
                      <input
                        type="date"
                        value={doc.receiptDetails.paymentDate}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            receiptDetails: {
                              ...doc.receiptDetails,
                              paymentDate: e.target.value,
                            },
                          })
                        }
                        className={`${inputBaseClass} font-mono`}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Issuing Bank / Payment Channel
                      </label>
                      <textarea
                        rows={3}
                        value={doc.receiptDetails.issuingBank}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            receiptDetails: {
                              ...doc.receiptDetails,
                              issuingBank: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Check No. / Reference No.
                      </label>
                      <textarea
                        rows={3}
                        value={doc.receiptDetails.referenceNo}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            receiptDetails: {
                              ...doc.receiptDetails,
                              referenceNo: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[84px] px-3 py-2 font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Purpose Description
                      </label>
                      <textarea
                        rows={3}
                        value={doc.receiptDetails.paymentPurpose}
                        onChange={(e) =>
                          setDoc({
                            ...doc,
                            receiptDetails: {
                              ...doc.receiptDetails,
                              paymentPurpose: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 pt-2 cursor-pointer min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={doc.receiptDetails.overrideAutoAmount}
                      onChange={(e) =>
                        setDoc({
                          ...doc,
                          receiptDetails: {
                            ...doc.receiptDetails,
                            overrideAutoAmount: e.target.checked,
                            totalContractPrice: totals.fullNetPayable,
                            amountReceived: totals.fullNetPayable,
                          },
                        })
                      }
                      className="w-4 h-4 accent-slate-900 dark:accent-slate-100 shrink-0"
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Manually override Amount Received / Partial Payment Ledger
                    </span>
                  </label>

                  {doc.receiptDetails.overrideAutoAmount && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Total Contract (PHP)
                        </label>
                        <input
                          type="number"
                          value={doc.receiptDetails.totalContractPrice}
                          onChange={(e) =>
                            setDoc({
                              ...doc,
                              receiptDetails: {
                                ...doc.receiptDetails,
                                totalContractPrice: Number(e.target.value),
                              },
                            })
                          }
                          className={`${inputBaseClass} font-mono tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Prior Payments
                        </label>
                        <input
                          type="number"
                          value={doc.receiptDetails.previousPayments}
                          onChange={(e) =>
                            setDoc({
                              ...doc,
                              receiptDetails: {
                                ...doc.receiptDetails,
                                previousPayments: Number(e.target.value),
                              },
                            })
                          }
                          className={`${inputBaseClass} font-mono tabular-nums`}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Amount Received Now
                        </label>
                        <input
                          type="number"
                          value={doc.receiptDetails.amountReceived}
                          onChange={(e) =>
                            setDoc({
                              ...doc,
                              receiptDetails: {
                                ...doc.receiptDetails,
                                amountReceived: Number(e.target.value),
                              },
                            })
                          }
                          className={`${inputBaseClass} font-mono tabular-nums`}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Amount in Words Preview:{' '}
                    </span>
                    {amountToWordsPHP(
                      doc.receiptDetails.overrideAutoAmount
                        ? doc.receiptDetails.amountReceived
                        : doc.taxConfig.applyTrancheSplit
                          ? totals.trancheTotalDueNow
                          : totals.fullNetPayable
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: REQUIREMENTS CHECKLIST & NOTES */}
            {activeTab === 'checklist' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      SEC Documentary Requirements Checklist ({doc.requirementsChecklist.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDoc({
                          ...doc,
                          requirementsChecklist: [
                            ...doc.requirementsChecklist,
                            'Signed Secretary’s Certificate / Board Resolution',
                          ],
                        })
                      }
                      className="min-h-[38px] sm:min-h-[32px] inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-md hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Requirement
                    </button>
                  </div>

                  <div className="space-y-3">
                    {doc.requirementsChecklist.map((req, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            Requirement #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDoc({
                                ...doc,
                                requirementsChecklist: doc.requirementsChecklist.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Remove requirement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={req}
                          onChange={(e) => {
                            const updated = [...doc.requirementsChecklist];
                            updated[idx] = e.target.value;
                            setDoc({ ...doc, requirementsChecklist: updated });
                          }}
                          placeholder="Enter documentary requirement..."
                          className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Engagement Terms, Tax Remarks & Footnotes ({doc.notesAndTerms.length})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDoc({
                          ...doc,
                          notesAndTerms: [
                            ...doc.notesAndTerms,
                            'All statutory SEC filing fees are subject to actual SEC Payment Assessment Form (PAF) verification.',
                          ],
                        })
                      }
                      className="min-h-[38px] sm:min-h-[32px] inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded-md hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Note
                    </button>
                  </div>

                  <div className="space-y-3">
                    {doc.notesAndTerms.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            Note #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDoc({
                                ...doc,
                                notesAndTerms: doc.notesAndTerms.filter((_, i) => i !== idx),
                              })
                            }
                            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Remove note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={note}
                          onChange={(e) => {
                            const updated = [...doc.notesAndTerms];
                            updated[idx] = e.target.value;
                            setDoc({ ...doc, notesAndTerms: updated });
                          }}
                          placeholder="Enter engagement term or statutory note..."
                          className="w-full min-h-[84px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg leading-relaxed focus:outline-none focus:border-slate-900 dark:focus:border-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SAVED DOCUMENT LEDGER */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 sm:top-2.5" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Search client, ref no., or SEC service..."
                      className={`${inputBaseClass} pl-9`}
                    />
                  </div>
                  <select
                    value={ledgerFilterType}
                    onChange={(e) => setLedgerFilterType(e.target.value as DocumentType | 'all')}
                    className="min-h-[42px] sm:min-h-[34px] px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md"
                  >
                    <option value="all">All Types</option>
                    <option value="quotation">Quotations</option>
                    <option value="billing">Billing Statements</option>
                    <option value="invoice">Service Invoices</option>
                    <option value="receipt">Acknowledgement Receipts</option>
                  </select>
                </div>

                {filteredLedger.length === 0 ? (
                  <div className="p-8 text-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 rounded-lg space-y-2">
                    <FolderOpen className="w-6 h-6 text-slate-400 mx-auto" />
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      No Matching SEC Documents
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      Save your current document or clear the search filter to view saved records.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    {filteredLedger.map((item) => {
                      const itemTotals = calculateDocumentTotals(item);
                      const isCurrent = item.id === doc.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 flex items-start justify-between gap-3 transition-colors ${
                            isCurrent
                              ? 'bg-slate-50 dark:bg-slate-800/70'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                                {item.referenceNo}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="uppercase font-medium text-slate-700 dark:text-slate-300">
                                {item.docType}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{item.issueDate}</span>
                            </div>
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {item.client.companyName}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                              {item.transactionTitle}
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1.5">
                            <div className="font-mono font-bold text-slate-950 dark:text-white tabular-nums">
                              {formatPHP(itemTotals.fullNetPayable)}
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setDoc(item);
                                  setActiveTab('items');
                                  showNotice(`Loaded ${item.referenceNo}`);
                                }}
                                className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 rounded hover:bg-slate-800 dark:hover:bg-white transition-colors"
                              >
                                <FileText className="w-3 h-3" /> Open
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSavedDocs((prev) => prev.filter((d) => d.id !== item.id))
                                }
                                className="min-h-[34px] min-w-[34px] flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete from ledger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Live A4 Document Preview (7 Cols on Desktop, Toggled on Mobile, Full Page on Print) */}
        <section
          className={`lg:col-span-7 w-full ${
            mobilePane === 'edit' ? 'hidden lg:block' : 'block'
          }`}
        >
          <DocumentPreview doc={doc} provider={provider} />
        </section>
      </main>

      {/* Fixed Bottom Tab Bar for iPhone / Mobile Viewports (< 1024px) */}
      <nav
        aria-label="Mobile quick navigation"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center pb-safe"
      >
        <button
          type="button"
          onClick={() => {
            setMobilePane('edit');
            setActiveTab('items');
          }}
          className={`min-h-[54px] flex flex-col items-center justify-center py-1.5 ${
            mobilePane === 'edit' && activeTab !== 'saved'
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Builder</span>
        </button>

        <button
          type="button"
          onClick={() => setMobilePane('preview')}
          className={`min-h-[54px] flex flex-col items-center justify-center py-1.5 ${
            mobilePane === 'preview'
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Eye className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">A4 View</span>
        </button>

        <button
          type="button"
          onClick={() => setIsProviderOpen(true)}
          className="min-h-[54px] flex flex-col items-center justify-center py-1.5 text-slate-500 dark:text-slate-400"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Settings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobilePane('edit');
            setActiveTab('saved');
          }}
          className={`min-h-[54px] flex flex-col items-center justify-center py-1.5 ${
            mobilePane === 'edit' && activeTab === 'saved'
              ? 'text-slate-950 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Ledger</span>
        </button>

        <button
          type="button"
          onClick={handleExportOrPrintA4}
          className="min-h-[54px] flex flex-col items-center justify-center py-1.5 text-slate-950 dark:text-white font-semibold"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">A4 PDF</span>
        </button>
      </nav>

      {/* Modals */}
      <SECFeeCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        defaultMode={doc.secCategory === 'increase_acs' ? 'increase_acs' : 'registration'}
        onApplyToDocument={handleApplyCalculatorResult}
      />

      <ProviderProfileModal
        isOpen={isProviderOpen}
        onClose={() => setIsProviderOpen(false)}
        provider={provider}
        onSave={(updated) => {
          setProvider(updated);
          showNotice('Saved Studio Settings & Firm Profile');
        }}
      />

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        artifact={pdfArtifact}
        referenceNo={doc.referenceNo}
      />
    </div>
  );
}
