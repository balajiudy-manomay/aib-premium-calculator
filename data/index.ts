import { QuickQuoteState } from '../types';

export const PARISHES = [
  'St.Catherine',
  'Portmore',
  'Others'
];

export const OCCUPATIONS = [
  'Self Employed',
  'Others',
  'Sales Representative',
  'Members of JTA-Civil Servants',
  'Member of JDF-Civil Servants',
  'Members of JCF-Civil Servants',
  'Nurses',
  'Teachers',
  'Firemen',
  'Police Officers below the rank  Inspector',
  'Police Officer',
  'Immigration Officers',
  'Soldiers',
  'Civil Servant'
];

export const VEHICLE_TYPES = [
  'Company Owned Vehicle',
  'Personal Vehicle'
];

export const INSURANCE_PRODUCTS = [
  'AIB Unique Package',
  'Beginners select',
  'Diamond Max',
  'Gold Shield',
  'Mini Max',
  'Motorcycle',
  'Premier Lady',
  'Premier Platinum',
  'Premier Rush',
  'Premier Ultimate',
  'Prestige Club',
  'Private Car',
  'Queen Guard',
  'Road Angel',
  'Superior Car',
  'Superior Lady',
  'Superior Select High Value',
  'The Luxe',
  'Third Party-Private Car',
  'Ultimate Women',
  'Young and Inexperienced',
  'Commercial vehicle',
];

export const PREVIOUS_CARRIERS = [
  'None',
  'GraceKennedy General Insurance',
  'Insurance Company of the West Indies Limited',
  'JN General Insurance',
  'Guardian General Insurance',
  'British Caribbean Insurance Company',
  'Advantage General',
  'Key Insurance',
  'AutoSmart',
  'General Accident',
  'Other',
  'First Time Insurance'
];

export const ADDITIONAL_DRIVERS = [
  'Insured only',
  'Insured plus one driver',
  'Insured plus 2 drivers',
  'Insured & Female drivers only(for Premier Lady)',
  'Others',
  'Open Cover',
  'Insured plus 3 drivers',
  'Insured plus 4 drivers',
  'Restricted (3 named drivers)(Premier Lady)',
  'Insured and/or Spouse Only'
];

export const DEFAULT_QUOTE_STATE: QuickQuoteState = {
  // Generate a new quote ID on each fresh load
  quoteId: `QQ-${Date.now()}`,
  basic: {
    fullName: '',
    gender: '',
    dob: '',
    trn: '',
    occupation: '',
    livingWorkingIn: '',
    employer: '',
    blockBuildingName: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    address: '',
    email: '',
    telephoneHome: '',
    telephoneWork: '',
    telephoneMobile: '',
  },
  vehicle: {
    vehicleType: '',
    year: '',
    value: '',
    makeModel: '',
    isHighPerformance: '',
    valuationCompleted: '',
    cc: '',
    use: '',
    vehicleAdded: '',
    chassisNumber: '',
  },
  coverage: {
    typeOfBusiness: '',
    existingPolicyYear: '',
    insuranceProduct: '',
    coverType: '',
    sumInsured: '',
    includeTheftProtection: '',
    thirdPartyAddon: '',
  },
  history: {
    licenseIssueDate: '',
    firstTimeInsured: '',
    previousInsurerCarrier: '',
    hasNoClaimBonus: '',
    ncbYears: '',
    ncbPercent: '',
    ncbAmount: '',
    hasAccidentHistory: '',
    mainDriverGender: '',
    additionalDrivers: '',
    manualLoadPercentage: '',
  },
};

export function getCoverTypeOptions(insuranceProduct: string): string[] {
  switch (insuranceProduct) {
    case 'Private Car':
      return [
        'Comprehensive',
        'Third Party',
        'Third Party Fire and Theft',
        'Laid Up Fire and Theft',
        'Super Saver',
        'Laid Up',
        'Supreme Third Party',
        'Classic Third Party',
        'Easy Third Party',
        'Value Shield'
      ];
    case 'Young and Inexperienced':
      return [
        'Comprehensive',
        'Third Party'
      ];
    case 'Motorcycle':
    case 'Road Angel':
      return [
        'Comprehensive',
        'Third Party',
        'Third Party Fire and Theft'
      ];
    case 'Superior Car':
      return [
        'Comprehensive',
        'Third Party Fire and Theft'
      ];
    case 'Superior Lady':
    case 'Superior Select High Value':
    case 'Beginners select':
    case 'Prestige Club':
    case 'The Luxe':
    case 'Ultimate Women':
    case 'Diamond Max':
    case 'Queen Guard':
    case 'Premier Lady':
    case 'Premier Platinum':
    case 'Premier Rush':
    case 'Premier Ultimate':
    case 'AIB Unique Package':
    case 'Gold Shield':
      return ['Comprehensive'];
    case 'Third Party-Private Car':
      return ['Third Party'];
    case 'Mini Max':
      return [
        'Comprehensive'
      ];
    default:
      return []; // Or all options if needed, but empty seems safer
  }
}
