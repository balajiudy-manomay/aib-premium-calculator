export interface CellMapping {
  cell?: string;
  range?: string; // For dynamic list
  type: "number" | "string" | "boolean" | "currency" | "date" | "any" | "dynamic_list";
  options?: any[];
  format?: string;
}

export type OutputMappingValue = CellMapping | { [key: string]: OutputMappingValue };

export interface ExcelMapping {
  sheetName: string;
  inputs: Record<string, CellMapping>;
  outputs: Record<string, OutputMappingValue>;
}

/**
 * Excel Mapping Configuration
 * 
 * Maps UI fields and sections to exact cells in the premium calculator sheet.
 */
export const excelMapping: ExcelMapping = {
  sheetName: "Quick Quote_Calculator",

  // Map your form input keys to Excel cell coordinates in column D
  inputs: {
    // ==========================================
    // PROPOSAL DETAILS
    // ==========================================
    fullName: { 
      cell: "D5", 
      type: "string" 
    },
    gender: { 
      cell: "D6", 
      type: "string", 
      options: ["Male", "Female"] 
    },
    dateOfBirth: { 
      cell: "D7", 
      type: "date", 
      format: "DD-MMM-YYYY" 
    },
    trn: { 
      cell: "D8", 
      type: "string" 
    },
    occupation: { 
      cell: "D9", 
      type: "string" 
    },
    livingOrWorkingIn: { 
      cell: "D10", 
      type: "string" 
    },
    employer: { 
      cell: "D11", 
      type: "string" 
    },
    address: { 
      cell: "D12", 
      type: "string" 
    },
    emailAddress: { 
      cell: "D13", 
      type: "string" 
    },
    telephoneHome: { 
      cell: "D14", 
      type: "string" 
    },
    telephoneWork: { 
      cell: "D15", 
      type: "string" 
    },
    telephoneMobile: { 
      cell: "D16", 
      type: "string" 
    },

    // ==========================================
    // MOTOR VEHICLE INFORMATION
    // ==========================================
    vehicleType: { 
      cell: "D17", 
      type: "string" 
    },
    vehicleYear: { 
      cell: "D18", 
      type: "number" 
    },
    isHighPerformanceVehicle: { 
      cell: "D19", 
      type: "string", 
      options: ["Yes", "No"] 
    },
    makeAndModel: { 
      cell: "D20", 
      type: "string" 
    },
    valuationDoneWithin6Months: { 
      cell: "D21", 
      type: "string", 
      options: ["Yes", "No"] 
    },
    vehicleUse: { 
      cell: "D22", 
      type: "string", 
      options: ["Private Use", "Business Use"] 
    },
    vehicleAdded: { 
      cell: "D23", 
      type: "string" 
    },
    motorcycleCC: { 
      cell: "D24", 
      type: "number" 
    },

    // ==========================================
    // COVERAGE DETAILS
    // ==========================================
    typeOfBusiness: { 
      cell: "D25", 
      type: "string", 
      options: ["New Business", "Renewal"] 
    },
    product: { 
      cell: "D26", 
      type: "string" 
    },
    typeOfCover: { 
      cell: "D27", 
      type: "string" 
    },
    vehicleValue: { 
      cell: "D28", 
      type: "number" 
    },
    sumInsured: { 
      cell: "D28", 
      type: "number" 
    },
    renewalYear: { 
      cell: "D29", 
      type: "number", 
      options: [1, 2, 3] 
    },
    tpAddOn: { 
      cell: "D30", 
      type: "string", 
      options: ["Required", "Not Required"] 
    },
    includeTheft: { 
      cell: "D31", 
      type: "string", 
      options: ["Yes", "No"] 
    },

    // ==========================================
    // DRIVING / CLAIMS / ACCIDENT HISTORY
    // ==========================================
    firstIssueDateOfDriversLicence: { 
      cell: "D32", 
      type: "date" 
    },
    firstTimeInsured: { 
      cell: "D33", 
      type: "string", 
      options: ["Yes", "No"] 
    },
    previousInsurer: { 
      cell: "D34", 
      type: "string" 
    },
    noClaimBonusDiscount: { 
      cell: "D35", 
      type: "string", 
      options: ["Yes", "No"] 
    },
    noClaimBonusDiscountYear: { 
      cell: "D36", 
      type: "number" 
    },
    noClaimBonusPercentageEarned: { 
      cell: "D37", 
      type: "number" 
    },
    accidentOrLossInLastFiveYears: { 
      cell: "D38", 
      type: "string", 
      options: ["Yes", "No"] 
    },
    paymentsMade: { 
      cell: "D39", 
      type: "number" 
    },
    mainDriverGender: { 
      cell: "D40", 
      type: "string", 
      options: ["Male", "Female"] 
    },
    numberOfDrivers: { 
      cell: "D41", 
      type: "string" 
    },
    manualLoadPercentage: { 
      cell: "D42", 
      type: "number" 
    },
  },

  // Map the calculated/formula output cells to return formatted premium quotes
  outputs: {
    premiumComparison: {
      type: "dynamic_list",
      range: "C54:D150", // Will read from C54 downwards until an empty cell is found
    },

    bestPrice: {
      insurer: { cell: "C46", type: "string" },
      premium: { cell: "D46", type: "currency" },
    },

    highestPrice: {
      insurer: { cell: "C50", type: "string" },
      premium: { cell: "D50", type: "currency" },
    },
  },
};

// ============================================================================
// PREMIUM BREAKDOWN CONFIGURATIONS (Quick Quote Cal_Breakdown Sheet)
// ============================================================================

export const breakdownSheetName = "Quick Quote Cal_Breakdown";



export const breakdownLabels = {
  // Policy Details
  product: "Product",
  coverage: "Coverage",
  sumInsured: "Sum Insured",
  rateBand: "Rate band",
  rate: "Rate",

  // Premium Calculation
  basePremium: "Base Premium",

  // Loadings
  vehicleAgeLoading: "Vehicle Age Loading",
  licenceAgeLoading: "Licence Age Loading",
  ageLoading: "Age Loading",
  claimsLoad: "Claims Load",
  theftCoverLoad: "Theft Cover Load",
  occupationLoading: "Occupation Loading",
  ccLoad: "CC Load",
  maleLoading: "Male Loading",
  claimFreeYearsMaleDrivers: "Claim Free Years & Male Drivers",
  companyOwnedVehicleLoadings: "Company owned vehicle loadings",
  openPolicyLoading: "Open Policy Loading",
  insuredAndDrivers: "Insured and Drivers",
  multipleConditions: "Multiple Conditions",
  group1Sprv: "Group1-sprv",
  group2Sprv: "Group2-sprv",
  speciallyRatedVehiclesLoad: "Specially Rated Vehicles Load",
  vehicleLoad: "Vehicle Load",
  speciallyRatedVehiclesMotorcycleLoad: "Specially Rated vehicles loading (Motorcycle)",
  makeLoad: "Make Load",
  makeModelLoad: "Make Model Load",
  highPerformanceVehicleLoad: "High Performance Vehicle Load",
  manualLoad: "Manual Load",
  vehicleTheftLoad: "Vehicle Theft Load",

  premiumAfterLoading: "Premium After Loading",

  // Discounts
  introductoryRenewalDiscount: "Introductory/Renewal Discount",
  otherVehicleInsured: "Other vehicle insured with insurer",
  restrictedDriverDiscount: "Restricted Driver Discount",
  ncdStepBack: "NCD/ NCD Step Back",
  civilServantDiscount: "Civil Servant Discount",
  companyOwnedVehicleDiscount: "Company Owned Vehicle Discount",
  seniorCitizenDiscount: "Senior Citizen Discount",
  makeAndModelDiscount: "Make and Model Discount",
  gkgCarePackDiscount: "GKG Care Pack Discount",
  gkvrDiscount: "GKVR Discount",
  aibSchemeDiscount: "AIB Scheme Discount",
  loyaltyDiscount: "Loyalty Discount",
  euroCarClub: "Euro Car Club",
  mensClub: "Mens Club",
  suvClub: "SUV Club",
  specialDiscount: "Special Discount",
  legacyDiscount: "Legacy Discount",
  vehicleAgeDiscount: "Vehicle age",
  kiclDiscount: "KICL Discount",
  smartDriverDiscount: "Smart Driver Discount",
  femaleDriverPolicyHolderDiscount: "Female Driver/Policy Holder Discount",

  premiumAfterDiscounts: "Premium After Discounts",

  // Minimum Premium
  minimumPremium: "Minimum Premium",
  premiumAfterMinimumPremium: "Premium After Minimum Premium",

  // Charges & Taxes
  serviceCharge: "Service Charge",
  premiumAfterServiceCharge: "Premium After Service Charge",
  gct: "GCT",
  stampDuty: "Stamp Duty",
  finalPremium: "Final Premium",
} as const;

export type BreakdownKey = keyof typeof breakdownLabels;


