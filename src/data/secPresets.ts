import { LineItem, ProviderProfile, SECDocument, SECTransactionCategory } from '../types/document';

export interface SECPresetTemplate {
  category: SECTransactionCategory;
  shortLabel: string;
  transactionTitle: string;
  secPortalSystem: string;
  processingTimeline: string;
  scopeSummary: string;
  defaultLineItems: Omit<LineItem, 'id'>[];
  requirementsChecklist: string[];
  defaultNotes: Record<'quotation' | 'billing' | 'invoice' | 'receipt', string[]>;
}

export const DEFAULT_PROVIDER_PROFILE: ProviderProfile = {
  appBrandName: 'LexCorp SEC Studio',
  appIconMonogram: 'SEC',
  firmName: 'VANGUARD CORPORATE & SEC ADVISORY SERVICES',
  practiceTitle: 'Corporate Secretarial, SEC Compliance & Regulatory Assistance',
  tin: '418-902-315-000 (Non-VAT)',
  accreditationNo: 'SEC Accredited Corporate Compliance Practitioner',
  address: 'Unit 1408, Tower One, Ayala Triangle, Ayala Avenue, Makati City 1226, Metro Manila',
  email: 'compliance@vanguardsec-ph.com',
  phone: '+63 (02) 8845-2910 / +63 917 820 4419',
  bankName: 'BDO Unibank, Inc. (Ayala Triangle Branch)',
  bankAccountName: 'Vanguard Corporate & SEC Advisory Services',
  bankAccountNo: '0041-8029-4412',
  altPaymentInfo: 'GCash / Maya Business: 0917-820-4419 • Checks payable to: Vanguard Corporate & SEC Advisory Services',
  signatoryName: 'ATTY. MARCO L. VILLANUEVA, CPA',
  signatoryTitle: 'Managing Partner & Corporate Compliance Counsel',
  preparedByName: 'CLARISSE M. DELA CRUZ',
  preparedByTitle: 'Senior SEC Paralegal & Filing Specialist',
};

export const SEC_TRANSACTION_PRESETS: Record<SECTransactionCategory, SECPresetTemplate> = {
  registration: {
    category: 'registration',
    shortLabel: 'Company Registration',
    transactionTitle: 'SEC Registration of Domestic Stock Corporation (eSPARC / OneSEC)',
    secPortalSystem: 'SEC eSPARC & ePAY Portal',
    processingTimeline: '7 to 12 Working Days upon complete signatory execution',
    scopeSummary:
      'End-to-end corporate secretarial assistance for the incorporation of a Domestic Stock Corporation with the Securities and Exchange Commission (SEC), including corporate name reservation, drafting of Articles of Incorporation and By-Laws, eSPARC portal encoding, payment assessment processing, and digital Certificate of Incorporation release.',
    defaultLineItems: [
      {
        description: 'SEC Assistance & Professional Fee — Corporate Registration',
        subtext:
          'Name verification, drafting of Articles of Incorporation (AOI) & By-Laws, eSPARC system encoding, compliance review, and SEC Examiner coordination until issuance of Certificate of Incorporation',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 18000,
      },
      {
        description: 'SEC Corporate Name Reservation Fee',
        subtext: '30-day reservation of proposed corporate name via SEC eSPARC',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 100,
      },
      {
        description: 'SEC Filing Fee — Articles of Incorporation & By-Laws',
        subtext: 'Computed at 1/5 of 1% of Authorized Capital Stock (min. ₱2,000 for AOI + ₱1,000 for By-Laws + ₱470 Stock & Transfer Book registration)',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 3470,
      },
      {
        description: 'SEC Legal Research Fee (LRF — 1% of SEC Filing Fee)',
        subtext: 'Mandatory UP Law Center Legal Research Fund fee under P.D. 1856 (minimum ₱20.00)',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 35,
      },
      {
        description: 'BIR Documentary Stamp Tax (DST) on Original Share Issuance',
        subtext: 'Computed at ₱2.00 for every ₱200.00 (1%) of Subscribed Capital Stock plus ₱30.00 loose documentary stamps',
        category: 'bir_tax_dst',
        quantity: 1,
        unitPrice: 2530,
      },
      {
        description: 'Notarial, Authentication & Hardcopy Dossier Transmittal',
        subtext: 'Notarization of Articles of Incorporation, Treasurer’s Authority, and courier submission of wet-signed originals to SEC',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 2500,
      },
    ],
    requirementsChecklist: [
      'Three (3) proposed Corporate Names in order of priority',
      'Principal Office Address (complete with Street, Barangay, City/Municipality, and ZIP Code)',
      'Primary and Secondary Corporate Purposes & Classification (e.g., Domestic Market Enterprise / Export)',
      'Capital Structure: Authorized Capital Stock (ACS), Subscribed Capital, and Paid-up Capital breakdown',
      'List of Incorporators, Directors, and Corporate Officers (President, Treasurer, Corporate Secretary) with TIN, Nationality, and Residential Address',
      'Copy of Two (2) Valid Government-Issued IDs with three (3) specimen signatures for each Incorporator/Officer',
    ],
    defaultNotes: {
      quotation: [
        'Professional Assistance Fee is billed 50% upon engagement confirmation and 50% upon release of the Digital SEC Certificate of Incorporation.',
        'All SEC Filing Fees, Legal Research Fees (LRF), and BIR Documentary Stamp Taxes (DST) are 100% payable upfront upon issuance of the SEC Payment Assessment Form (PAF).',
        'Statutory fees above are estimated based on an Authorized Capital Stock of ₱1,000,000.00 and Subscribed Capital of ₱250,000.00. Actual SEC assessment applies.',
        'This quotation is valid for thirty (30) calendar days from the date of issue.',
      ],
      billing: [
        'Please remit 100% of the SEC Statutory Filing Fees and the agreed tranche of the Assistance Fee to initiate eSPARC Payment Assessment settlement.',
        'Kindly send a copy of the validated bank deposit slip or InstaPay/PESONet confirmation together with BIR Form 2307 (if withholding tax is deducted on the Assistance Fee).',
      ],
      invoice: [
        'Expanded Withholding Tax (EWT), if applicable, shall be computed strictly on the Professional / Assistance Fee component only. Reimbursable SEC and BIR statutory fees are exempt from EWT.',
        'Please provide the signed BIR Form 2307 within ten (10) days from payment date.',
      ],
      receipt: [
        'This Acknowledgement Receipt confirms receipt of the specified funds for SEC Corporate Registration assistance and statutory fee advances.',
        'Official SEC Electronic Official Receipt (eOR) from the ePAY portal will be transmitted directly to the client upon SEC payment posting.',
      ],
    },
  },

  amendment: {
    category: 'amendment',
    shortLabel: 'SEC Amendment (AOI / By-Laws)',
    transactionTitle: 'Amendment of Articles of Incorporation & By-Laws (SEC eAMEND)',
    secPortalSystem: 'SEC eAMEND Portal',
    processingTimeline: '10 to 15 Working Days depending on Simple vs. Regular eAMEND track',
    scopeSummary:
      'Comprehensive corporate assistance for filing Amended Articles of Incorporation and/or Amended By-Laws with the SEC via the eAMEND portal (covering change of corporate name, principal office address, corporate purpose, number of directors, or corporate term).',
    defaultLineItems: [
      {
        description: 'SEC Assistance Fee — Amendment of Articles of Incorporation / By-Laws',
        subtext:
          'Drafting of underscored Amended AOI/By-Laws, Directors’ Certificate, Secretary’s Certificate of No Intra-Corporate Dispute, eAMEND portal filing, and examiner compliance follow-up',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 15000,
      },
      {
        description: 'SEC Amendment Filing Fee (Amended AOI & By-Laws)',
        subtext: 'Standard SEC filing fee for Amended Articles of Incorporation (₱2,000) and Amended By-Laws (₱1,000)',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 3000,
      },
      {
        description: 'SEC Name Reservation Fee (if Amending Corporate Name)',
        subtext: 'Reservation of new corporate name / trade name via SEC portal',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 100,
      },
      {
        description: 'SEC Legal Research Fee (LRF — 1% of Filing Fee)',
        subtext: 'Mandatory 1% UP Law Center Legal Research Fee (minimum ₱20.00)',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 31,
      },
      {
        description: 'Notarization of Directors’ Certificate & Secretary’s Certificates',
        subtext: 'Notarial fees for multi-signatory Directors’ Certificate, Amended AOI/BL, and hardcopy submission to SEC',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 2200,
      },
    ],
    requirementsChecklist: [
      'Copy of Latest Certificate of Incorporation and previously approved Articles of Incorporation & By-Laws',
      'Latest General Information Sheet (GIS) and Audited Financial Statements (AFS) duly received by SEC via eFAST',
      'Specific details of proposed amendment(s) (e.g., new Principal Office Address, updated Primary/Secondary Purpose, or new Corporate Name)',
      'TIN and valid government IDs of the President, Corporate Secretary, and at least majority of the Board of Directors',
      'SEC Monitoring Clearance (if required by the assigned SEC Company Registration and Monitoring Department examiner)',
    ],
    defaultNotes: {
      quotation: [
        'All changed provisions in the Amended Articles of Incorporation must be underscored and followed by "[AMENDED ON (DATE OF MEETING)]" per SEC guidelines.',
        'Requires affirmative vote of majority of the Board of Directors and stockholders representing at least two-thirds (2/3) of the Outstanding Capital Stock.',
        'Any unassessed SEC compliance penalties discovered during pre-evaluation (e.g., late GIS/AFS filings) are separate from this quotation.',
      ],
      billing: [
        'Kindly settle the SEC eAMEND statutory filing fees and professional assistance fee tranche to proceed with uploading the notarized amendment documents.',
      ],
      invoice: [
        'Reimbursable government filing fees and notarial charges are billed at cost and are not subject to Expanded Withholding Tax (EWT).',
      ],
      receipt: [
        'Payment received is applied toward the SEC Amendment engagement as itemized in the Statement of Account.',
      ],
    },
  },

  increase_acs: {
    category: 'increase_acs',
    shortLabel: 'Increase of Capital Stock',
    transactionTitle: 'Increase of Authorized Capital Stock (ACS) & New Share Subscription',
    secPortalSystem: 'SEC CRMD / Financial Analysis & Audit Division',
    processingTimeline: '20 to 35 Working Days (subject to SEC Financial Specialist & Legal Examiner review)',
    scopeSummary:
      'Specialized legal and financial compliance assistance for the Increase of Authorized Capital Stock (ACS) under Section 37 of the Revised Corporation Code, including computation of the mandatory 25% subscription / 25% paid-up rule on the increase, preparation of the Certificate of Increase, Treasurer’s Affidavit, and coordination with SEC Financial and Legal Examiners.',
    defaultLineItems: [
      {
        description: 'SEC Assistance Fee — Increase of Authorized Capital Stock (Cash Infusions)',
        subtext:
          'Preparation of Certificate of Increase of Capital Stock, Amended AOI (Article VII), Treasurer’s Affidavit, Directors’ Certificate, Stockholders’ List, and representation before SEC Financial & Legal Divisions',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 35000,
      },
      {
        description: 'SEC Filing Fee on Increase of Authorized Capital Stock',
        subtext: 'Computed at 1/5 of 1% (0.20%) of the Increase in Authorized Capital Stock (minimum ₱3,000.00) + ₱2,000.00 Amended AOI fee',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 22000,
      },
      {
        description: 'SEC Legal Research Fee (LRF — 1% of SEC Filing Fee)',
        subtext: 'Mandatory 1% UP Law Center Legal Research Fund fee on total SEC filing fee',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 220,
      },
      {
        description: 'BIR Documentary Stamp Tax (DST — BIR Form 2000) on New Subscriptions',
        subtext: 'Computed at ₱2.00 per ₱200.00 (1.0%) par value of newly subscribed shares under the capital increase',
        category: 'bir_tax_dst',
        quantity: 1,
        unitPrice: 25000,
      },
      {
        description: 'Notarial, Bank Certificate Verification & Dossier Collating Fees',
        subtext: 'Notarization of four (4) sets of Certificate of Increase, Treasurer’s Affidavit, Amended AOI, and SEC hardcopy binding',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 3500,
      },
    ],
    requirementsChecklist: [
      'Certificate of Increase of Capital Stock signed by majority of the Directors and certified by the Chairman & Corporate Secretary',
      'Treasurer’s Sworn Affidavit certifying that at least 25% of the increase in capital stock has been subscribed and at least 25% of such subscription has been fully paid',
      'Amended Articles of Incorporation underscoring the amended Capital Stock clause (Article VII)',
      'List of Stockholders of Record as of the date of the meeting approving the increase, certified by the Corporate Secretary',
      'Latest Audited Financial Statements (AFS) and General Information Sheet (GIS)',
      'Proof of Inward Remittance / Bank Certificate of Deposit / Special Audit Report (depending on mode of payment: Cash, Conversion of Advances/Liabilities to Equity, or Stock Dividend)',
    ],
    defaultNotes: {
      quotation: [
        'Sample statutory computation above assumes an Increase in Authorized Capital Stock of ₱10,000,000.00 with ₱2,500,000.00 new subscription. Use the built-in SEC Fee Calculator to adjust for your exact capital increase.',
        'If subscription payment is via Conversion of Advances/Liabilities to Equity rather than Cash, an Special Audit Report by an SEC-accredited External Auditor may be required.',
        'BIR Documentary Stamp Tax (BIR Form 2000) must be filed on or before the 5th day of the month following the SEC approval or subscription.',
      ],
      billing: [
        'Statutory SEC Filing Fees and LRF are payable upon issuance of the SEC Payment Assessment Form (PAF) following pre-evaluation by the SEC Financial Specialist.',
      ],
      invoice: [
        'Withholding tax (EWT) applies exclusively to the SEC Assistance Fee. Statutory SEC Filing Fees and BIR DST are pass-through government remittances.',
      ],
      receipt: [
        'Received funds for Increase of Authorized Capital Stock processing. Official SEC eOR and BIR Form 2000 proof of payment will be furnished upon filing.',
      ],
    },
  },

  dissolution: {
    category: 'dissolution',
    shortLabel: 'Corporate Dissolution',
    transactionTitle: 'Voluntary Corporate Dissolution / Shortening of Corporate Term (Sec. 134 / 136 RCC)',
    secPortalSystem: 'SEC CRMD & Monitoring Division',
    processingTimeline: '30 to 60 Working Days (inclusive of mandatory newspaper publication & SEC clearance)',
    scopeSummary:
      'End-to-end assistance for Voluntary Dissolution where no creditors are affected (Section 134, Revised Corporation Code) or Shortening of Corporate Term (Section 136), including drafting of Verified Request for Dissolution, Board/Stockholder Resolutions, Newspaper Publication coordination, and SEC Certificate of Dissolution release.',
    defaultLineItems: [
      {
        description: 'SEC Assistance Fee — Corporate Dissolution / Shortening of Term',
        subtext:
          'Preparation of Verified Request for Dissolution, Directors’ Certificate, Affidavit of Non-Operation / No Creditors Affected, SEC Monitoring coordination, and follow-up until Certificate of Dissolution',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 28000,
      },
      {
        description: 'SEC Dissolution / Shortening of Term Filing Fee & LRF',
        subtext: 'Statutory SEC filing fee for Request for Dissolution / Amended AOI Shortening Corporate Term including 1% LRF',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 3030,
      },
      {
        description: 'Newspaper Publication of Notice of Dissolution (Once a Week for 3 Consecutive Weeks)',
        subtext: 'Mandatory publication in a newspaper of general circulation + Publisher’s Affidavit of Publication',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 14500,
      },
      {
        description: 'Notarial, Certified True Copies & SEC Transmittal Expenses',
        subtext: 'Notarization of Verified Petition, Directors’ Certificate, Secretary’s Certificate of No Pending Case, and courier fees',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 3000,
      },
    ],
    requirementsChecklist: [
      'Verified Request for Dissolution stating the reason for dissolution, form/manner/time of notices given, and names of directors & stockholders who approved',
      'Resolution approved by majority of the Board of Directors and affirmative vote of stockholders owning at least majority (Sec. 134) or 2/3 (Shortening of Term) of Outstanding Capital Stock',
      'Publisher’s Affidavit of Publication of the Notice of Meeting/Dissolution in a newspaper of general circulation',
      'Latest Audited Financial Statements (AFS) as of the last fiscal year and Interim Balance Sheet showing zero liabilities or creditor consent',
      'BIR Tax Clearance for Corporate Dissolution / Certificate of No Outstanding Tax Liability (as required)',
      'Secretary’s Certificate of No Pending Intra-Corporate Case or Action Against the Corporation',
    ],
    defaultNotes: {
      quotation: [
        'Scope covers SEC Corporate Dissolution. Separate BIR Closure / Application for Cancellation of TIN (BIR Form 1905) and LGU Mayor’s Permit Retirement can be quoted under a separate tax closure engagement.',
        'Newspaper publication cost depends on the assigned broadsheet/newspaper of general circulation and column-inch length of the Notice.',
      ],
      billing: [
        'Newspaper publication deposit and initial professional fee tranche are required upon execution of the Board and Stockholders’ Dissolution Resolutions.',
      ],
      invoice: [
        'Publication expenses and SEC filing fees are pass-through disbursements supported by publisher and SEC receipts.',
      ],
      receipt: [
        'Payment acknowledged for Corporate Dissolution assistance with the Securities and Exchange Commission.',
      ],
    },
  },

  compliance_gis_afs: {
    category: 'compliance_gis_afs',
    shortLabel: 'GIS / AFS & SEC Compliance',
    transactionTitle: 'Annual GIS & AFS eFAST Submission and SEC Monitoring / Penalty Evaluation',
    secPortalSystem: 'SEC eFAST (Electronic Filing and Submission Tool)',
    processingTimeline: '5 to 10 Working Days',
    scopeSummary:
      'Corporate secretarial assistance for the preparation and submission of the General Information Sheet (GIS) and Audited Financial Statements (AFS) via the SEC eFAST portal, and/or representation before the SEC Company Registration and Monitoring Department (CRMD) for Certificate of Good Standing / Monitoring Clearance.',
    defaultLineItems: [
      {
        description: 'SEC Assistance Fee — GIS Preparation & eFAST Portal Filing',
        subtext: 'Drafting of Annual / Amended General Information Sheet (GIS), Beneficial Ownership Declaration, eFAST account management, and submission until "Accepted" status',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 8500,
      },
      {
        description: 'SEC Assistance Fee — SEC Monitoring Assessment & Certificate of Good Standing',
        subtext: 'Application for SEC Monitoring Clearance, reconciliation of historical GIS/AFS records, and securing Certificate of No Derogatory Information / Good Standing',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 9500,
      },
      {
        description: 'SEC Certification / Monitoring Fee & LRF',
        subtext: 'Statutory SEC fee for Certificate of Good Standing / No Derogatory Information and monitoring sheet evaluation',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 2020,
      },
      {
        description: 'Notarial & Secretarial Out-of-Pocket Charges',
        subtext: 'Notarization of GIS and Secretary’s Certificates',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 1000,
      },
    ],
    requirementsChecklist: [
      'Access credentials or enrollment authorization for the corporation’s SEC eFAST account',
      'Copy of prior year’s General Information Sheet (GIS) and Audited Financial Statements (AFS)',
      'Updated list of Directors, Officers, Stockholders, and Beneficial Owners (with TIN, nationality, and current residential addresses)',
      'Date of Actual Annual Stockholders’ Meeting per Corporate By-Laws',
      'Previous SEC Monitoring Sheet or Show Cause Order (if any)',
    ],
    defaultNotes: {
      quotation: [
        'Annual GIS must be submitted via SEC eFAST within thirty (30) calendar days from the date of the actual Annual Stockholders’ Meeting.',
        'Any statutory SEC fines or late filing penalties assessed by the SEC Monitoring Department are for the direct account of the client corporation.',
      ],
      billing: [
        'Full settlement of the professional fee and SEC certification fee is requested upon filing via SEC eFAST.',
      ],
      invoice: [
        'Thank you for entrusting your annual corporate secretarial and SEC eFAST compliance to our firm.',
      ],
      receipt: [
        'Payment received for SEC GIS/AFS eFAST compliance and monitoring assistance.',
      ],
    },
  },

  foreign_license: {
    category: 'foreign_license',
    shortLabel: 'Foreign Corp License',
    transactionTitle: 'SEC License to Transact Business in the Philippines (Foreign Branch / Rep Office)',
    secPortalSystem: 'SEC eSPARC Foreign Corporation Portal (SEC Form F-103 / F-104)',
    processingTimeline: '15 to 25 Working Days from receipt of Apostilled Parent Company Dossier',
    scopeSummary:
      'Assistance in securing a License to Transact Business in the Philippines for a Foreign Corporation (Branch Office via SEC Form F-103 or Representative Office via SEC Form F-104), including Resident Agent appointment, inward remittance compliance, and SEC license issuance.',
    defaultLineItems: [
      {
        description: 'SEC Assistance Fee — Foreign Corporation License Application (F-103 / F-104)',
        subtext: 'Preparation of SEC Form F-103/F-104, Resident Agent Acceptance, review of Apostilled parent company documents, eSPARC filing, and SEC follow-up',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 45000,
      },
      {
        description: 'SEC Foreign License Filing Fee & Name Reservation',
        subtext: 'Computed at 1% of actual inward remittance / assigned capital (minimum ₱3,000.00) + Name Reservation',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 12100,
      },
      {
        description: 'SEC Legal Research Fee (LRF — 1% of Filing Fee)',
        subtext: 'Mandatory 1% UP Law Center Legal Research Fund fee',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 121,
      },
      {
        description: 'Notarial, Dossier Binding & Regulatory Out-of-Pocket Expenses',
        subtext: 'Philippine notarization of Resident Agent Undertakings, Form F-103/F-104, and hardcopy SEC submission',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 3500,
      },
    ],
    requirementsChecklist: [
      'Apostilled / Consularized Board Resolution authorizing the establishment of a Branch/Representative Office in the Philippines and appointing a Resident Agent',
      'Apostilled Certified Copy of Articles of Incorporation / Charter and By-Laws of the Parent Foreign Corporation (with official English translation if in a foreign language)',
      'Apostilled Latest Audited Financial Statements of the Parent Corporation (as of a date not exceeding 1 year from filing)',
      'Apostilled Certificate of Incumbency / Certificate of Good Standing from the home country Corporate Registry',
      'Acceptance of Appointment by the Philippine Resident Agent (Philippine resident individual or domestic corporation)',
      'Proof of Inward Remittance of Assigned Capital (minimum US$200,000 for Branch Office or US$30,000 for Representative Office, subject to FIA exceptions)',
    ],
    defaultNotes: {
      quotation: [
        'Within sixty (60) days after the issuance of the SEC License, a Foreign Branch Office is required to deposit acceptable securities with the SEC worth at least ₱500,000.00 under the Revised Corporation Code.',
        'All foreign-executed corporate documents must be duly Apostilled (or authenticated by the Philippine Embassy if from a non-Apostille jurisdiction).',
      ],
      billing: [
        '50% Engagement Fee is payable upon commencement of document review; statutory SEC filing fees are payable upon issuance of the SEC Payment Assessment Form.',
      ],
      invoice: [
        'Professional fee billed for Foreign Corporation SEC Licensing assistance.',
      ],
      receipt: [
        'Payment received for SEC Foreign Corporation License application assistance.',
      ],
    },
  },

  stock_transfer: {
    category: 'stock_transfer',
    shortLabel: 'Stock Transfer & STB',
    transactionTitle: 'Stock & Transfer Book (STB) Registration, Share Transfer & Stock Certificates',
    secPortalSystem: 'SEC CRMD / Corporate Secretarial Recording',
    processingTimeline: '7 to 14 Working Days',
    scopeSummary:
      'Corporate secretarial assistance for the registration and updating of the Stock and Transfer Book (STB) with the SEC, preparation of Deeds of Absolute Sale / Assignment of Shares, issuance of unissued or transferred Stock Certificates, and Amended GIS recording.',
    defaultLineItems: [
      {
        description: 'SEC Assistance Fee — Share Transfer Documentation & STB Recording',
        subtext: 'Drafting of Deed of Sale/Assignment of Shares, Secretary’s Certificate, cancellation & issuance of Stock Certificates, STB ledger posting, and Amended GIS filing',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 14000,
      },
      {
        description: 'Stock & Transfer Book (STB) Ledger & SEC Stamping / Registration Fee',
        subtext: 'Official hardbound Stock & Transfer Book, Stock Certificate booklet, and SEC registration fee',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 2800,
      },
      {
        description: 'Notarial & Courier Out-of-Pocket Expenses',
        subtext: 'Notarization of Deeds of Sale of Shares and Corporate Secretary Certifications',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 2000,
      },
    ],
    requirementsChecklist: [
      'Original Stock & Transfer Book (STB) and unissued/issued Stock Certificate Booklet (if already registered)',
      'Copy of Latest General Information Sheet (GIS) showing the current shareholding structure',
      'Details of Transferor(s) and Transferee(s): Full Name, Nationality, TIN, Residential Address, Number of Shares, and Consideration',
      'BIR Electronic Certificate Authorizing Registration (eCAR) for recording of secondary share transfers in the STB',
    ],
    defaultNotes: {
      quotation: [
        'Note: Under the National Internal Revenue Code, no transfer of shares of stock shall be recorded in the Stock and Transfer Book unless accompanied by a BIR Certificate Authorizing Registration (eCAR). Separate assistance for BIR eCAR processing (CGT & DST filing) is available upon request.',
      ],
      billing: [
        'Kindly settle the billed amount to proceed with drafting the share transfer instruments and STB recording.',
      ],
      invoice: [
        'Professional fees for Corporate Secretarial and Stock & Transfer Book administration.',
      ],
      receipt: [
        'Payment received for Stock & Transfer Book and Share Transfer corporate assistance.',
      ],
    },
  },

  custom: {
    category: 'custom',
    shortLabel: 'Custom SEC Transaction',
    transactionTitle: 'Special SEC Corporate Regulatory & Compliance Assistance',
    secPortalSystem: 'SEC Philippines / CRMD / eFAST / eSPARC',
    processingTimeline: '10 to 15 Working Days',
    scopeSummary:
      'Customized corporate secretarial, legal documentation, and regulatory liaison assistance before the Securities and Exchange Commission (SEC) Philippines.',
    defaultLineItems: [
      {
        description: 'SEC Corporate Assistance & Professional Fee',
        subtext: 'Drafting of corporate resolutions, certifications, petitions, and liaison before the Securities and Exchange Commission',
        category: 'professional_fee',
        quantity: 1,
        unitPrice: 15000,
      },
      {
        description: 'SEC Statutory Filing Fee & Legal Research Fee (LRF)',
        subtext: 'Estimated SEC assessment fee including mandatory 1% Legal Research Fee',
        category: 'sec_statutory_fee',
        quantity: 1,
        unitPrice: 2020,
      },
      {
        description: 'Notarial & Out-of-Pocket Disbursements',
        subtext: 'Notarization of corporate instruments, certified true copies, and courier transmittal',
        category: 'out_of_pocket',
        quantity: 1,
        unitPrice: 1800,
      },
    ],
    requirementsChecklist: [
      'Certificate of Incorporation and latest Articles of Incorporation & By-Laws',
      'Latest General Information Sheet (GIS) and Audited Financial Statements (AFS)',
      'Signed Secretary’s Certificate / Board Resolution authorizing the transaction and designating the authorized representative',
      'Valid Government IDs and TIN of Corporate Signatories',
    ],
    defaultNotes: {
      quotation: [
        'Professional fee is payable 50% upon engagement and 50% upon completion of the SEC transaction.',
        'Government filing fees are billed at actual SEC Payment Assessment Form (PAF) rates.',
      ],
      billing: [
        'Please remit payment to the designated bank account and send proof of transfer for immediate processing.',
      ],
      invoice: [
        'Expanded Withholding Tax (EWT), if any, applies only to the Professional Assistance Fee.',
      ],
      receipt: [
        'Payment received with thanks for SEC Corporate Assistance services.',
      ],
    },
  },
};

export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

const ONES = [
  '',
  'ONE',
  'TWO',
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
  'SEVEN',
  'EIGHT',
  'NINE',
  'TEN',
  'ELEVEN',
  'TWELVE',
  'THIRTEEN',
  'FOURTEEN',
  'FIFTEEN',
  'SIXTEEN',
  'SEVENTEEN',
  'EIGHTEEN',
  'NINETEEN',
];

const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

function convertHundreds(num: number): string {
  let str = '';
  if (num > 99) {
    str += ONES[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
  }
  if (num > 19) {
    str += TENS[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + ' ';
  }
  return str.trim();
}

export function amountToWordsPHP(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'ZERO PESOS ONLY';
  }
  const wholePesos = Math.floor(amount);
  const centavos = Math.round((amount - wholePesos) * 100);

  if (wholePesos === 0) {
    return `${centavos}/100 PESOS ONLY`;
  }

  let words = '';
  const millions = Math.floor(wholePesos / 1_000_000);
  const thousands = Math.floor((wholePesos % 1_000_000) / 1_000);
  const remainder = wholePesos % 1_000;

  if (millions > 0) {
    words += convertHundreds(millions) + ' MILLION ';
  }
  if (thousands > 0) {
    words += convertHundreds(thousands) + ' THOUSAND ';
  }
  if (remainder > 0) {
    words += convertHundreds(remainder) + ' ';
  }

  words = words.trim();
  if (centavos > 0) {
    return `${words} PESOS AND ${centavos.toString().padStart(2, '0')}/100 ONLY`;
  }
  return `${words} PESOS ONLY`;
}

export function createDocumentFromPreset(
  category: SECTransactionCategory,
  docType: 'quotation' | 'billing' | 'invoice' | 'receipt' = 'quotation'
): SECDocument {
  const preset = SEC_TRANSACTION_PRESETS[category];
  const prefixMap = {
    quotation: 'QTN',
    billing: 'SOA',
    invoice: 'INV',
    receipt: 'AR',
  };
  const today = new Date().toISOString().slice(0, 10);
  const validDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const lineItems: LineItem[] = preset.defaultLineItems.map((item, idx) => ({
    ...item,
    id: `item-${category}-${idx}-${ Math.random().toString(36).slice(2, 6) }`,
  }));

  const totalAmount = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  return {
    id: `doc-${Date.now()}`,
    docType,
    referenceNo: `SEC-${prefixMap[docType]}-2026-0108`,
    issueDate: today,
    validUntilOrDueDate: validDate,
    secCategory: category,
    transactionTitle: preset.transactionTitle,
    secPortalSystem: preset.secPortalSystem,
    processingTimeline: preset.processingTimeline,
    scopeSummary: preset.scopeSummary,
    client: {
      companyName: 'PACIFIC HORIZON HOLDINGS & VENTURES INC.',
      secRegNo: category === 'registration' ? 'For eSPARC Incorporation' : 'CS201948219',
      tin: '010-492-817-000',
      address: '18th Floor, Ore Central Tower, 9th Avenue cor. 31st Street, Bonifacio Global City, Taguig City',
      attentionTo: 'MS. ELENA R. MONTEMAYOR',
      designation: 'Corporate Secretary & Treasurer',
      email: 'e.montemayor@pacifichorizon.ph',
    },
    lineItems,
    requirementsChecklist: [...preset.requirementsChecklist],
    notesAndTerms: [...preset.defaultNotes[docType]],
    taxConfig: {
      taxMode: 'non_vat',
      ewtRate: 0,
      applyTrancheSplit: false,
      profFeeBillingPercent: 50,
      statutoryBillingPercent: 100,
      trancheDescription: '50% Downpayment on Assistance Fee + 100% Statutory SEC Filing Fees',
    },
    receiptDetails: {
      paymentMethod: 'Bank Transfer / PESONet / InstaPay',
      issuingBank: 'BPI Corporate Express (Ref #894019283)',
      referenceNo: 'INSTAPAY-20261108-9412',
      paymentDate: today,
      paymentPurpose: `Payment for ${preset.transactionTitle}`,
      totalContractPrice: totalAmount,
      previousPayments: 0,
      amountReceived: totalAmount,
      overrideAutoAmount: false,
    },
    updatedAt: new Date().toISOString(),
  };
}
