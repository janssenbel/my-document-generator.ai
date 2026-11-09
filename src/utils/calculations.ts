import { SECDocument } from '../types/document';

export interface DocumentTotals {
  profFeeGross: number;
  profFeeNetOfVat: number;
  vatAmount: number;
  ewtAmount: number;
  profFeeNetReceivable: number;
  secStatutoryTotal: number;
  birTaxDstTotal: number;
  outOfPocketTotal: number;
  totalReimbursables: number;
  fullGrossContract: number;
  fullNetPayable: number;
  // Tranche-adjusted figures (for Billing Statements / partial tranches)
  trancheProfFeePayable: number;
  trancheReimbursablesPayable: number;
  trancheTotalDueNow: number;
  remainingBalanceAfterTranche: number;
}

export function calculateDocumentTotals(doc: SECDocument): DocumentTotals {
  let profFeeRaw = 0;
  let secStatutoryTotal = 0;
  let birTaxDstTotal = 0;
  let outOfPocketTotal = 0;

  for (const item of doc.lineItems) {
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    if (item.category === 'professional_fee') {
      profFeeRaw += lineTotal;
    } else if (item.category === 'sec_statutory_fee') {
      secStatutoryTotal += lineTotal;
    } else if (item.category === 'bir_tax_dst') {
      birTaxDstTotal += lineTotal;
    } else {
      outOfPocketTotal += lineTotal;
    }
  }

  const totalReimbursables = secStatutoryTotal + birTaxDstTotal + outOfPocketTotal;

  let profFeeNetOfVat = profFeeRaw;
  let vatAmount = 0;
  let profFeeGross = profFeeRaw;

  if (doc.taxConfig.taxMode === 'vat_exclusive') {
    profFeeNetOfVat = profFeeRaw;
    vatAmount = profFeeRaw * 0.12;
    profFeeGross = profFeeNetOfVat + vatAmount;
  } else if (doc.taxConfig.taxMode === 'vat_inclusive') {
    profFeeGross = profFeeRaw;
    profFeeNetOfVat = profFeeRaw / 1.12;
    vatAmount = profFeeGross - profFeeNetOfVat;
  }

  const ewtRateDecimal = (doc.taxConfig.ewtRate || 0) / 100;
  const ewtAmount = profFeeNetOfVat * ewtRateDecimal;
  const profFeeNetReceivable = profFeeGross - ewtAmount;

  const fullGrossContract = profFeeGross + totalReimbursables;
  const fullNetPayable = profFeeNetReceivable + totalReimbursables;

  const profPercent = doc.taxConfig.applyTrancheSplit
    ? Math.min(100, Math.max(0, Number(doc.taxConfig.profFeeBillingPercent) || 0)) / 100
    : 1;
  const statPercent = doc.taxConfig.applyTrancheSplit
    ? Math.min(100, Math.max(0, Number(doc.taxConfig.statutoryBillingPercent) || 0)) / 100
    : 1;

  const trancheProfFeePayable = profFeeNetReceivable * profPercent;
  const trancheReimbursablesPayable = totalReimbursables * statPercent;
  const trancheTotalDueNow = trancheProfFeePayable + trancheReimbursablesPayable;
  const remainingBalanceAfterTranche = Math.max(0, fullNetPayable - trancheTotalDueNow);

  return {
    profFeeGross,
    profFeeNetOfVat,
    vatAmount,
    ewtAmount,
    profFeeNetReceivable,
    secStatutoryTotal,
    birTaxDstTotal,
    outOfPocketTotal,
    totalReimbursables,
    fullGrossContract,
    fullNetPayable,
    trancheProfFeePayable,
    trancheReimbursablesPayable,
    trancheTotalDueNow,
    remainingBalanceAfterTranche,
  };
}

export interface SECCapitalCalculationResult {
  authorizedCapitalOrIncrease: number;
  subscribedCapital: number;
  paidUpCapital: number;
  aoiFilingFee: number;
  bylawsOrAmendedFee: number;
  stbFee: number;
  nameReservationFee: number;
  totalSecFilingFee: number;
  lrfFee: number;
  birDstFee: number;
  totalStatutoryEstimate: number;
}

/**
 * Computes official Philippine SEC Filing Fee (1/5 of 1% of ACS or Increase),
 * 1% UP Law Center Legal Research Fee (LRF), and BIR Documentary Stamp Tax (1% of Subscribed Capital)
 */
export function computeSECCapitalFees(
  mode: 'registration' | 'increase_acs',
  authorizedCapitalOrIncrease: number,
  subscribedCapital: number,
  paidUpCapital: number
): SECCapitalCalculationResult {
  const acs = Math.max(0, authorizedCapitalOrIncrease);
  const sub = Math.max(0, subscribedCapital);
  const paid = Math.max(0, paidUpCapital);

  if (mode === 'registration') {
    // SEC Schedule: 1/5 of 1% (0.002) of Authorized Capital Stock or subscription price, minimum PHP 2,000
    const aoiFilingFee = Math.max(2000, Math.round(acs * 0.002));
    const bylawsOrAmendedFee = 1000; // Standard By-Laws filing fee
    const stbFee = 470; // Stock and Transfer Book registration
    const nameReservationFee = 100;
    const totalSecFilingFee = aoiFilingFee + bylawsOrAmendedFee + stbFee + nameReservationFee;
    // LRF is 1% of Filing Fees (excluding STB/Name reservation or applied on AOI+BL, min PHP 20)
    const lrfFee = Math.max(20, Math.ceil((aoiFilingFee + bylawsOrAmendedFee) * 0.01));
    // BIR DST under Sec. 174 NIRC: PHP 2.00 for every PHP 200 (1%) of Subscribed Capital + PHP 30 loose stamp
    const birDstFee = Math.ceil(sub * 0.01) + 30;

    return {
      authorizedCapitalOrIncrease: acs,
      subscribedCapital: sub,
      paidUpCapital: paid,
      aoiFilingFee,
      bylawsOrAmendedFee,
      stbFee,
      nameReservationFee,
      totalSecFilingFee,
      lrfFee,
      birDstFee,
      totalStatutoryEstimate: totalSecFilingFee + lrfFee + birDstFee,
    };
  } else {
    // Increase of ACS: 1/5 of 1% (0.002) of the Increase in ACS, minimum PHP 3,000 + PHP 2,000 Amended AOI
    const aoiFilingFee = Math.max(3000, Math.round(acs * 0.002));
    const bylawsOrAmendedFee = 2000; // Amended Articles of Incorporation fee
    const stbFee = 0;
    const nameReservationFee = 0;
    const totalSecFilingFee = aoiFilingFee + bylawsOrAmendedFee;
    const lrfFee = Math.max(20, Math.ceil(totalSecFilingFee * 0.01));
    const birDstFee = Math.ceil(sub * 0.01) + 30;

    return {
      authorizedCapitalOrIncrease: acs,
      subscribedCapital: sub,
      paidUpCapital: paid,
      aoiFilingFee,
      bylawsOrAmendedFee,
      stbFee,
      nameReservationFee,
      totalSecFilingFee,
      lrfFee,
      birDstFee,
      totalStatutoryEstimate: totalSecFilingFee + lrfFee + birDstFee,
    };
  }
}
