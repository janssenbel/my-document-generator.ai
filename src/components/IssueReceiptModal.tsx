import React, { useEffect, useState } from 'react';
import { Check, Download, FileCheck2, X } from 'lucide-react';
import { amountToWordsPHP, formatPHP, SEC_TRANSACTION_PRESETS } from '../data/secPresets';
import { PaymentRecord, ReceiptDetails, SECDocument } from '../types/document';
import { calculateDocumentTotals } from '../utils/calculations';

interface IssueReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDoc: SECDocument;
  onGenerateReceipt: (receiptDoc: SECDocument, updatedSourceDoc: SECDocument, exportPdfNow: boolean) => void;
}

type PaymentPresetType = 'full' | 'tranche' | 'statutory_only' | 'remaining_balance' | 'custom';

export const IssueReceiptModal: React.FC<IssueReceiptModalProps> = ({
  isOpen,
  onClose,
  sourceDoc,
  onGenerateReceipt,
}) => {
  const totals = calculateDocumentTotals(sourceDoc);
  const existingHistory = sourceDoc.paymentHistory || [];
  const sumPriorHistory = existingHistory.reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);

  const [presetType, setPresetType] = useState<PaymentPresetType>('full');
  const [receiptNo, setReceiptNo] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ReceiptDetails['paymentMethod']>(
    'Bank Transfer / PESONet / InstaPay'
  );
  const [issuingBank, setIssuingBank] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [totalContractPrice, setTotalContractPrice] = useState<number>(totals.fullNetPayable);
  const [previousPayments, setPreviousPayments] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(totals.fullNetPayable);

  useEffect(() => {
    if (!isOpen) return;
    const computedTotals = calculateDocumentTotals(sourceDoc);
    const historySum = (sourceDoc.paymentHistory || []).reduce(
      (sum, p) => sum + (Number(p.amountPaid) || 0),
      0
    );
    const prior =
      historySum > 0
        ? historySum
        : Number(sourceDoc.receiptDetails.previousPayments) || 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const generatedArNo =
      sourceDoc.docType === 'receipt' && sourceDoc.referenceNo.startsWith('SEC-AR-')
        ? sourceDoc.referenceNo
        : `SEC-AR-${todayStr.slice(0, 4)}-${randomSeq}`;

    setReceiptNo(generatedArNo);
    setPaymentDate(sourceDoc.receiptDetails.paymentDate || todayStr);
    setPaymentMethod(
      sourceDoc.receiptDetails.paymentMethod || 'Bank Transfer / PESONet / InstaPay'
    );
    setIssuingBank(sourceDoc.receiptDetails.issuingBank || 'BDO Unibank / BPI');
    setReferenceNo(sourceDoc.receiptDetails.referenceNo || `FT-${todayStr.replace(/-/g, '')}-${randomSeq}`);
    setTotalContractPrice(computedTotals.fullNetPayable);
    setPreviousPayments(prior);

    if (prior > 0 && prior < computedTotals.fullNetPayable) {
      const rem = Math.max(0, computedTotals.fullNetPayable - prior);
      setPresetType('remaining_balance');
      setAmountReceived(rem);
      setPaymentPurpose(
        `Final / Subsequent Payment for ${sourceDoc.transactionTitle} (Ref: ${sourceDoc.referenceNo})`
      );
    } else if (sourceDoc.taxConfig.applyTrancheSplit) {
      setPresetType('tranche');
      setAmountReceived(computedTotals.trancheTotalDueNow);
      setPaymentPurpose(
        `${sourceDoc.taxConfig.trancheDescription || 'Initial Tranche / Downpayment'} — ${sourceDoc.transactionTitle}`
      );
    } else {
      setPresetType('full');
      setAmountReceived(computedTotals.fullNetPayable);
      setPaymentPurpose(`Full Payment for ${sourceDoc.transactionTitle}`);
    }
  }, [isOpen, sourceDoc]);

  if (!isOpen) return null;

  const handleSelectPreset = (type: PaymentPresetType) => {
    setPresetType(type);
    const contractTotal = totalContractPrice || totals.fullNetPayable;
    if (type === 'full') {
      setPreviousPayments(0);
      setAmountReceived(contractTotal);
      setPaymentPurpose(`Full Payment for ${sourceDoc.transactionTitle}`);
    } else if (type === 'tranche') {
      setPreviousPayments(0);
      const trancheAmt = sourceDoc.taxConfig.applyTrancheSplit
        ? totals.trancheTotalDueNow
        : Math.round((totals.profFeeNetReceivable * 0.5 + totals.totalReimbursables) * 100) / 100;
      setAmountReceived(trancheAmt);
      setPaymentPurpose(
        `Initial Milestone / Tranche Payment (50% Assistance Fee + 100% SEC Statutory Advances) for ${sourceDoc.transactionTitle}`
      );
    } else if (type === 'statutory_only') {
      setPreviousPayments(0);
      setAmountReceived(totals.totalReimbursables);
      setPaymentPurpose(
        `100% SEC Statutory Filing Fees, LRF & BIR Documentary Stamp Tax Advance for ${sourceDoc.transactionTitle}`
      );
    } else if (type === 'remaining_balance') {
      const defaultPrior =
        sumPriorHistory > 0
          ? sumPriorHistory
          : sourceDoc.taxConfig.applyTrancheSplit
            ? totals.trancheTotalDueNow
            : Math.round(contractTotal * 0.5 * 100) / 100;
      setPreviousPayments(defaultPrior);
      setAmountReceived(Math.max(0, contractTotal - defaultPrior));
      setPaymentPurpose(
        `Final Balance Settlement upon SEC Approval for ${sourceDoc.transactionTitle}`
      );
    }
  };

  const remainingBalance = Math.max(
    0,
    (Number(totalContractPrice) || 0) -
      (Number(previousPayments) || 0) -
      (Number(amountReceived) || 0)
  );

  const handleConfirm = (exportPdfNow: boolean) => {
    const cleanReceiptNo = receiptNo.trim() || `SEC-AR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPaymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      receiptNo: cleanReceiptNo,
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      paymentMethod,
      issuingBank: issuingBank.trim(),
      referenceNo: referenceNo.trim(),
      paymentPurpose: paymentPurpose.trim() || `Payment for ${sourceDoc.transactionTitle}`,
      amountPaid: Number(amountReceived) || 0,
    };

    const updatedHistory = [...existingHistory, newPaymentRecord];
    const preset = SEC_TRANSACTION_PRESETS[sourceDoc.secCategory];

    const updatedReceiptDetails: ReceiptDetails = {
      paymentMethod,
      issuingBank: issuingBank.trim(),
      referenceNo: referenceNo.trim(),
      paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
      paymentPurpose: paymentPurpose.trim() || `Payment for ${sourceDoc.transactionTitle}`,
      totalContractPrice: Number(totalContractPrice) || totals.fullNetPayable,
      previousPayments: Number(previousPayments) || 0,
      amountReceived: Number(amountReceived) || 0,
      overrideAutoAmount: true,
    };

    const updatedSourceDoc: SECDocument = {
      ...sourceDoc,
      receiptDetails: updatedReceiptDetails,
      paymentHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    const receiptDoc: SECDocument = {
      ...sourceDoc,
      id: sourceDoc.docType === 'receipt' ? sourceDoc.id : `doc-ar-${Date.now()}`,
      docType: 'receipt',
      referenceNo: cleanReceiptNo,
      issueDate: paymentDate || new Date().toISOString().slice(0, 10),
      notesAndTerms:
        preset && preset.defaultNotes.receipt
          ? [...preset.defaultNotes.receipt]
          : sourceDoc.notesAndTerms,
      receiptDetails: updatedReceiptDetails,
      paymentHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };

    onGenerateReceipt(receiptDoc, updatedSourceDoc, exportPdfNow);
    onClose();
  };

  const textareaClass =
    'w-full min-h-[84px] px-3.5 py-2.5 bg-white dark:bg-[#081526] border border-[#0B2545]/20 dark:border-[#C59B27]/25 text-slate-900 dark:text-slate-100 rounded-xl leading-relaxed focus:outline-none focus:border-[#0B2545] dark:focus:border-[#E5B842] focus:ring-2 focus:ring-[#C59B27]/25 transition-all';

  const inputClass =
    'w-full min-h-[44px] sm:min-h-[38px] px-3.5 py-2 bg-white dark:bg-[#081526] border border-[#0B2545]/20 dark:border-[#C59B27]/25 text-slate-900 dark:text-slate-100 rounded-xl focus:outline-none focus:border-[#0B2545] dark:focus:border-[#E5B842] focus:ring-2 focus:ring-[#C59B27]/25 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 no-print">
      <div className="bg-white dark:bg-[#0B192C] border-t sm:border border-[#0B2545]/20 dark:border-[#C59B27]/30 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden pb-safe">
        {/* Mobile grab handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* SEC Philippines Royal Navy & Seal Gold Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-[#0B2545] text-white border-b-2 border-[#C59B27] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileCheck2 className="w-4 h-4 text-[#E5B842] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold text-white truncate">
                Generate Acknowledgement Receipt for Payment Made
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                Client: {sourceDoc.client.companyName} · Source: {sourceDoc.referenceNo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* 1. Payment Preset Selector */}
          <div className="space-y-2">
            <label className="block font-bold text-[#0B2545] dark:text-[#E5B842]">
              1. Select Payment Type / Milestone Paid
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: 'full',
                  title: 'Full Payment (100%)',
                  amount: formatPHP(totals.fullNetPayable),
                },
                {
                  id: 'tranche',
                  title: 'Initial Tranche / Downpayment',
                  amount: formatPHP(
                    sourceDoc.taxConfig.applyTrancheSplit
                      ? totals.trancheTotalDueNow
                      : Math.round(
                          (totals.profFeeNetReceivable * 0.5 + totals.totalReimbursables) * 100
                        ) / 100
                  ),
                },
                {
                  id: 'statutory_only',
                  title: 'SEC & BIR Statutory Fees Only',
                  amount: formatPHP(totals.totalReimbursables),
                },
                {
                  id: 'remaining_balance',
                  title: 'Final / Remaining Balance',
                  amount: formatPHP(
                    Math.max(
                      0,
                      totals.fullNetPayable -
                        (sumPriorHistory > 0
                          ? sumPriorHistory
                          : sourceDoc.taxConfig.applyTrancheSplit
                            ? totals.trancheTotalDueNow
                            : Math.round(totals.fullNetPayable * 0.5 * 100) / 100)
                    )
                  ),
                },
              ].map((opt) => {
                const isSelected = presetType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectPreset(opt.id as PaymentPresetType)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#0B2545] dark:bg-[#C59B27] text-white dark:text-[#07182E] border-[#C59B27] shadow-xs ring-2 ring-[#C59B27]/30'
                        : 'bg-white dark:bg-[#081526] text-slate-700 dark:text-slate-200 border-[#0B2545]/20 dark:border-[#C59B27]/25 hover:border-[#C59B27]'
                    }`}
                  >
                    <span className="font-semibold truncate pr-2">{opt.title}</span>
                    <span
                      className={`font-mono font-bold tabular-nums shrink-0 ${
                        isSelected
                          ? 'text-[#E5B842] dark:text-[#07182E]'
                          : 'text-[#0B2545] dark:text-[#E5B842]'
                      }`}
                    >
                      {opt.amount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Amount Paid & Account Balance Breakdown */}
          <div className="p-4 bg-[#0B2545]/[0.04] dark:bg-[#071526] border border-[#0B2545]/15 dark:border-[#C59B27]/25 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B2545] dark:text-[#E5B842]">
                2. Payment Amount & Account Statement Ledger
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                  remainingBalance === 0
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#0B2545] text-[#E5B842] border border-[#C59B27]/50'
                }`}
              >
                {remainingBalance === 0 ? 'Full Settlement (₱0 Balance)' : 'Partial / Tranche Payment'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Total Engagement Price (PHP)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={totalContractPrice}
                  onChange={(e) => {
                    setPresetType('custom');
                    setTotalContractPrice(Math.max(0, Number(e.target.value)));
                  }}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Less: Prior Payments (PHP)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={previousPayments}
                  onChange={(e) => {
                    setPresetType('custom');
                    setPreviousPayments(Math.max(0, Number(e.target.value)));
                  }}
                  className={`${inputClass} font-mono tabular-nums`}
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B2545] dark:text-[#E5B842] mb-1">
                  Amount Paid Now (PHP)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={amountReceived}
                  onChange={(e) => {
                    setPresetType('custom');
                    setAmountReceived(Math.max(0, Number(e.target.value)));
                  }}
                  className={`${inputClass} font-mono font-bold tabular-nums border-[#0B2545] dark:border-[#C59B27]`}
                />
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#0B2545]/15 dark:border-[#C59B27]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                <strong className="text-[#0B2545] dark:text-[#E5B842]">In Words:</strong>{' '}
                {amountToWordsPHP(Number(amountReceived) || 0)}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1.5">
                  Remaining Balance:
                </span>
                <span className="font-mono text-sm font-bold text-[#0B2545] dark:text-[#E5B842] tabular-nums">
                  {formatPHP(remainingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Payment Method, Bank, Reference No. & Purpose (3-Line Textareas) */}
          <div className="space-y-3.5">
            <div className="font-bold text-[#0B2545] dark:text-[#E5B842]">
              3. Official Receipt Metadata & Remittance Reference
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Acknowledgement Receipt No.
                </label>
                <textarea
                  rows={3}
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className={`${textareaClass} font-mono`}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mode of Payment
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as ReceiptDetails['paymentMethod'])
                    }
                    className={inputClass}
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
                    Date Payment Received / Credited
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Issuing Bank / Payment Channel
                </label>
                <textarea
                  rows={3}
                  value={issuingBank}
                  onChange={(e) => setIssuingBank(e.target.value)}
                  placeholder="e.g., BDO Unibank / BPI / GCash"
                  className={textareaClass}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Check No. / Bank Reference No.
                </label>
                <textarea
                  rows={3}
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g., INSTAPAY-9482014 or Check #0049182"
                  className={`${textareaClass} font-mono`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Purpose / Milestone Description (Printed on Receipt Certification)
                </label>
                <textarea
                  rows={3}
                  value={paymentPurpose}
                  onChange={(e) => setPaymentPurpose(e.target.value)}
                  className={textareaClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#071526] border-t border-[#0B2545]/15 dark:border-[#C59B27]/25 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => handleConfirm(false)}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B2545] hover:bg-[#133E7C] border border-[#C59B27]/60 rounded-xl transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-[#E5B842]" />
              <span>Generate Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => handleConfirm(true)}
              className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#07182E] bg-[#C59B27] hover:bg-[#E5B842] rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Generate & Export A4 PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
