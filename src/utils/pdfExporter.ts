import { jsPDF } from 'jspdf';
import { amountToWordsPHP } from '../data/secPresets';
import { LineItemCategory, ProviderProfile, SECDocument } from '../types/document';
import { calculateDocumentTotals } from './calculations';

/**
 * Sanitizes Unicode characters (like smart quotes, em-dashes, bullets, Peso sign)
 * into clean WinAnsi-safe ASCII for standard PDF vector fonts.
 */
function cleanPdfText(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/₱/g, 'PHP ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/[•·]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function formatPdfCurrency(amount: number): string {
  const num = Number.isFinite(amount) ? amount : 0;
  return (
    'PHP ' +
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  );
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

const CATEGORY_SHORT_LABELS: Record<LineItemCategory, string> = {
  professional_fee: 'Assistance Fee',
  sec_statutory_fee: 'SEC Statutory / LRF',
  bir_tax_dst: 'BIR Doc. Stamp Tax',
  out_of_pocket: 'Out-of-Pocket',
};

export interface GeneratedPdfArtifact {
  blob: Blob;
  blobUrl: string;
  filename: string;
}

/**
 * Generates a vector A4 portrait (210mm x 297mm) PDF for any SEC Document.
 */
export function buildA4VectorPdf(doc: SECDocument, provider: ProviderProfile): GeneratedPdfArtifact {
  // Default format is explicitly A4 portrait (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = 210;
  const pageH = 297;
  const marginX = 14;
  const contentW = pageW - marginX * 2; // 182mm
  let y = 15;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageH - 16) {
      pdf.addPage('a4', 'portrait');
      y = 15;
    }
  };

  const totals = calculateDocumentTotals(doc);
  const headerMeta = DOC_TYPE_HEADERS[doc.docType];

  // 1. TOP LETTERHEAD
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  pdf.setTextColor(15, 23, 42);
  const firmLines = pdf.splitTextToSize(
    cleanPdfText(provider.firmName || 'SEC CORPORATE ASSISTANCE PRACTICE').toUpperCase(),
    105
  );
  pdf.text(firmLines, marginX, y);

  // Right side Document Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(cleanPdfText(headerMeta.title), pageW - marginX, y, { align: 'right' });

  const leftAfterTitleY = y + firmLines.length * 4.5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(cleanPdfText(provider.practiceTitle), marginX, leftAfterTitleY);

  pdf.setFontSize(8);
  pdf.text(cleanPdfText(headerMeta.subtitle), pageW - marginX, y + 4.5, { align: 'right' });

  // Address & Contact on left
  const addrLines = pdf.splitTextToSize(cleanPdfText(provider.address), 102);
  pdf.text(addrLines, marginX, leftAfterTitleY + 4.2);
  const contactY = leftAfterTitleY + 4.2 + addrLines.length * 3.6;
  pdf.text(
    cleanPdfText(`TIN: ${provider.tin}  |  ${provider.phone}`),
    marginX,
    contactY
  );
  pdf.text(cleanPdfText(provider.email), marginX, contactY + 3.6);

  // Ref No & Dates on right
  let rightMetaY = y + 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${headerMeta.refLabel}: ${cleanPdfText(doc.referenceNo)}`, pageW - marginX, rightMetaY, {
    align: 'right',
  });
  rightMetaY += 4.2;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  pdf.text(`${headerMeta.dateLabel}: ${cleanPdfText(doc.issueDate)}`, pageW - marginX, rightMetaY, {
    align: 'right',
  });
  if (doc.docType !== 'receipt') {
    rightMetaY += 4.2;
    pdf.text(
      `${headerMeta.secondaryDateLabel}: ${cleanPdfText(doc.validUntilOrDueDate)}`,
      pageW - marginX,
      rightMetaY,
      { align: 'right' }
    );
  }

  y = Math.max(contactY + 7, rightMetaY + 5);

  // Thick Header Divider
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.5);
  pdf.line(marginX, y, pageW - marginX, y);
  y += 5;

  // 2. CLIENT & TRANSACTION METADATA BLOCK (2 Columns)
  const clientLabel =
    doc.docType === 'quotation'
      ? 'PREPARED FOR'
      : doc.docType === 'billing'
        ? 'BILLED TO'
        : doc.docType === 'invoice'
          ? 'SOLD TO (CLIENT CORPORATION)'
          : 'RECEIVED FROM';

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(clientLabel, marginX, y);
  pdf.text('SEC PHILIPPINES TRANSACTION SCOPE', marginX + 104, y);
  y += 4;

  // Left: Client Details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  const clientNameLines = pdf.splitTextToSize(cleanPdfText(doc.client.companyName), 98);
  pdf.text(clientNameLines, marginX, y);
  let leftClientY = y + clientNameLines.length * 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  const clientAddrLines = pdf.splitTextToSize(cleanPdfText(doc.client.address), 98);
  pdf.text(clientAddrLines, marginX, leftClientY);
  leftClientY += clientAddrLines.length * 3.6 + 1;

  pdf.setTextColor(30, 41, 59);
  pdf.text(
    cleanPdfText(`SEC Reg. No.: ${doc.client.secRegNo || 'N/A'}   |   TIN: ${doc.client.tin || 'N/A'}`),
    marginX,
    leftClientY
  );
  leftClientY += 3.8;
  pdf.text(
    cleanPdfText(
      `Attention: ${doc.client.attentionTo}${doc.client.designation ? ' - ' + doc.client.designation : ''}`
    ),
    marginX,
    leftClientY
  );

  // Right: SEC Transaction Scope
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.8);
  pdf.setTextColor(15, 23, 42);
  const txTitleLines = pdf.splitTextToSize(cleanPdfText(doc.transactionTitle), 76);
  pdf.text(txTitleLines, marginX + 104, y);
  let rightScopeY = y + txTitleLines.length * 3.8 + 0.8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(cleanPdfText(`Filing Track: ${doc.secPortalSystem}`), marginX + 104, rightScopeY);
  rightScopeY += 3.8;
  if (doc.docType === 'quotation' && doc.processingTimeline) {
    const timelineLines = pdf.splitTextToSize(
      cleanPdfText(`Est. Turnaround: ${doc.processingTimeline}`),
      76
    );
    pdf.text(timelineLines, marginX + 104, rightScopeY);
    rightScopeY += timelineLines.length * 3.6;
  }

  y = Math.max(leftClientY, rightScopeY) + 4.5;
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.25);
  pdf.line(marginX, y, pageW - marginX, y);
  y += 4.5;

  // 3. IF ACKNOWLEDGEMENT RECEIPT: FORMAL CERTIFICATION BOX
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

  if (doc.docType === 'receipt') {
    const certText = cleanPdfText(
      `RECEIVED from ${doc.client.companyName} (TIN: ${doc.client.tin || 'N/A'}), with principal office at ${doc.client.address}, the sum of ${amountInWords} (${formatPdfCurrency(effectiveAmountReceived)}), Philippine Currency, representing payment for ${doc.receiptDetails.paymentPurpose || doc.transactionTitle}.`
    );
    const certLines = pdf.splitTextToSize(certText, contentW - 8);
    const boxH = certLines.length * 4 + 17;

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(marginX, y, contentW, boxH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('OFFICIAL PAYMENT CERTIFICATION', marginX + 4, y + 4.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(certLines, marginX + 4, y + 9);

    const metaRowY = y + 9 + certLines.length * 4 + 2;
    pdf.setFontSize(7.8);
    pdf.setTextColor(51, 65, 85);
    pdf.text(
      cleanPdfText(
        `Mode: ${doc.receiptDetails.paymentMethod}   |   Bank/Channel: ${doc.receiptDetails.issuingBank || '-'}   |   Ref: ${doc.receiptDetails.referenceNo || '-'}   |   Date: ${doc.receiptDetails.paymentDate || doc.issueDate}`
      ),
      marginX + 4,
      metaRowY
    );

    y += boxH + 5;
  }

  // 4. SCOPE SUMMARY (FOR QUOTATION & BILLING)
  if ((doc.docType === 'quotation' || doc.docType === 'billing') && doc.scopeSummary) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text('SCOPE OF SEC CORPORATE ASSISTANCE', marginX, y);
    y += 3.8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.setTextColor(51, 65, 85);
    const scopeLines = pdf.splitTextToSize(cleanPdfText(doc.scopeSummary), contentW);
    pdf.text(scopeLines, marginX, y);
    y += scopeLines.length * 3.6 + 3.5;
  }

  // 5. ITEMIZED FEE SCHEDULE TABLE
  // Columns: # (8mm), Description (88mm), Category (32mm), Qty (10mm), Unit (22mm), Total (22mm) = 182mm
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.35);
  pdf.rect(marginX, y, contentW, 6.5, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('#', marginX + 2, y + 4.3);
  pdf.text('PARTICULARS & DESCRIPTION OF SEC TRANSACTION', marginX + 9, y + 4.3);
  pdf.text('CLASSIFICATION', marginX + 99, y + 4.3);
  pdf.text('QTY', marginX + 138, y + 4.3, { align: 'right' });
  pdf.text('UNIT AMOUNT', marginX + 159, y + 4.3, { align: 'right' });
  pdf.text('LINE TOTAL', pageW - marginX - 1.5, y + 4.3, { align: 'right' });
  y += 6.5;

  const profItems = doc.lineItems.filter((i) => i.category === 'professional_fee');
  const reimbursableItems = doc.lineItems.filter((i) => i.category !== 'professional_fee');

  const renderSectionGroup = (headerTitle: string, items: typeof doc.lineItems, startIndex: number) => {
    if (items.length === 0) return;
    checkPageBreak(10);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(marginX, y, contentW, 5.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(cleanPdfText(headerTitle), marginX + 2, y + 3.8);
    y += 5.5;

    items.forEach((item, idx) => {
      const descLines = pdf.splitTextToSize(cleanPdfText(item.description), 87);
      const subLines = item.subtext
        ? pdf.splitTextToSize(cleanPdfText(item.subtext), 87)
        : [];
      const rowH = Math.max(6.5, descLines.length * 3.7 + subLines.length * 3.3 + 2.8);
      checkPageBreak(rowH + 2);

      const rowStartY = y + 3.8;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(String(startIndex + idx + 1).padStart(2, '0'), marginX + 2, rowStartY);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.2);
      pdf.setTextColor(15, 23, 42);
      pdf.text(descLines, marginX + 9, rowStartY);

      if (subLines.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.3);
        pdf.setTextColor(100, 116, 139);
        pdf.text(subLines, marginX + 9, rowStartY + descLines.length * 3.7);
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(cleanPdfText(CATEGORY_SHORT_LABELS[item.category]), marginX + 99, rowStartY);

      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      pdf.text(String(item.quantity), marginX + 138, rowStartY, { align: 'right' });
      pdf.text(formatPdfCurrency(item.unitPrice), marginX + 159, rowStartY, { align: 'right' });

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(formatPdfCurrency(item.quantity * item.unitPrice), pageW - marginX - 1.5, rowStartY, {
        align: 'right',
      });

      y += rowH;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.2);
      pdf.line(marginX, y, pageW - marginX, y);
    });
  };

  renderSectionGroup(
    'I. Professional & Corporate Secretarial Assistance Fees',
    profItems,
    0
  );
  renderSectionGroup(
    'II. Statutory SEC Filing Fees, BIR Documentary Stamp Tax & Out-of-Pocket Disbursements',
    reimbursableItems,
    profItems.length
  );

  y += 4;
  checkPageBreak(42);

  // 6. BANK REMITTANCE / LEDGER (LEFT) & FINANCIAL SUMMARY (RIGHT)
  const summaryStartY = y;

  // Left Box: Bank Remittance or Receipt Ledger
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(marginX, summaryStartY, 88, 28, 'FD');

  if (doc.docType !== 'receipt') {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text('BANK REMITTANCE & SETTLEMENT DETAILS', marginX + 3, summaryStartY + 4.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(cleanPdfText(`Bank: ${provider.bankName}`), marginX + 3, summaryStartY + 9);
    pdf.text(cleanPdfText(`Account Name: ${provider.bankAccountName}`), marginX + 3, summaryStartY + 13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(cleanPdfText(`Account No.: ${provider.bankAccountNo}`), marginX + 3, summaryStartY + 17);

    if (provider.altPaymentInfo) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      const altLines = pdf.splitTextToSize(cleanPdfText(provider.altPaymentInfo), 82);
      pdf.text(altLines, marginX + 3, summaryStartY + 21.5);
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text('ACCOUNT STATEMENT LEDGER', marginX + 3, summaryStartY + 4.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Total Engagement Contract:', marginX + 3, summaryStartY + 9.5);
    pdf.text(formatPdfCurrency(effectiveContractTotal), marginX + 85, summaryStartY + 9.5, {
      align: 'right',
    });

    pdf.text('Less: Prior Payments Credited:', marginX + 3, summaryStartY + 14);
    pdf.text(`(${formatPdfCurrency(previousPaid)})`, marginX + 85, summaryStartY + 14, {
      align: 'right',
    });

    pdf.setFont('helvetica', 'bold');
    pdf.text('Less: Paid Under This Receipt:', marginX + 3, summaryStartY + 18.5);
    pdf.text(`(${formatPdfCurrency(effectiveAmountReceived)})`, marginX + 85, summaryStartY + 18.5, {
      align: 'right',
    });

    pdf.text('Remaining Account Balance:', marginX + 3, summaryStartY + 24);
    pdf.text(formatPdfCurrency(remainingAfterReceipt), marginX + 85, summaryStartY + 24, {
      align: 'right',
    });
  }

  // Right Column: Totals Breakdown
  let rightTotY = summaryStartY + 3.5;
  const rightLabelX = marginX + 94;
  const addTotalRow = (label: string, val: string, isBold = false) => {
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setFontSize(isBold ? 8.8 : 7.8);
    pdf.setTextColor(isBold ? 15 : 51, isBold ? 23 : 65, isBold ? 42 : 85);
    pdf.text(cleanPdfText(label), rightLabelX, rightTotY);
    pdf.text(cleanPdfText(val), pageW - marginX, rightTotY, { align: 'right' });
    rightTotY += isBold ? 5 : 4.2;
  };

  addTotalRow('Professional / Assistance Fees (Net):', formatPdfCurrency(totals.profFeeNetOfVat));
  if (doc.taxConfig.taxMode !== 'non_vat') {
    addTotalRow('Add: 12% Value-Added Tax (VAT):', formatPdfCurrency(totals.vatAmount));
  }
  if (doc.taxConfig.ewtRate > 0) {
    addTotalRow(
      `Less: ${doc.taxConfig.ewtRate}% Expanded Withholding Tax:`,
      `(${formatPdfCurrency(totals.ewtAmount)})`
    );
  }
  addTotalRow('Net Professional Fee Receivable:', formatPdfCurrency(totals.profFeeNetReceivable), true);
  addTotalRow('SEC Statutory Filing Fees & LRF:', formatPdfCurrency(totals.secStatutoryTotal));
  if (totals.birTaxDstTotal > 0) {
    addTotalRow('BIR Documentary Stamp Tax (DST):', formatPdfCurrency(totals.birTaxDstTotal));
  }
  if (totals.outOfPocketTotal > 0) {
    addTotalRow('Notarial & Out-of-Pocket Costs:', formatPdfCurrency(totals.outOfPocketTotal));
  }

  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.4);
  pdf.line(rightLabelX, rightTotY - 2, pageW - marginX, rightTotY - 2);
  rightTotY += 2;

  const grandLabel =
    doc.docType === 'quotation'
      ? 'TOTAL ESTIMATED INVESTMENT:'
      : doc.docType === 'receipt'
        ? 'AMOUNT RECEIVED (PHP):'
        : 'TOTAL CONTRACT PAYABLE:';
  const grandValue =
    doc.docType === 'receipt' ? effectiveAmountReceived : totals.fullNetPayable;
  addTotalRow(grandLabel, formatPdfCurrency(grandValue), true);

  if (doc.taxConfig.applyTrancheSplit && doc.docType !== 'receipt') {
    rightTotY += 1;
    addTotalRow(
      `AMOUNT DUE THIS TRANCHE (${doc.taxConfig.profFeeBillingPercent}% Prof + ${doc.taxConfig.statutoryBillingPercent}% SEC):`,
      formatPdfCurrency(totals.trancheTotalDueNow),
      true
    );
    addTotalRow(
      'Balance Upon SEC Approval:',
      formatPdfCurrency(totals.remainingBalanceAfterTranche)
    );
  }

  y = Math.max(summaryStartY + 32, rightTotY + 3);

  // 7. DOCUMENTARY REQUIREMENTS CHECKLIST (IF QUOTATION)
  if (doc.docType === 'quotation' && doc.requirementsChecklist.length > 0) {
    checkPageBreak(22);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(marginX, y, pageW - marginX, y);
    y += 4.5;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text('SEC DOCUMENTARY REQUIREMENTS & CLIENT DELIVERABLES CHECKLIST', marginX, y);
    y += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(51, 65, 85);
    doc.requirementsChecklist.forEach((req, idx) => {
      const reqLines = pdf.splitTextToSize(cleanPdfText(`${idx + 1}. ${req}`), contentW);
      checkPageBreak(reqLines.length * 3.5 + 1.5);
      pdf.text(reqLines, marginX, y);
      y += reqLines.length * 3.5 + 0.8;
    });
    y += 2;
  }

  // 8. ENGAGEMENT TERMS & NOTES
  if (doc.notesAndTerms.length > 0) {
    checkPageBreak(18);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(marginX, y, pageW - marginX, y);
    y += 4.5;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text('ENGAGEMENT TERMS, TAX REMARKS & STATUTORY NOTES', marginX, y);
    y += 4;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    doc.notesAndTerms.forEach((note) => {
      const noteLines = pdf.splitTextToSize(cleanPdfText(`- ${note}`), contentW);
      checkPageBreak(noteLines.length * 3.4 + 1.5);
      pdf.text(noteLines, marginX, y);
      y += noteLines.length * 3.4 + 0.8;
    });
    y += 3;
  }

  // 9. SIGNATORY BLOCK
  checkPageBreak(26);
  y += 4;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(marginX, y, pageW - marginX, y);
  y += 5;

  const sigLeftLabel =
    doc.docType === 'receipt'
      ? 'PAYMENT RECEIVED & ACKNOWLEDGED BY:'
      : doc.docType === 'quotation'
        ? 'PREPARED & SUBMITTED BY:'
        : 'CERTIFIED CORRECT & APPROVED BY:';

  const sigRightLabel =
    doc.docType === 'quotation'
      ? 'CONFORME (CLIENT ACCEPTANCE):'
      : doc.docType === 'receipt'
        ? 'CLIENT COPY RECEIVED BY:'
        : 'PREPARED & VERIFIED BY:';

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.2);
  pdf.setTextColor(100, 116, 139);
  pdf.text(sigLeftLabel, marginX, y);
  pdf.text(sigRightLabel, marginX + 100, y);

  y += 11;
  pdf.setDrawColor(15, 23, 42);
  pdf.line(marginX, y, marginX + 76, y);
  pdf.line(marginX + 100, y, marginX + 176, y);

  y += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(cleanPdfText(provider.signatoryName).toUpperCase(), marginX, y);

  const rightSigName =
    doc.docType === 'quotation' || doc.docType === 'receipt'
      ? doc.client.attentionTo || 'AUTHORIZED REPRESENTATIVE'
      : provider.preparedByName;
  pdf.text(cleanPdfText(rightSigName).toUpperCase(), marginX + 100, y);

  y += 3.8;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(cleanPdfText(provider.signatoryTitle), marginX, y);

  const rightSigRole =
    doc.docType === 'quotation' || doc.docType === 'receipt'
      ? doc.client.companyName
      : provider.preparedByTitle;
  pdf.text(cleanPdfText(rightSigRole), marginX + 100, y);

  const sanitizedRef = doc.referenceNo.replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${sanitizedRef}_A4.pdf`;
  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    blob,
    blobUrl,
    filename,
  };
}

/**
 * Triggers direct download of the A4 PDF file in desktop & mobile Safari/Chrome.
 */
export function triggerPdfFileDownload(artifact: GeneratedPdfArtifact): void {
  const link = document.createElement('a');
  link.href = artifact.blobUrl;
  link.download = artifact.filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 400);
}

/**
 * Invokes iPhone / iPad Safari Native Share Sheet (Save to Files, AirPrint, Mail, Viber)
 * when Web Share API Level 2 is available.
 */
export async function sharePdfFileNative(artifact: GeneratedPdfArtifact): Promise<boolean> {
  try {
    const file = new File([artifact.blob], artifact.filename, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: artifact.filename,
        text: 'SEC Philippines Corporate Assistance Document (A4 PDF)',
      });
      return true;
    }
  } catch {
    // User cancelled or share failed
  }
  return false;
}

/**
 * Prints the rendered A4 sheet using a dedicated hidden same-origin iframe
 * so Safari and iframe-embedded environments print cleanly on A4 paper.
 */
export function triggerSafariIframePrint(elementId = 'a4-printable-sheet'): boolean {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) {
    window.print();
    return false;
  }

  const existingIframe = document.getElementById('sec-safari-print-frame');
  if (existingIframe && existingIframe.parentNode) {
    existingIframe.parentNode.removeChild(existingIframe);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'sec-safari-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (!frameDoc) {
    window.print();
    return false;
  }

  // Copy all stylesheets and inline style blocks from parent document
  let stylesHtml = '';
  const styleNodes = document.querySelectorAll('link[rel="stylesheet"], style');
  styleNodes.forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  frameDoc.open();
  frameDoc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>A4 Print Document</title>
    ${stylesHtml}
    <style>
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .a4-paper-sheet {
        width: 100% !important;
        max-width: none !important;
        min-height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
    </style>
  </head>
  <body>
    ${sourceEl.outerHTML}
  </body>
</html>`);
  frameDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 350);

  return true;
}
