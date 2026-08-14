import { z } from "zod";
import { validationRules } from "./validation-rules";
import { ResolverResult } from "react-hook-form";

// Helper function to format Zod Errors into flat Record<string, string>
export const formatZodErrors = (error: z.ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = issue.path[issue.path.length - 1];
    if (typeof key === "string" || typeof key === "number") {
      formatted[key] = issue.message;
    }
  });
  return formatted;
};

// Custom resolver that replaces `@hookform/resolvers/zod`
export function customZodResolver<T extends z.ZodType<any, any, any>>(schema: T) {
  return async (values: any): Promise<ResolverResult<z.infer<T>>> => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return {
        values: result.data,
        errors: {},
      };
    }

    const errors: Record<string, any> = {};
    for (const issue of result.error.issues) {
      let current = errors;
      for (let i = 0; i < issue.path.length; i++) {
        const key = issue.path[i];
        if (typeof key !== "string" && typeof key !== "number") continue;
        if (i === issue.path.length - 1) {
          current[key] = {
            type: "validation",
            message: issue.message,
          };
        } else {
          if (!current[key]) {
            current[key] = {};
          }
          current = current[key];
        }
      }
    }

    return {
      values: {},
      errors,
    };
  };
}

// Basic Details Schema
export function formatAddress(details: {
  blockBuildingName?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string {
  const line1 = (details.blockBuildingName || '').trim();
  const line2 = (details.street || '').trim();
  const cityStatePostal = [
    (details.city || '').trim(),
    (details.state || '').trim(),
    (details.postalCode || '').trim(),
  ].filter(Boolean).join(', ');
  const line3 = cityStatePostal;
  const line4 = (details.country || '').trim();

  return [line1, line2, line3, line4].filter(Boolean).join('\n');
}

export const basicDetailsSchema = z.object({
  fullName: validationRules.fullName.required
    ? z.string().min(1, { message: validationRules.fullName.errorMessage })
    : z.string(),
  gender: validationRules.gender.required
    ? z.enum(["Male", "Female", ""])
        .refine((val) => val === "Male" || val === "Female", { message: validationRules.gender.errorMessage })
    : z.string(),
  dob: validationRules.dob.required
    ? z.string().min(1, { message: validationRules.dob.errorMessage })
    : z.string(),
  trn: validationRules.trn.required
    ? z.string().min(1, { message: validationRules.trn.errorMessage })
    : z.string(),
  occupation: validationRules.occupation.required
    ? z.string().min(1, { message: validationRules.occupation.errorMessage })
    : z.string(),
  livingWorkingIn: validationRules.livingWorkingIn.required
    ? z.string().min(1, { message: validationRules.livingWorkingIn.errorMessage })
    : z.string(),
  employer: validationRules.employer.required
    ? z.string().min(1, { message: validationRules.employer.errorMessage })
    : z.string(),
  blockBuildingName: z
    .string()
    .min(1, { message: "Block & Building Name is required" })
    .max(65, { message: "Block & Building Name cannot exceed 65 characters" }),
  street: z.string().min(1, { message: "Street is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State / Parish is required" }),
  postalCode: z.string().min(1, { message: "Postal Code is required" }),
  country: z
    .string()
    .min(1, { message: "Country is required" })
    .max(65, { message: "Country cannot exceed 65 characters" }),
  address: z.string().optional().or(z.literal("")),
  email: validationRules.email.required
    ? z.string()
        .min(1, { message: validationRules.email.errorMessage })
        .email({ message: validationRules.email.invalidFormatMessage })
    : z.string().refine((val) => !val || /\S+@\S+\.\S+/.test(val), {
        message: validationRules.email.invalidFormatMessage,
      }),
  telephoneHome: z.string(),
  telephoneWork: z.string(),
  telephoneMobile: validationRules.telephoneMobile.required
    ? z.string().min(1, { message: validationRules.telephoneMobile.errorMessage })
    : z.string(),
}).superRefine((data, ctx) => {
  const street = (data.street || '').trim();
  const city = (data.city || '').trim();
  const state = (data.state || '').trim();
  const postalCode = (data.postalCode || '').trim();

  const combinedLine2And3Length = street.length + (street ? 1 : 0) + [city, state, postalCode].filter(Boolean).join(', ').length;
  const rawCombinedLength = street.length + city.length + state.length + postalCode.length;

  if (rawCombinedLength > 65 || combinedLine2And3Length > 65) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['street'],
      message: 'Street, City, State, and Postal Code combined cannot exceed 65 characters',
    });
  }

  if (validationRules.address.required) {
    const fullAddr = formatAddress(data);
    if (!fullAddr && !data.address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['street'],
        message: validationRules.address.errorMessage || 'Address is required',
      });
    }
  }
});

// Vehicle Details Schema
export const vehicleDetailsSchema = z.object({
  vehicleType: validationRules.vehicleType.required
    ? z.string().min(1, { message: validationRules.vehicleType.errorMessage })
    : z.string(),
  year: validationRules.year.required
    ? z.union([z.number(), z.string(), z.date()]).refine(
        (val) => {
          if (val === undefined || val === null || val === "") return false;
          return true;
        },
        { message: validationRules.year.errorMessage }
      )
    : z.any(),
  value: validationRules.value.required
    ? z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
        z.number({ error: validationRules.value.errorMessage })
          .min(1001, { message: validationRules.value.errorMessage })
      )
    : z.any(),
  makeModel: validationRules.makeModel.required
    ? z.string().min(1, { message: validationRules.makeModel.errorMessage })
    : z.string(),
  isHighPerformance: validationRules.isHighPerformance.required
    ? z.enum(["Yes", "No", ""])
        .refine((val) => val === "Yes" || val === "No", { message: validationRules.isHighPerformance.errorMessage })
    : z.string(),
  valuationCompleted: validationRules.valuationCompleted.required
    ? z.enum(["Yes", "No", ""])
        .refine((val) => val === "Yes" || val === "No", { message: validationRules.valuationCompleted.errorMessage })
    : z.string(),
  cc: validationRules.cc.required
    ? z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
        z.number({ error: validationRules.cc.errorMessage })
          .min(1, { message: validationRules.cc.errorMessage })
      )
    : z.any(),
  use: validationRules.use.required
    ? z.string().min(1, { message: validationRules.use.errorMessage })
    : z.string(),
  vehicleAdded: validationRules.vehicleAdded.required
    ? z.string().min(1, { message: validationRules.vehicleAdded.errorMessage })
    : z.string(),
  chassisNumber: z.string().optional(),
});

// Coverage Details Schema
export const coverageDetailsSchema = z.object({
  typeOfBusiness: validationRules.typeOfBusiness.required
    ? z.string().min(1, { message: validationRules.typeOfBusiness.errorMessage })
    : z.string(),
  existingPolicyYear: z.string(), // validated conditionally below
  insuranceProduct: validationRules.insuranceProduct.required
    ? z.string().min(1, { message: validationRules.insuranceProduct.errorMessage })
    : z.string(),
  coverType: validationRules.coverType.required
    ? z.string().min(1, { message: validationRules.coverType.errorMessage })
    : z.string(),
  includeTheftProtection: validationRules.includeTheftProtection.required
    ? z.enum(["Yes", "No", ""])
        .refine((val) => val === "Yes" || val === "No", { message: validationRules.includeTheftProtection.errorMessage })
    : z.string(),
  thirdPartyAddon: validationRules.thirdPartyAddon.required
    ? z.enum(["Required", "No", ""])
        .refine((val) => val === "Required" || val === "No", { message: validationRules.thirdPartyAddon.errorMessage })
    : z.string(),
  sumInsured: z.number(),
}).refine(
  (data) => {
    if (data.typeOfBusiness === "Renewal" && validationRules.existingPolicyYear.required) {
      return !!data.existingPolicyYear;
    }
    return true;
  },
  {
    message: validationRules.existingPolicyYear.errorMessage,
    path: ["existingPolicyYear"],
  }
);

// History Details Schema
export const historyDetailsSchema = z.object({
  licenseIssueDate: validationRules.licenseIssueDate.required
    ? z.string().min(1, { message: validationRules.licenseIssueDate.errorMessage })
    : z.string(),
  firstTimeInsured: validationRules.firstTimeInsured.required
    ? z.enum(["Yes", "No", ""])
        .refine((val) => val === "Yes" || val === "No", { message: validationRules.firstTimeInsured.errorMessage })
    : z.string(),
  previousInsurerCarrier: z.string(), // validated conditionally below
  hasAccidentHistory: validationRules.hasAccidentHistory.required
    ? z.enum(["Yes", "No", ""])
        .refine((val) => val === "Yes" || val === "No", { message: validationRules.hasAccidentHistory.errorMessage })
    : z.string(),
  hasNoClaimBonus: validationRules.hasNoClaimBonus.required
    ? z.enum(["Yes", "No", ""])
        .refine((val) => val === "Yes" || val === "No", { message: validationRules.hasNoClaimBonus.errorMessage })
    : z.string(),
  ncbYears: z.string(), // validated conditionally below
  ncbPercent: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().nullable()
  ), // validated conditionally below — only required when hasNoClaimBonus === "Yes"
  ncbAmount: z.string(), // validated conditionally below
  mainDriverGender: validationRules.mainDriverGender.required
    ? z.enum(["Male", "Female", ""])
        .refine((val) => val === "Male" || val === "Female", { message: validationRules.mainDriverGender.errorMessage })
    : z.string(),
  additionalDrivers: validationRules.additionalDrivers.required
    ? z.string().min(1, { message: validationRules.additionalDrivers.errorMessage })
    : z.string(),
  manualLoadPercentage: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z.number()
  ),
}).superRefine((data, ctx) => {
  if (data.firstTimeInsured === "No" && validationRules.previousInsurerCarrier.required && !data.previousInsurerCarrier) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: validationRules.previousInsurerCarrier.errorMessage,
      path: ["previousInsurerCarrier"],
    });
  }
  if (data.hasNoClaimBonus === "Yes") {
    if (validationRules.ncbYears.required && !data.ncbYears) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationRules.ncbYears.errorMessage,
        path: ["ncbYears"],
      });
    }
    if (validationRules.ncbPercent.required && (data.ncbPercent === undefined || data.ncbPercent === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationRules.ncbPercent.errorMessage,
        path: ["ncbPercent"],
      });
    }
    if (validationRules.ncbAmount.required && (!data.ncbAmount || !data.ncbAmount.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validationRules.ncbAmount.errorMessage,
        path: ["ncbAmount"],
      });
    }
  }
});

// Consolidated Schema
export const quickQuoteSchema = z.object({
  quoteId: z.string(),
  basic: basicDetailsSchema,
  vehicle: vehicleDetailsSchema,
  coverage: coverageDetailsSchema,
  history: historyDetailsSchema,
});
