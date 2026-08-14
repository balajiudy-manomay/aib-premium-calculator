import { QuickQuoteState } from "@/types";

/**
 * Converts standard MM-DD-YYYY date string to MM/DD/YYYY
 */
export function formatDateToMDY(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "/");
}

/**
 * Converts standard MM-DD-YYYY date string to DD-MM-YYYY
 */
export function formatDateToDMY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[1]}-${parts[0]}-${parts[2]}`;
  }
  return dateStr;
}

/**
 * Maps the React QuickQuoteState to the flat payload fields expected by the Excel routes.
 */
export function mapQuoteStateToExcelInputs(state: QuickQuoteState) {
  // Parse renewalYear option
  let renewalYear = 1;
  if (state.coverage.existingPolicyYear.includes("2")) {
    renewalYear = 2;
  } else if (state.coverage.existingPolicyYear.includes("3")) {
    renewalYear = 3;
  }

  // Parse No Claim Bonus Years conditionally
  const hasNcb = state.history.hasNoClaimBonus === "Yes";
  const ncbYearsParsed = parseInt(state.history.ncbYears, 10);
  const noClaimBonusDiscountYear = hasNcb ? (isNaN(ncbYearsParsed) ? "" : ncbYearsParsed) : "";
  const noClaimBonusPercentageEarned = hasNcb ? state.history.ncbPercent : "";
  const paymentsMade = hasNcb ? (parseFloat(state.history.ncbAmount) || "") : "";

  return {
    fullName: state.basic.fullName,
    gender: state.basic.gender,
    dateOfBirth: formatDateToMDY(state.basic.dob),
    trn: state.basic.trn,
    occupation: state.basic.occupation,
    livingOrWorkingIn: state.basic.livingWorkingIn,
    employer: state.basic.employer,
    address: state.basic.address,
    emailAddress: state.basic.email,
    telephoneHome: state.basic.telephoneHome,
    telephoneWork: state.basic.telephoneWork,
    telephoneMobile: state.basic.telephoneMobile,

    vehicleType: state.vehicle.vehicleType,
    vehicleYear: state.vehicle.year,
    vehicleValue: state.vehicle.value,
    isHighPerformanceVehicle: state.vehicle.isHighPerformance,
    makeAndModel: state.vehicle.makeModel,
    valuationDoneWithin6Months: state.vehicle.valuationCompleted,
    vehicleUse: state.vehicle.use,
    vehicleAdded: state.vehicle.vehicleAdded,
    motorcycleCC: state.vehicle.cc,
    chassisNumber: state.vehicle.chassisNumber || "",

    typeOfBusiness: state.coverage.typeOfBusiness,
    product: state.coverage.insuranceProduct,
    typeOfCover: state.coverage.coverType,
    sumInsured: state.coverage.sumInsured,
    renewalYear: renewalYear,
    tpAddOn: state.coverage.thirdPartyAddon === "Required" ? "Required" : "Not Required",
    includeTheft: state.coverage.includeTheftProtection,

    firstIssueDateOfDriversLicence: formatDateToMDY(state.history.licenseIssueDate),
    firstTimeInsured: state.history.firstTimeInsured,
    previousInsurer: state.history.previousInsurerCarrier,
    noClaimBonusDiscount: state.history.hasNoClaimBonus,
    noClaimBonusDiscountYear: noClaimBonusDiscountYear,
    noClaimBonusPercentageEarned: noClaimBonusPercentageEarned,
    accidentOrLossInLastFiveYears: state.history.hasAccidentHistory,
    paymentsMade: paymentsMade,
    mainDriverGender: state.history.mainDriverGender,
    numberOfDrivers: state.history.additionalDrivers,
    manualLoadPercentage: parseFloat(state.history.manualLoadPercentage as any) || 0,
  };
}



/**
 * Converts a summary payload object into a CSV string
 */
export function generateSummaryCSV(payload: any): string {
  const lines: string[] = [];
  
  lines.push("ALLIED INSURANCE BROKERS LIMITED");
  lines.push("Motor Vehicle Insurance - Quick Quote Summary Report");
  lines.push("");
  lines.push(`Quote ID:,${payload.quoteId},Report Date:,${new Date().toLocaleDateString("en-US")}`);
  lines.push("");
  
  lines.push("CUSTOMER PROFILE DETAILS");
  if (payload.customerDetails) {
    Object.entries(payload.customerDetails).forEach(([k, v]) => {
      const safeVal = typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      lines.push(`${k},${safeVal}`);
    });
  }
  lines.push("");
  
  lines.push("MOTOR VEHICLE & COVERAGE INFORMATION");
  if (payload.vehicleDetails) {
    Object.entries(payload.vehicleDetails).forEach(([k, v]) => {
      const safeVal = typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      lines.push(`${k},${safeVal}`);
    });
  }
  lines.push("");
  
  lines.push("PARTNER PREMIUM QUOTES COMPARISON");
  lines.push("Insurer Partner,Status,Estimated Annual Premium");
  if (Array.isArray(payload.offers)) {
    payload.offers.forEach((o: any) => {
      const safeName = typeof o.name === 'string' && o.name.includes(',') ? `"${o.name}"` : o.name;
      const premium = o.premium > 0 ? o.premium : "Not Eligible";
      const status = o.status || (o.premium > 0 ? "Eligible" : "Not Eligible");
      lines.push(`${safeName},${status},${premium}`);
    });
  }
  
  return lines.join("\n");
}

/**
 * Converts a breakdown payload object into a CSV string
 */
export function generateBreakdownCSV(payload: any): string {
  const lines: string[] = [];
  
  lines.push("ALLIED INSURANCE BROKERS LIMITED");
  lines.push(`Motor Vehicle Insurance - Premium Breakdown - ${payload.insurerName}`);
  lines.push("");
  lines.push(`Quote ID:,${payload.quoteId},Report Date:,${new Date().toLocaleDateString("en-US")}`);
  lines.push("");
  
  lines.push("POLICY DETAILS");
  if (payload.policyDetails) {
    Object.entries(payload.policyDetails).forEach(([k, v]) => {
      const safeVal = typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      lines.push(`${k},${safeVal}`);
    });
  }
  lines.push("");
  
  lines.push("LOADINGS");
  if (Array.isArray(payload.loadings)) {
    payload.loadings.forEach((l: any) => {
      lines.push(`${l.label},${l.value}`);
    });
  }
  lines.push(`Premium After Loading:,${payload.premiumAfterLoading}`);
  lines.push("");
  
  lines.push("DISCOUNTS");
  if (Array.isArray(payload.discounts)) {
    payload.discounts.forEach((d: any) => {
      lines.push(`${d.label},${d.value}`);
    });
  }
  lines.push(`Premium After Discounts:,${payload.premiumAfterDiscounts}`);
  lines.push(`Premium After Min Premium Check:,${payload.premiumAfterMinimumPremium}`);
  lines.push("");
  
  lines.push("CHARGES & TAXES");
  if (payload.charges) {
    Object.entries(payload.charges).forEach(([k, v]) => {
      const safeVal = typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      lines.push(`${k},${safeVal}`);
    });
  }
  lines.push("");
  
  lines.push(`FINAL PREMIUM:,${payload.finalPremium}`);
  
  return lines.join("\n");
}
