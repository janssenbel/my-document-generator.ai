export type DocumentType = 'quotation' | 'billing' | 'invoice' | 'receipt';

export type SECTransactionCategory =
  | 'registration'
  | 'amendment'
  | 'increase_acs'
  | 'dissolution'
  | 'compliance_gis_afs'
  | 'foreign_license'
  | 'stock_transfer'
  | 'custom';

export type LineItemCategory =
  | 'professional_fee'
  | 'sec_statutory_fee'
  | 'bir_tax_dst'
  | 'out_of_pocket';

export interface LineItem {
  id: string;
  description: string;
  subtext?: string;
  category: LineItemCategory;
  quantity: number;
  unitPrice: number;
}

export interface ProviderProfile {
  firmName: string;
  practiceTitle: string;
  tin: string;
  accreditationNo: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNo: string;
  altPaymentInfo: string;
  signatoryName: string;
  signatoryTitle: string;
  preparedByName: string;
  preparedByTitle: string;
}

export interface ClientDetails {
  companyName: string;
  secRegNo: string;
  tin: string;
  address: string;
  attentionTo: string;
  designation: string;
  email: string;
}

export interface TaxConfig {
  taxMode: 'non_vat' | 'vat_exclusive' | 'vat_inclusive';
  ewtRate: 0 | 2 | 5 | 10 | 15;
  applyTrancheSplit: boolean;
  profFeeBillingPercent: number; // e.g. 50 for 50% downpayment, 100 for full
  statutoryBillingPercent: number; // usually 100% upfront for SEC filing fees
  trancheDescription: string;
}

export interface ReceiptDetails {
  paymentMethod: 'Bank Transfer / PESONet / InstaPay' | 'Corporate / Manager\'s Check' | 'Cash' | 'Digital Wallet (GCash / Maya)';
  issuingBank: string;
  referenceNo: string;
  paymentDate: string;
  paymentPurpose: string;
  totalContractPrice: number;
  previousPayments: number;
  amountReceived: number;
  overrideAutoAmount: boolean;
}

export interface SECDocument {
  id: string;
  docType: DocumentType;
  referenceNo: string;
  issueDate: string;
  validUntilOrDueDate: string;
  secCategory: SECTransactionCategory;
  transactionTitle: string;
  secPortalSystem: string; // e.g. "SEC eSPARC / OneSEC", "SEC eAMEND", "SEC eFAST"
  processingTimeline: string;
  scopeSummary: string;
  client: ClientDetails;
  lineItems: LineItem[];
  requirementsChecklist: string[];
  notesAndTerms: string[];
  taxConfig: TaxConfig;
  receiptDetails: ReceiptDetails;
  updatedAt: string;
}
