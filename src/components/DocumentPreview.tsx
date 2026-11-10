import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { amountToWordsPHP, formatPHP } from '../data/secPresets';
import { LineItemCategory, ProviderProfile, SECDocument } from '../types/document';
import { calculateDocumentTotals } from '../utils/calculations';

interface DocumentPreviewProps {
  doc: SECDocument;
  provider: ProviderProfile;
}

const DOC_TYPE_HEADERS: Record<
  SECDocument['docType'],
  { title: string; subtitle: string; refLabel: string; dateLabel: string; secondaryDateLabel: string }
> = {
  quotation: {
    title: 'SERVICE QUOTATION & FEE PROPOSAL',
    subtitle: 'SEC Philippines Corporate Secretarial & Regulatory Assistance',
    refLabel: 'Quotation No.',
    dateLabel: 'Date Issued',
    secondaryDateLabel: 'Valid Until',
  },
  billing: {
    title: 'BILLING STATEMENT',
    subtitle: 'Statement of Account for SEC Corporate Assistance & Statutory Advances',
    refLabel: 'Billing SOA No.',
    dateLabel: 'Billing Date',
    secondaryDateLabel: 'Due Date',
  },
  invoice: {
    title: 'SERVICE INVOICE',
    subtitle: 'Professional Corporate Secretarial & SEC Compliance Services',
    refLabel: 'Invoice No.',
    dateLabel: 'Invoice Date',
    secondaryDateLabel: 'Due Date',
  },
  receipt: {
    title: 'ACKNOWLEDGEMENT RECEIPT',
    subtitle: 'Official Confirmation of Payment & Statutory Fund Advancement',
    refLabel: 'Receipt No.',
    dateLabel: 'Date Received',
    secondaryDateLabel: 'Transaction Date',
  },
};

const CATEGORY_LABELS: Record<LineItemCategory, string> = {
  professional_fee: 'Professional / Assistance Fee',
  sec_statutory_fee: 'SEC Statutory Fee / LRF',
  bir_tax_dst: 'BIR Documentary Stamp Tax',
  out_of_pocket: 'Out-of-Pocket / Notarial',
};

// 210mm in CSS pixels at 96 DPI is ~793.7px
const A4_WIDTH_PX = 794;

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ doc, provider }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(1123);
  const [fitToScreen, setFitToScreen] = useState(true);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current || !sheetRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      const rawSheetHeight = sheetRef.current.offsetHeight || 1123;
      setSheetHeight(rawSheetHeight);

      if (fitToScreen && availableWidth < A4_WIDTH_PX) {
        const computedScale = Math.max(0.35, (availableWidth - 4) / A4_WIDTH_PX);
        setScale(computedScale);
      } else {
        setScale(1);
      }
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    if (sheetRef.current) observer.observe(sheetRef.current);
    window.addEventListener('resize', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [doc, provider, fitToScreen]);

  const totals = calculateDocumentTotals(doc);
  const headerMeta = DOC_TYPE_HEADERS[doc.docType];

  const profItems = doc.lineItems.filter((i) => i.category === 'professional_fee');
  const reimbursableItems = doc.lineItems.filter((i) => i.category !== 'professional_fee');

  // For Acknowledgement Receipt ledger
  const effectiveContractTotal = doc.receiptDetails.overrideAutoAmount
    ? doc.receiptDetails.totalContractPrice
    : totals.fullNetPayable;
  const effectiveAmountReceived = doc.receiptDetails.overrideAutoAmount
    ? doc.receiptDetails.amountReceived
    : doc.taxConfig.applyTrancheSplit
      ? totals.trancheTotalDueNow
      : totals.fullNetPayable;
  const previousPaid = Number(doc.receiptDetails.previousPayments) || 0;
  const remainingAfterReceipt = Math.max(
    0,
    effectiveContractTotal - previousPaid - effectiveAmountReceived
  );
  const amountInWords = amountToWordsPHP(effectiveAmountReceived);

  return (
    <div ref={containerRef} className="w-full">
      {/* A4 Paper Format Bar (Hidden on Print) */}
      <div className="no-print flex items-center justify-between gap-2 px-3.5 py-2.5 mb-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl shadow-2xs text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 truncate">
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            A4 Portrait
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] tabular-nums whitespace-nowrap">
            210×297mm
          </span>
          {scale < 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                {Math.round(scale * 100)}% Fit
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFitToScreen((prev) => !prev)}
          className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 rounded-lg active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
        >
          {fitToScreen ? (
            <>
              <ZoomIn className="w-3.5 h-3.5" /> Actual Size
            </>
          ) : (
            <>
              <ZoomOut className="w-3.5 h-3.5" /> Fit Portrait
            </>
          )}
        </button>
      </div>

      {/* Responsive Scale Viewport for True A4 Sheet */}
      <div
        className={`w-full ${!fitToScreen ? 'overflow-x-auto pb-3' : 'overflow-hidden'} flex justify-center`}
        style={{
          height: scale < 1 ? `${Math.ceil(sheetHeight * scale) + 16}px` : 'auto',
        }}
      >
        <div
          style={{
            transform: scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top center',
            width: `${A4_WIDTH_PX}px`,
          }}
          className="shrink-0"
        >
          {/* Actual A4 Sheet (210mm x 297mm minimum) */}
          <div
            id="a4-printable-sheet"
            ref={sheetRef}
            className="a4-paper-sheet print-only-container bg-white text-slate-900 ring-1 ring-slate-900/[0.08] dark:ring-white/15 shadow-xl rounded-[2px] text-[12.5px] leading-relaxed"
          >
            {/* Top Letterhead */}
            <div className="flex flex-row items-start justify-between gap-6 pb-5 border-b-2 border-slate-900">
              <div className="max-w-[420px]">
                <h1 className="font-display text-lg font-bold tracking-tight text-slate-950 uppercase">
                  {provider.firmName || 'SEC CORPORATE ASSISTANCE PRACTICE'}
                </h1>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {provider.practiceTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1.5 leading-normal">
                  {provider.address}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600 mt-1.5 font-mono">
                  <span>TIN: {provider.tin}</span>
                  <span aria-hidden="true">·</span>
                  <span>{provider.phone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{provider.email}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-display text-base font-bold tracking-tight text-slate-950 uppercase">
                  {headerMeta.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{headerMeta.subtitle}</div>

                <dl className="mt-2.5 space-y-0.5 text-xs">
                  <div className="flex justify-end gap-2">
                    <dt className="text-slate-500">{headerMeta.refLabel}:</dt>
                    <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                      {doc.referenceNo}
                    </dd>
                  </div>
                  <div className="flex justify-end gap-2">
                    <dt className="text-slate-500">{headerMeta.dateLabel}:</dt>
                    <dd className="font-mono text-slate-800 tabular-nums">{doc.issueDate}</dd>
                  </div>
                  {doc.docType !== 'receipt' && (
                    <div className="flex justify-end gap-2">
                      <dt className="text-slate-500">{headerMeta.secondaryDateLabel}:</dt>
                      <dd className="font-mono text-slate-800 tabular-nums">
                        {doc.validUntilOrDueDate}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Client & Transaction Metadata Grid */}
            <div className="grid grid-cols-12 gap-5 py-4 border-b border-slate-200">
              <div className="col-span-7 space-y-1">
                <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                  {doc.docType === 'quotation'
                    ? 'Prepared For'
                    : doc.docType === 'billing'
                      ? 'Billed To'
                      : doc.docType === 'invoice'
                        ? 'Sold To (Client Corporation)'
                        : 'Received From'}
                </div>
                <div className="font-display text-sm font-bold text-slate-950">
                  {doc.client.companyName}
                </div>
                <div className="text-xs text-slate-600 leading-snug">{doc.client.address}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-slate-600">
                  <span>
                    <strong className="font-medium text-slate-800">SEC Reg. No.:</strong>{' '}
                    <span className="font-mono tabular-nums">{doc.client.secRegNo || 'N/A'}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    <strong className="font-medium text-slate-800">TIN:</strong>{' '}
                    <span className="font-mono tabular-nums">{doc.client.tin || 'N/A'}</span>
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <strong className="font-medium text-slate-800">Attention:</strong>{' '}
                  {doc.client.attentionTo}
                  {doc.client.designation ? ` — ${doc.client.designation}` : ''}
                </div>
              </div>

              <div className="col-span-5 border-l border-slate-200 pl-4 space-y-1">
                <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">
                  SEC Philippines Transaction Scope
                </div>
                <div className="font-display text-xs font-bold text-slate-900 leading-snug">
                  {doc.transactionTitle}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Filing Track:</span>{' '}
                  {doc.secPortalSystem}
                </div>
                {doc.docType === 'quotation' && doc.processingTimeline && (
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Est. Turnaround:</span>{' '}
                    {doc.processingTimeline}
                  </div>
                )}
                {doc.docType === 'billing' && doc.taxConfig.applyTrancheSplit && (
                  <div className="text-xs text-slate-700 font-medium pt-0.5">
                    Billing Milestone: {doc.taxConfig.trancheDescription}
                  </div>
                )}
              </div>
            </div>

            {/* Special Formal Acknowledgement Block when Document Type is Receipt */}
            {doc.docType === 'receipt' && (
              <div className="my-4 p-4 bg-slate-50 border border-slate-200">
                <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Official Payment Certification
                </div>
                <p className="text-[12.5px] text-slate-800 leading-relaxed">
                  RECEIVED from{' '}
                  <strong className="font-semibold text-slate-950">{doc.client.companyName}</strong>{' '}
                  (TIN: <span className="font-mono tabular-nums">{doc.client.tin || 'N/A'}</span>),
                  with principal office at {doc.client.address}, the sum of{' '}
                  <strong className="font-semibold text-slate-950 underline decoration-slate-400 underline-offset-4">
                    {amountInWords}
                  </strong>{' '}
                  (
                  <strong className="font-mono font-bold text-slate-950 tabular-nums">
                    {formatPHP(effectiveAmountReceived)}
                  </strong>
                  ), Philippine Currency, representing payment for{' '}
                  <strong className="font-semibold text-slate-900">
                    {doc.receiptDetails.paymentPurpose || doc.transactionTitle}
                  </strong>
                  .
                </p>

                <div className="grid grid-cols-4 gap-3 mt-3 pt-2.5 border-t border-slate-200 text-xs">
                  <div>
                    <div className="text-slate-500">Payment Mode</div>
                    <div className="font-medium text-slate-900 mt-0.5">
                      {doc.receiptDetails.paymentMethod}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Bank / Channel</div>
                    <div className="font-medium text-slate-900 mt-0.5">
                      {doc.receiptDetails.issuingBank || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Ref / Check No.</div>
                    <div className="font-mono font-medium text-slate-900 mt-0.5 tabular-nums">
                      {doc.receiptDetails.referenceNo || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Date Credited</div>
                    <div className="font-mono font-medium text-slate-900 mt-0.5 tabular-nums">
                      {doc.receiptDetails.paymentDate || doc.issueDate}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scope Description (Shown on Quotation & Billing) */}
            {(doc.docType === 'quotation' || doc.docType === 'billing') && doc.scopeSummary && (
              <div className="py-3.5 border-b border-slate-200">
                <div className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Scope of SEC Corporate Assistance
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{doc.scopeSummary}</p>
              </div>
            )}

            {/* Line Items Table */}
            <div className="mt-4">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-y border-slate-900 bg-slate-50 text-[10.5px] font-semibold uppercase tracking-wider text-slate-700">
                    <th className="py-2 pl-2.5 pr-2 w-9">#</th>
                    <th className="py-2 px-2">Particulars & Description of SEC Transaction</th>
                    <th className="py-2 px-2 w-40">Fee Classification</th>
                    <th className="py-2 px-2 text-right w-12">Qty</th>
                    <th className="py-2 px-2 text-right w-28">Unit Amount</th>
                    <th className="py-2 pl-2 pr-2.5 text-right w-32">Line Total (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {/* Section I: Professional Assistance Fees */}
                  {profItems.length > 0 && (
                    <>
                      <tr className="bg-slate-50/70">
                        <td
                          colSpan={6}
                          className="py-1.5 px-2.5 text-[11px] font-semibold text-slate-800"
                        >
                          I. Professional & Corporate Secretarial Assistance Fees
                        </td>
                      </tr>
                      {profItems.map((item, idx) => {
                        const lineTotal = item.quantity * item.unitPrice;
                        return (
                          <tr key={item.id} className="align-top">
                            <td className="py-2 pl-2.5 pr-2 font-mono text-slate-500 tabular-nums">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-semibold text-slate-900">{item.description}</div>
                              {item.subtext && (
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {item.subtext}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-slate-600">
                              {CATEGORY_LABELS[item.category]}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700 tabular-nums">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700 tabular-nums">
                              {formatPHP(item.unitPrice)}
                            </td>
                            <td className="py-2 pl-2 pr-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                              {formatPHP(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}

                  {/* Section II: Statutory SEC & BIR Reimbursable Fees */}
                  {reimbursableItems.length > 0 && (
                    <>
                      <tr className="bg-slate-50/70">
                        <td
                          colSpan={6}
                          className="py-1.5 px-2.5 text-[11px] font-semibold text-slate-800"
                        >
                          II. Statutory SEC Filing Fees, BIR Documentary Stamp Tax & Out-of-Pocket
                          Disbursements
                        </td>
                      </tr>
                      {reimbursableItems.map((item, idx) => {
                        const lineTotal = item.quantity * item.unitPrice;
                        return (
                          <tr key={item.id} className="align-top">
                            <td className="py-2 pl-2.5 pr-2 font-mono text-slate-500 tabular-nums">
                              {String(profItems.length + idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2 px-2">
                              <div className="font-medium text-slate-900">{item.description}</div>
                              {item.subtext && (
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {item.subtext}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-slate-600">
                              {CATEGORY_LABELS[item.category]}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700 tabular-nums">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700 tabular-nums">
                              {formatPHP(item.unitPrice)}
                            </td>
                            <td className="py-2 pl-2 pr-2.5 text-right font-mono font-medium text-slate-900 tabular-nums">
                              {formatPHP(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Computation & Totals Summary Block */}
            <div className="mt-4 pt-3.5 border-t border-slate-900 grid grid-cols-12 gap-5">
              {/* Left column: Payment Instructions or Tax Notes */}
              <div className="col-span-6 space-y-2 text-xs">
                {doc.docType !== 'receipt' ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider">
                      Bank Remittance & Settlement Details
                    </div>
                    <div className="text-slate-800">
                      <span className="text-slate-500">Bank:</span>{' '}
                      <strong>{provider.bankName}</strong>
                    </div>
                    <div className="text-slate-800">
                      <span className="text-slate-500">Account Name:</span>{' '}
                      <strong>{provider.bankAccountName}</strong>
                    </div>
                    <div className="text-slate-800 font-mono tabular-nums">
                      <span className="font-sans text-slate-500">Account No.:</span>{' '}
                      <strong>{provider.bankAccountNo}</strong>
                    </div>
                    {provider.altPaymentInfo && (
                      <div className="text-[10.5px] text-slate-600 pt-1 border-t border-slate-200/80 mt-1">
                        {provider.altPaymentInfo}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider">
                      Account Statement Ledger
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Total Engagement Contract Price:</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatPHP(effectiveContractTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Less: Prior Payments Credited:</span>
                      <span className="font-mono tabular-nums">({formatPHP(previousPaid)})</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-semibold">
                      <span>Less: Amount Paid Under This Receipt:</span>
                      <span className="font-mono tabular-nums">
                        ({formatPHP(effectiveAmountReceived)})
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-slate-950">
                      <span>Remaining Account Balance:</span>
                      <span className="font-mono tabular-nums">
                        {formatPHP(remainingAfterReceipt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Financial & Tax Breakdown */}
              <div className="col-span-6 space-y-1 text-xs">
                <div className="flex justify-between py-0.5 text-slate-700">
                  <span>Professional / Assistance Fees (Net of VAT):</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    {formatPHP(totals.profFeeNetOfVat)}
                  </span>
                </div>

                {doc.taxConfig.taxMode !== 'non_vat' && (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>Add: 12% Value-Added Tax (VAT):</span>
                    <span className="font-mono tabular-nums">{formatPHP(totals.vatAmount)}</span>
                  </div>
                )}

                {doc.taxConfig.ewtRate > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-600">
                    <span>
                      Less: {doc.taxConfig.ewtRate}% Expanded Withholding Tax (BIR 2307):
                    </span>
                    <span className="font-mono text-rose-700 tabular-nums">
                      ({formatPHP(totals.ewtAmount)})
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-t border-slate-200 font-medium text-slate-800">
                  <span>Net Professional Fee Receivable:</span>
                  <span className="font-mono tabular-nums">
                    {formatPHP(totals.profFeeNetReceivable)}
                  </span>
                </div>

                <div className="flex justify-between py-0.5 text-slate-700">
                  <span>SEC Statutory Filing Fees & LRF:</span>
                  <span className="font-mono tabular-nums">
                    {formatPHP(totals.secStatutoryTotal)}
                  </span>
                </div>

                {totals.birTaxDstTotal > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span>BIR Documentary Stamp Tax (DST):</span>
                    <span className="font-mono tabular-nums">
                      {formatPHP(totals.birTaxDstTotal)}
                    </span>
                  </div>
                )}

                {totals.outOfPocketTotal > 0 && (
                  <div className="flex justify-between py-0.5 text-slate-700">
                    <span>Notarial, Publication & Out-of-Pocket Costs:</span>
                    <span className="font-mono tabular-nums">
                      {formatPHP(totals.outOfPocketTotal)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-t-2 border-slate-900 text-sm font-bold text-slate-950">
                  <span>
                    {doc.docType === 'quotation'
                      ? 'TOTAL ESTIMATED INVESTMENT:'
                      : doc.docType === 'receipt'
                        ? 'TOTAL ENGAGEMENT ASSESSMENT:'
                        : 'TOTAL CONTRACT PAYABLE:'}
                  </span>
                  <span className="font-mono tabular-nums">{formatPHP(totals.fullNetPayable)}</span>
                </div>

                {/* Tranche / Milestone Split Box */}
                {doc.taxConfig.applyTrancheSplit && doc.docType !== 'receipt' && (
                  <div className="mt-1.5 p-2.5 bg-slate-900 text-white space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>
                        Assistance Fee Tranche ({doc.taxConfig.profFeeBillingPercent}%):
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatPHP(totals.trancheProfFeePayable)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>
                        Statutory & Out-of-Pocket Advance ({doc.taxConfig.statutoryBillingPercent}%):
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatPHP(totals.trancheReimbursablesPayable)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-700 text-xs font-bold">
                      <span>AMOUNT DUE THIS TRANCHE:</span>
                      <span className="font-mono text-sm tabular-nums">
                        {formatPHP(totals.trancheTotalDueNow)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Balance Upon SEC Approval:</span>
                      <span className="font-mono tabular-nums">
                        {formatPHP(totals.remainingBalanceAfterTranche)}
                      </span>
                    </div>
                  </div>
                )}

                {doc.docType === 'receipt' && (
                  <div className="mt-1.5 p-2.5 bg-slate-900 text-white flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Amount Received (PHP):
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums">
                      {formatPHP(effectiveAmountReceived)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Documentary Requirements Checklist (For Quotations) */}
            {doc.docType === 'quotation' && doc.requirementsChecklist.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  SEC Documentary Requirements & Client Deliverables Checklist
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-[11.5px] text-slate-700">
                  {doc.requirementsChecklist.map((req, index) => (
                    <li key={index} className="leading-snug">
                      <span className="text-slate-700">{req}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Terms, Conditions & Regulatory Notes */}
            {doc.notesAndTerms.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-slate-200">
                <div className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {doc.docType === 'quotation'
                    ? 'Engagement Terms & Statutory Notes'
                    : doc.docType === 'invoice'
                      ? 'Tax & Invoicing Notes'
                      : 'Important Remarks'}
                </div>
                <ul className="space-y-0.5 text-[11px] text-slate-600 list-disc list-inside">
                  {doc.notesAndTerms.map((note, idx) => (
                    <li key={idx} className="leading-normal">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signatory Footer */}
            <div className="mt-8 pt-5 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
              <div>
                <div className="text-[10.5px] text-slate-500 uppercase tracking-wider mb-6">
                  {doc.docType === 'receipt'
                    ? 'Payment Received & Acknowledged By:'
                    : doc.docType === 'quotation'
                      ? 'Prepared & Submitted By:'
                      : 'Certified Correct & Approved By:'}
                </div>
                <div className="border-b border-slate-900 w-64 pb-1 font-display font-bold text-slate-950 uppercase">
                  {provider.signatoryName}
                </div>
                <div className="text-slate-600 mt-1">{provider.signatoryTitle}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {provider.accreditationNo}
                </div>
              </div>

              <div>
                {doc.docType === 'quotation' ? (
                  <>
                    <div className="text-[10.5px] text-slate-500 uppercase tracking-wider mb-6">
                      Conforme (Client Acceptance & Authorization to Proceed):
                    </div>
                    <div className="border-b border-slate-900 w-64 pb-1 font-display font-bold text-slate-950 uppercase">
                      {doc.client.attentionTo || 'AUTHORIZED REPRESENTATIVE'}
                    </div>
                    <div className="text-slate-600 mt-1">
                      {doc.client.designation ? `${doc.client.designation} · ` : ''}
                      {doc.client.companyName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Date Signed: _______________________
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[10.5px] text-slate-500 uppercase tracking-wider mb-6">
                      {doc.docType === 'receipt'
                        ? 'Client Copy Received By:'
                        : 'Prepared & Verified By:'}
                    </div>
                    <div className="border-b border-slate-400 w-64 pb-1 font-display font-semibold text-slate-900 uppercase">
                      {doc.docType === 'receipt'
                        ? doc.client.attentionTo || 'CLIENT REPRESENTATIVE'
                        : provider.preparedByName}
                    </div>
                    <div className="text-slate-600 mt-1">
                      {doc.docType === 'receipt'
                        ? doc.client.companyName
                        : provider.preparedByTitle}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
