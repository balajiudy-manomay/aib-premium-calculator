export interface ValidationRule {
  required: boolean;
  errorMessage: string;
}

export interface EmailValidationRule extends ValidationRule {
  invalidFormatMessage: string;
}

export const validationRules = {
  // Basic Details
  fullName: {
    required: false,
    errorMessage: "Full Name is optional",
  } as ValidationRule,
  gender: {
    required: true,
    errorMessage: "Gender is required",
  } as ValidationRule,
  dob: {
    required: true,
    errorMessage: "Date of Birth is required (MM/DD/YYYY)",
  } as ValidationRule,
  trn: {
    required: true,
    errorMessage: "TRN is required",
  } as ValidationRule,
  occupation: {
    required: true,
    errorMessage: "Occupation is required",
  } as ValidationRule,
  livingWorkingIn: {
    required: true,
    errorMessage: "Living/Working in Parish is required",
  } as ValidationRule,
  employer: {
    required: true,
    errorMessage: "Employer is required",
  } as ValidationRule,
  address: {
    required: true,
    errorMessage: "Address is required",
  } as ValidationRule,
  blockBuildingName: {
    required: true,
    errorMessage: "Block & Building Name is required",
  } as ValidationRule,
  street: {
    required: true,
    errorMessage: "Street is required",
  } as ValidationRule,
  city: {
    required: true,
    errorMessage: "City is required",
  } as ValidationRule,
  state: {
    required: true,
    errorMessage: "State / Parish is required",
  } as ValidationRule,
  postalCode: {
    required: true,
    errorMessage: "Postal Code is required",
  } as ValidationRule,
  country: {
    required: true,
    errorMessage: "Country is required",
  } as ValidationRule,
  email: {
    required: true,
    errorMessage: "Email Address is required",
    invalidFormatMessage: "Invalid email address format",
  } as EmailValidationRule,
  telephoneHome: {
    required: false,
    errorMessage: "Home Telephone is optional",
  } as ValidationRule,
  telephoneWork: {
    required: false,
    errorMessage: "Work Telephone is optional",
  } as ValidationRule,
  telephoneMobile: {
    required: true,
    errorMessage: "Mobile Telephone is required",
  } as ValidationRule,

  // Vehicle Details
  makeModel: {
    required: true,
    errorMessage: "Vehicle Make & Model is required",
  } as ValidationRule,
  value: {
    required: true,
    errorMessage: "Valid vehicle valuation is required",
  } as ValidationRule,
  vehicleType: {
    required: true,
    errorMessage: "Vehicle Type is required",
  } as ValidationRule,
  year: {
    required: true,
    errorMessage: "Vehicle Year is required",
  } as ValidationRule,
  cc: {
    required: true,
    errorMessage: "Valid engine CC is required",
  } as ValidationRule,
  vehicleAdded: {
    required: true,
    errorMessage: "Registration Timing is required",
  } as ValidationRule,
  isHighPerformance: {
    required: true,
    errorMessage: "High Performance selection is required",
  } as ValidationRule,
  valuationCompleted: {
    required: true,
    errorMessage: "Valuation done within 6 months selection is required",
  } as ValidationRule,
  use: {
    required: true,
    errorMessage: "Vehicle Use is required",
  } as ValidationRule,

  // Coverage Details
  typeOfBusiness: {
    required: true,
    errorMessage: "Type of Business is required",
  } as ValidationRule,
  existingPolicyYear: {
    required: true,
    errorMessage: "Existing Policy Year is required",
  } as ValidationRule,
  insuranceProduct: {
    required: true,
    errorMessage: "Insurance Product is required",
  } as ValidationRule,
  coverType: {
    required: true,
    errorMessage: "Cover Type is required",
  } as ValidationRule,
  includeTheftProtection: {
    required: true,
    errorMessage: "Include Theft selection is required",
  } as ValidationRule,
  thirdPartyAddon: {
    required: true,
    errorMessage: "Third Party Add-On selection is required",
  } as ValidationRule,

  // History Details
  licenseIssueDate: {
    required: true,
    errorMessage: "First Issue Date of Driver's Licence is required (MM/DD/YYYY)",
  } as ValidationRule,
  firstTimeInsured: {
    required: true,
    errorMessage: "First Time Insured selection is required",
  } as ValidationRule,
  previousInsurerCarrier: {
    required: true,
    errorMessage: "Previous Insurer is required",
  } as ValidationRule,
  hasAccidentHistory: {
    required: true,
    errorMessage: "Accident or Loss in Last 5 Years selection is required",
  } as ValidationRule,
  hasNoClaimBonus: {
    required: true,
    errorMessage: "No Claim Bonus Discount selection is required",
  } as ValidationRule,
  ncbYears: {
    required: true,
    errorMessage: "NCD Tenure is required",
  } as ValidationRule,
  ncbPercent: {
    required: true,
    errorMessage: "NCD Percentage is required",
  } as ValidationRule,
  ncbAmount: {
    required: true,
    errorMessage: "NCB Amount is required",
  } as ValidationRule,
  mainDriverGender: {
    required: true,
    errorMessage: "Main Driver Gender is required",
  } as ValidationRule,
  additionalDrivers: {
    required: true,
    errorMessage: "Number of Drivers is required",
  } as ValidationRule,
  manualLoadPercentage: {
    required: false,
    errorMessage: "Manual Load Percentage is optional",
  } as ValidationRule,
};
