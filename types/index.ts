export interface BasicDetails {
  fullName: string;
  gender: 'Male' | 'Female' | '';
  dob: string;
  trn: string;
  occupation: string;
  livingWorkingIn: string;
  employer: string;
  blockBuildingName?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  address: string;
  email: string;
  telephoneHome: string;
  telephoneWork: string;
  telephoneMobile: string;
}

export interface VehicleDetails {
  vehicleType: string;
  year: number | string | Date;
  value: number | "";
  makeModel: string;
  isHighPerformance: 'Yes' | 'No' | '';
  valuationCompleted: 'Yes' | 'No' | '';
  cc: number | "";
  use: string;
  vehicleAdded: string;
  chassisNumber?: string;
}

export interface CoverageDetails {
  typeOfBusiness: string;
  existingPolicyYear: string;
  insuranceProduct: string;
  coverType: string;
  sumInsured: number | "";
  includeTheftProtection: 'Yes' | 'No' | '';
  thirdPartyAddon: 'Required' | 'No' | '';
}

export interface HistoryDetails {
  licenseIssueDate: string;
  firstTimeInsured: 'Yes' | 'No' | '';
  previousInsurerCarrier: string;
  hasNoClaimBonus: 'Yes' | 'No' | '';
  ncbYears: string;
  ncbPercent: number | null | "";
  ncbAmount: string;
  hasAccidentHistory: 'Yes' | 'No' | '';
  mainDriverGender: 'Male' | 'Female' | '';
  additionalDrivers: string;
  manualLoadPercentage: number | "";
}

export interface QuickQuoteState {
  quoteId: string;
  basic: BasicDetails;
  vehicle: VehicleDetails;
  coverage: CoverageDetails;
  history: HistoryDetails;
}
