"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  QuickQuoteState,
  BasicDetails,
  VehicleDetails,
  CoverageDetails,
  HistoryDetails,
} from "@/types";
import { PARISHES, OCCUPATIONS, VEHICLE_TYPES, PREVIOUS_CARRIERS, ADDITIONAL_DRIVERS, getCoverTypeOptions, INSURANCE_PRODUCTS } from "@/data";
import {
  UserCheck,
  Car,
  ShieldCheck,
  History,
  Award,
  Users,
  AlertOctagon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "./ui/date-picker";
import { ComboboxSearchable } from "@/components/ui/combobox-searchable";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { quickQuoteSchema, formatZodErrors, customZodResolver } from "@/config/validation-schemas";
import GenderToggle from "./GenderToggle";
import SegmentedToggle from "./SegmentedToggle";

const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const REQUIRED_NO_OPTIONS = [
  { label: "Required", value: "Required" },
  { label: "No", value: "No" },
];

interface ConsolidatedQuoteFormProps {
  state: QuickQuoteState;
  onChangeBasic: (data: Partial<BasicDetails>) => void;
  onChangeVehicle: (data: Partial<VehicleDetails>) => void;
  onChangeCoverage: (data: Partial<CoverageDetails>) => void;
  onChangeHistory: (data: Partial<HistoryDetails>) => void;
  onSubmit: () => void;
}

export default function ConsolidatedQuoteForm({
  state,
  onChangeBasic,
  onChangeVehicle,
  onChangeCoverage,
  onChangeHistory,
  onSubmit,
}: ConsolidatedQuoteFormProps) {
  const [vehiclesList, setVehiclesList] = useState<string[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      try {
        setIsLoadingVehicles(true);
        const res = await fetch('/api/excel/vehicles');
        const data = await res.json();
        if (data.success && Array.isArray(data.vehicles)) {
          setVehiclesList(data.vehicles);
        }
      } catch (err) {
        console.error("Failed to load vehicle list", err);
      } finally {
        setIsLoadingVehicles(false);
      }
    }
    loadVehicles();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickQuoteState>({
    resolver: customZodResolver(quickQuoteSchema) as any,
    defaultValues: state,
    mode: "onTouched",
  });

  const formValues = watch();

  // Watch and sync state in real-time
  useEffect(() => {
    if (JSON.stringify(formValues.basic) !== JSON.stringify(state.basic)) {
      onChangeBasic(formValues.basic || {});
    }
  }, [formValues.basic, onChangeBasic, state.basic]);

  useEffect(() => {
    if (JSON.stringify(formValues.vehicle) !== JSON.stringify(state.vehicle)) {
      onChangeVehicle(formValues.vehicle || {});
    }
  }, [formValues.vehicle, onChangeVehicle, state.vehicle]);

  useEffect(() => {
    if (JSON.stringify(formValues.coverage) !== JSON.stringify(state.coverage)) {
      onChangeCoverage(formValues.coverage || {});
    }
  }, [formValues.coverage, onChangeCoverage, state.coverage]);

  useEffect(() => {
    if (JSON.stringify(formValues.history) !== JSON.stringify(state.history)) {
      onChangeHistory(formValues.history || {});
    }
  }, [formValues.history, onChangeHistory, state.history]);

  // Synchronize sumInsured with vehicle value when vehicle value changes
  const vehicleValue = formValues.vehicle?.value;
  useEffect(() => {
    if (vehicleValue !== undefined) {
      setValue("coverage.sumInsured", vehicleValue);
    }
  }, [vehicleValue, setValue]);

  const onSubmitForm = (data: QuickQuoteState) => {
    onChangeBasic(data.basic);
    onChangeVehicle(data.vehicle);
    onChangeCoverage(data.coverage);
    onChangeHistory(data.history);
    onSubmit();
  };

  const onInvalid = (formErrors: any) => {
    toast.error("Please fill in all required fields in the Consolidated Quote Form before proceeding.", {
      duration: 4000,
      style: {
        borderRadius: '12px',
        fontWeight: 'bold',
      },
    });

    const flatErrors = formatZodErrors(quickQuoteSchema.safeParse(formValues).error!);
    const firstErrorKey = Object.keys(flatErrors)[0];
    const errorElement = document.getElementById(`err-label-${firstErrorKey}`);
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} id="consolidated-form-container" className="space-y-8 pb-12">
      {/* CARD 1: Basic & Personal Information */}
      <section
        id="form-sec-basic"
        className="bg-brand-ghost rounded-2xl border border-brand-slate-light/20 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center gap-3.5 mb-6 border-b border-brand-slate-light/20 pb-5">
          <div className="w-[38px] h-[38px] bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-brand-charcoal">
              1. Customer Personal Details
            </h3>
            <p className="text-xs text-brand-slate font-medium">
              Please verify and update customer identity parameters
            </p>
          </div>
        </div>

        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Full Name */}
          <Field className="col-span-1 sm:col-span-2">
            <FieldLabel id="err-label-fullName" htmlFor="basic-fullName">Full Name</FieldLabel>
            <Input
              id="basic-fullName"
              placeholder="Alexander Thorne-Blackwood"
              {...register("basic.fullName")}
              className={errors.basic?.fullName ? "border-red-400 focus:border-red-500" : "bg-white"}
            />
            <FieldError>{errors.basic?.fullName?.message}</FieldError>
          </Field>

          {/* Gender */}
          <Field>
            <FieldLabel id="err-label-gender" htmlFor="basic-gender">Gender</FieldLabel>
            <GenderToggle
              value={formValues.basic?.gender || ""}
              onChange={(val) => setValue("basic.gender", val as any, { shouldTouch: true, shouldValidate: true })}
              hasError={!!errors.basic?.gender}
            />
            <FieldError>{errors.basic?.gender?.message}</FieldError>
          </Field>

          {/* Date of Birth */}
          <Field>
            <FieldLabel id="err-label-dob" htmlFor="basic-dob">Date of Birth</FieldLabel>
            <DatePicker
              id="basic-dob"
              value={formValues.basic?.dob}
              onChange={(val) => setValue("basic.dob", val, { shouldTouch: true, shouldValidate: true })}
              hasError={!!errors.basic?.dob}
              placeholder="Select Date of Birth"
              displayFormat="DD-MM-YYYY"
              className="bg-white"
            />
            <FieldError>{errors.basic?.dob?.message}</FieldError>
          </Field>

          {/* TRN */}
          <Field>
            <FieldLabel id="err-label-trn" htmlFor="basic-trn">Tax Registration Number (TRN)</FieldLabel>
            <Input
              id="basic-trn"
              placeholder="e.g. 123-456-789"
              {...register("basic.trn")}
              className={errors.basic?.trn ? "border-red-400 focus:border-red-500" : "bg-white"}
            />
            <FieldError>{errors.basic?.trn?.message}</FieldError>
          </Field>

          {/* Occupation */}
          <Field>
            <FieldLabel id="err-label-occupation" htmlFor="basic-occupation">Occupation</FieldLabel>
            <ComboboxSearchable
              items={OCCUPATIONS}
              value={formValues.basic?.occupation || ""}
              onValueChange={(val) => setValue("basic.occupation", val, { shouldTouch: true, shouldValidate: true })}
              placeholder="Select Occupation"
              hasError={!!errors.basic?.occupation}
              className="bg-white"
            />
            <FieldError>{errors.basic?.occupation?.message}</FieldError>
          </Field>

          {/* Living / Working in */}
          <Field>
            <FieldLabel id="err-label-livingWorkingIn" htmlFor="basic-livingWorkingIn">Living / Working in (Parish)</FieldLabel>
            <ComboboxSearchable
              items={PARISHES}
              value={formValues.basic?.livingWorkingIn || ""}
              onValueChange={(val) => setValue("basic.livingWorkingIn", val, { shouldTouch: true, shouldValidate: true })}
              placeholder="Select Location"
              hasError={!!errors.basic?.livingWorkingIn}
              className="bg-white"
            />
            <FieldError>{errors.basic?.livingWorkingIn?.message}</FieldError>
          </Field>

          {/* Employer */}
          <Field>
            <FieldLabel id="err-label-employer" htmlFor="basic-employer">Employer</FieldLabel>
            <Input
              id="basic-employer"
              placeholder="Corporate Entity Name"
              {...register("basic.employer")}
              className={errors.basic?.employer ? "border-red-400 focus:border-red-500" : "bg-white"}
            />
            <FieldError>{errors.basic?.employer?.message}</FieldError>
          </Field>

          {/* Email Address */}
          <Field className="col-span-1 sm:col-span-2">
            <FieldLabel id="err-label-email" htmlFor="basic-email">Email Address</FieldLabel>
            <Input
              id="basic-email"
              type="email"
              placeholder="alexander.b@institutional.corp"
              {...register("basic.email")}
              className={errors.basic?.email ? "border-red-400 focus:border-red-500" : "bg-white"}
            />
            <FieldError>{errors.basic?.email?.message}</FieldError>
          </Field>

          {/* Address */}
          <Field className="col-span-1 sm:col-span-2">
            <FieldLabel id="err-label-address" htmlFor="basic-address">Address</FieldLabel>
            <Textarea
              id="basic-address"
              rows={2}
              placeholder="Suite, Building, Street, District"
              {...register("basic.address")}
              className={`resize-none bg-white ${errors.basic?.address ? "border-red-400 focus:border-red-500" : ""}`}
            />
            <FieldError>{errors.basic?.address?.message}</FieldError>
          </Field>

          {/* Telephones group */}
          <Field>
            <FieldLabel id="err-label-telephoneMobile" htmlFor="basic-telephoneMobile">Telephone (Mobile)</FieldLabel>
            <Input
              id="basic-telephoneMobile"
              placeholder="e.g. +1 (876) 381-0000"
              {...register("basic.telephoneMobile")}
              className={errors.basic?.telephoneMobile ? "border-red-400 focus:border-red-500" : "bg-white"}
            />
            <FieldError>{errors.basic?.telephoneMobile?.message}</FieldError>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="basic-telephoneWork">Telephone (Work)</FieldLabel>
              <Input
                id="basic-telephoneWork"
                placeholder="Work"
                {...register("basic.telephoneWork")}
                className="bg-white"
              />
              <FieldError>{errors.basic?.telephoneWork?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="basic-telephoneHome">Telephone (Home)</FieldLabel>
              <Input
                id="basic-telephoneHome"
                placeholder="Home"
                {...register("basic.telephoneHome")}
                className="bg-white"
              />
              <FieldError>{errors.basic?.telephoneHome?.message}</FieldError>
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* CARD 2: Vehicle & Coverage Details Consolidated */}
      <section
        id="form-sec-vehicle"
        className="bg-brand-ghost rounded-2xl border border-brand-slate-light/20 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center gap-3.5 mb-6 border-b border-brand-slate-light/20 pb-5">
          <div className="w-[38px] h-[38px] bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-brand-charcoal">
              2. Vehicle &amp; Coverage Specifications
            </h3>
            <p className="text-xs text-brand-slate font-medium">
              Verify values and insurance types
            </p>
          </div>
        </div>

        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Make & Model */}
          <Field>
            <FieldLabel id="err-label-makeModel" htmlFor="vehicle-makeModel">Vehicle Make &amp; Model</FieldLabel>
            <ComboboxSearchable
              items={vehiclesList}
              value={formValues.vehicle?.makeModel || ""}
              onValueChange={(val) => setValue("vehicle.makeModel", val, { shouldTouch: true, shouldValidate: true })}
              placeholder={isLoadingVehicles ? "Loading vehicles..." : "Search vehicle make/model"}
              hasError={!!errors.vehicle?.makeModel}
              disabled={isLoadingVehicles}
              className="bg-white"
            />
            <FieldError>{errors.vehicle?.makeModel?.message}</FieldError>
          </Field>

          {/* Vehicle Year */}
          <Field>
            <FieldLabel id="err-label-year" htmlFor="vehicle-year">Vehicle Year</FieldLabel>
            <Select
              value={formValues.vehicle?.year ? String(formValues.vehicle.year) : ""}
              onValueChange={(val) => setValue("vehicle.year", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-year" className={`bg-white ${errors.vehicle?.year ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Array.from({ length: 40 }, (_, i) => 2026 - i).map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.vehicle?.year?.message}</FieldError>
          </Field>

          {/* Vehicle Type */}
          <Field>
            <FieldLabel id="err-label-vehicleType" htmlFor="vehicle-vehicleType">Vehicle Type</FieldLabel>
            <Select
              value={formValues.vehicle?.vehicleType || ""}
              onValueChange={(val) => setValue("vehicle.vehicleType", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-vehicleType" className={`bg-white ${errors.vehicle?.vehicleType ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.vehicle?.vehicleType?.message}</FieldError>
          </Field>

          {/* Value of Vehicle */}
          <Field>
            <FieldLabel id="err-label-value" htmlFor="vehicle-value">Value of Vehicle</FieldLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
              <Input
                id="vehicle-value"
                type="number"
                placeholder="4000000"
                {...register("vehicle.value", { valueAsNumber: true })}
                className={`pl-8 bg-white ${errors.vehicle?.value ? 'border-red-400 focus:border-red-500' : ''}`}
              />
            </div>
            <FieldError>{errors.vehicle?.value?.message}</FieldError>
          </Field>

          {/* CC Displacement */}
          <Field>
            <FieldLabel id="err-label-cc" htmlFor="vehicle-cc">CC Displacement</FieldLabel>
            <Input
              id="vehicle-cc"
              type="number"
              placeholder="e.g. 1600"
              {...register("vehicle.cc", { valueAsNumber: true })}
              className={`bg-white ${errors.vehicle?.cc ? 'border-red-400' : ''}`}
            />
            <FieldError>{errors.vehicle?.cc?.message}</FieldError>
          </Field>

          {/* Vehicle Added */}
          <Field>
            <FieldLabel id="err-label-vehicleAdded" htmlFor="vehicle-vehicleAdded">Vehicle Added</FieldLabel>
            <Select
              value={formValues.vehicle?.vehicleAdded || ""}
              onValueChange={(val) => setValue("vehicle.vehicleAdded", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-vehicleAdded" className={`bg-white ${errors.vehicle?.vehicleAdded ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Under 3 months">Under 3 months</SelectItem>
                  <SelectItem value="Over 3 months">Over 3 months</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.vehicle?.vehicleAdded?.message}</FieldError>
          </Field>

          {/* High Performance */}
          <Field>
            <FieldLabel id="err-label-isHighPerformance" htmlFor="vehicle-isHighPerformance">High Performance</FieldLabel>
            <SegmentedToggle
              value={formValues.vehicle?.isHighPerformance || ""}
              onChange={(val) => setValue("vehicle.isHighPerformance", val as any, { shouldTouch: true, shouldValidate: true })}
              options={YES_NO_OPTIONS}
              name="isHighPerformance"
              hasError={!!errors.vehicle?.isHighPerformance}
            />
            <FieldError>{errors.vehicle?.isHighPerformance?.message}</FieldError>
          </Field>

          {/* Valuation completed within 6 months */}
          <Field>
            <FieldLabel id="err-label-valuationCompleted" htmlFor="vehicle-valuationCompleted">Valuation Done within 6 Months</FieldLabel>
            <SegmentedToggle
              value={formValues.vehicle?.valuationCompleted || ""}
              onChange={(val) => setValue("vehicle.valuationCompleted", val as any, { shouldTouch: true, shouldValidate: true })}
              options={YES_NO_OPTIONS}
              name="valuationCompleted"
              hasError={!!errors.vehicle?.valuationCompleted}
            />
            <FieldError>{errors.vehicle?.valuationCompleted?.message}</FieldError>
          </Field>

          {/* Type of Business */}
          <Field>
            <FieldLabel id="err-label-typeOfBusiness" htmlFor="coverage-typeOfBusiness">Type of Business</FieldLabel>
            <Select
              value={formValues.coverage?.typeOfBusiness || ""}
              onValueChange={(val) => {
                setValue("coverage.typeOfBusiness", val, { shouldTouch: true, shouldValidate: true });
                if (val === 'New Business') {
                  setValue("coverage.existingPolicyYear", "1", { shouldTouch: true, shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="coverage-typeOfBusiness" className={`bg-white ${errors.coverage?.typeOfBusiness ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Business Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Renewal">Renewal</SelectItem>
                  <SelectItem value="New Business">New Business</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.coverage?.typeOfBusiness?.message}</FieldError>
          </Field>

          {/* Existing Policy Year */}
          <Field>
            <FieldLabel id="err-label-existingPolicyYear" htmlFor="coverage-existingPolicyYear">Existing Policy Year</FieldLabel>
            <Select
              value={formValues.coverage?.existingPolicyYear || ""}
              onValueChange={(val) => setValue("coverage.existingPolicyYear", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="coverage-existingPolicyYear" className={`bg-white ${errors.coverage?.existingPolicyYear ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Policy Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {formValues.coverage?.typeOfBusiness === "New Business" ? (
                    <SelectItem value="1">1</SelectItem>
                  ) : formValues.coverage?.typeOfBusiness === "Renewal" ? (
                    <>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="1">1</SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.coverage?.existingPolicyYear?.message}</FieldError>
          </Field>

          {/* Insurance Product */}
          <Field>
            <FieldLabel id="err-label-insuranceProduct" htmlFor="coverage-insuranceProduct">Insurance Product</FieldLabel>
            <Select
              value={formValues.coverage?.insuranceProduct || ""}
              onValueChange={(val) => {
                setValue("coverage.insuranceProduct", val, { shouldTouch: true, shouldValidate: true });
                const newOptions = getCoverTypeOptions(val);
                const currentCoverType = formValues.coverage?.coverType;
                if (!newOptions.includes(currentCoverType)) {
                  setValue("coverage.coverType", "", { shouldTouch: true, shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="coverage-insuranceProduct" className={`bg-white ${errors.coverage?.insuranceProduct ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {INSURANCE_PRODUCTS.map((prod) => (
                    <SelectItem key={prod} value={prod}>
                      {prod}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.coverage?.insuranceProduct?.message}</FieldError>
          </Field>

          {/* Cover Type */}
          <Field>
            <FieldLabel id="err-label-coverType" htmlFor="coverage-coverType">Cover Type</FieldLabel>
            <Select
              value={formValues.coverage?.coverType || ""}
              onValueChange={(val) => setValue("coverage.coverType", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="coverage-cover-type" className={`bg-white ${errors.coverage?.coverType ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Cover Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {getCoverTypeOptions(formValues.coverage?.insuranceProduct || "").map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.coverage?.coverType?.message}</FieldError>
          </Field>

          {/* Include Theft Protection */}
          <Field className="col-span-1 sm:col-span-2 flex items-center justify-between py-2 border-b border-slate-100 flex-row [&>*]:w-auto">
            <div>
              <span className="block text-xs font-black text-brand-charcoal">Include Theft Protection</span>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Premium security package for high-theft areas</span>
            </div>
            <div className="shrink-0">
              <SegmentedToggle
                value={formValues.coverage?.includeTheftProtection || ""}
                onChange={(val) => setValue("coverage.includeTheftProtection", val as any, { shouldTouch: true, shouldValidate: true })}
                options={YES_NO_OPTIONS}
                name="includeTheftProtection"
                hasError={!!errors.coverage?.includeTheftProtection}
              />
              <FieldError>{errors.coverage?.includeTheftProtection?.message}</FieldError>
            </div>
          </Field>

          {/* Third Party Add-on */}
          <Field className="col-span-1 sm:col-span-2 flex items-center justify-between py-2 flex-row [&>*]:w-auto">
            <div>
              <span className="block text-xs font-black text-brand-charcoal">Third Party Add-on</span>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Adds third-party liability coverage as per policy requirements.</span>
            </div>
            <div className="shrink-0">
              <SegmentedToggle
                value={formValues.coverage?.thirdPartyAddon || ""}
                onChange={(val) => setValue("coverage.thirdPartyAddon", val as any, { shouldTouch: true, shouldValidate: true })}
                options={REQUIRED_NO_OPTIONS}
                name="thirdPartyAddon"
                hasError={!!errors.coverage?.thirdPartyAddon}
              />
              <FieldError>{errors.coverage?.thirdPartyAddon?.message}</FieldError>
            </div>
          </Field>
        </FieldGroup>
      </section>

      {/* CARD 3: Driving & History Details */}
      <section
        id="form-sec-history"
        className="bg-brand-ghost rounded-2xl border border-brand-slate-light/20 shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow duration-300"
      >
        <div className="flex items-center gap-3.5 mb-6 border-b border-brand-slate-light/20 pb-5">
          <div className="w-[38px] h-[38px] bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-brand-charcoal">
              3. Claims &amp; Driving History
            </h3>
            <p className="text-xs text-brand-slate font-medium">
              Verify license issue date and NCB status
            </p>
          </div>
        </div>

        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* License Issue Date */}
          <Field>
            <FieldLabel id="err-label-licenseIssueDate" htmlFor="history-licenseIssueDate">License Issue Date</FieldLabel>
            <DatePicker
              id="history-licenseIssueDate"
              value={formValues.history?.licenseIssueDate}
              onChange={(val) => setValue("history.licenseIssueDate", val, { shouldTouch: true, shouldValidate: true })}
              hasError={!!errors.history?.licenseIssueDate}
              placeholder="Select Date"
              className="bg-white"
            />
            <FieldError>{errors.history?.licenseIssueDate?.message}</FieldError>
          </Field>

          {/* First Time Insured */}
          <Field>
            <FieldLabel id="err-label-firstTimeInsured" htmlFor="history-firstTimeInsured">First Time Insured?</FieldLabel>
            <SegmentedToggle
              value={formValues.history?.firstTimeInsured || ""}
              onChange={(val) => {
                setValue("history.firstTimeInsured", val as any, { shouldTouch: true, shouldValidate: true });
                if (val === "Yes") {
                  setValue("history.previousInsurerCarrier", "");
                }
              }}
              options={YES_NO_OPTIONS}
              name="firstTimeInsured"
              hasError={!!errors.history?.firstTimeInsured}
            />
            <FieldError>{errors.history?.firstTimeInsured?.message}</FieldError>
          </Field>

          {/* Previous Insurer Carrier */}
          {formValues.history?.firstTimeInsured === "No" && (
            <Field className="col-span-1 sm:col-span-2">
              <FieldLabel id="err-label-previousInsurerCarrier" htmlFor="history-previousInsurerCarrier">Previous Carrier</FieldLabel>
              <ComboboxSearchable
                items={PREVIOUS_CARRIERS}
                value={formValues.history?.previousInsurerCarrier || ""}
                onValueChange={(val) => setValue("history.previousInsurerCarrier", val, { shouldTouch: true, shouldValidate: true })}
                placeholder="Select Previous Carrier"
                hasError={!!errors.history?.previousInsurerCarrier}
                className="bg-white"
              />
              <FieldError>{errors.history?.previousInsurerCarrier?.message}</FieldError>
            </Field>
          )}

          {/* No Claim Bonus */}
          <Field>
            <FieldLabel id="err-label-hasNoClaimBonus" htmlFor="history-hasNoClaimBonus">No Claim Bonus / Discount?</FieldLabel>
            <SegmentedToggle
              value={formValues.history?.hasNoClaimBonus || ""}
              onChange={(val) => setValue("history.hasNoClaimBonus", val as any, { shouldTouch: true, shouldValidate: true })}
              options={YES_NO_OPTIONS}
              name="hasNoClaimBonus"
              hasError={!!errors.history?.hasNoClaimBonus}
            />
            <FieldError>{errors.history?.hasNoClaimBonus?.message}</FieldError>
          </Field>

          {/* NCB Tenure Years */}
          {formValues.history?.hasNoClaimBonus === "Yes" && (
            <>
              <Field>
                <FieldLabel id="err-label-ncbYears" htmlFor="history-ncbYears">No Claim Bonus / Discount Year</FieldLabel>
                <Select
                  value={formValues.history?.ncbYears || ""}
                  onValueChange={(val) => setValue("history.ncbYears", val, { shouldTouch: true, shouldValidate: true })}
                >
                  <SelectTrigger id="history-ncbYears" className={`bg-white ${errors.history?.ncbYears ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                    <SelectValue placeholder="Select Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="1 Year">1 Year</SelectItem>
                      <SelectItem value="2 Years">2 Years</SelectItem>
                      <SelectItem value="3 Years">3 Years</SelectItem>
                      <SelectItem value="4 Years">4 Years</SelectItem>
                      <SelectItem value="5 Years">5 Years</SelectItem>
                      <SelectItem value="5+ Years">5+ Years</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{errors.history?.ncbYears?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel id="err-label-ncbPercent" htmlFor="history-ncbPercent">No Claim Bonus % Earned</FieldLabel>
                <Select
                  value={formValues.history?.ncbPercent !== undefined && formValues.history?.ncbPercent !== null ? String(formValues.history.ncbPercent) : ""}
                  onValueChange={(val) => setValue("history.ncbPercent", parseInt(val, 10) || 0, { shouldTouch: true, shouldValidate: true })}
                >
                  <SelectTrigger id="history-ncbPercent" className={`bg-white ${errors.history?.ncbPercent ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                    <SelectValue placeholder="Select %" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">45%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="60">60%</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{errors.history?.ncbPercent?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel id="err-label-ncbAmount" htmlFor="history-ncbAmount">How Much Has Been Earned ($)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <Input
                    id="history-ncbAmount"
                    placeholder="120000"
                    {...register("history.ncbAmount")}
                    className={`pl-6 bg-white ${errors.history?.ncbAmount ? 'border-red-400' : ''}`}
                  />
                </div>
                <FieldError>{errors.history?.ncbAmount?.message}</FieldError>
              </Field>
            </>
          )}

          {/* Accident History */}
          <Field>
            <FieldLabel id="err-label-hasAccidentHistory" htmlFor="history-hasAccidentHistory">Accident History (Last 5 Years)</FieldLabel>
            <SegmentedToggle
              value={formValues.history?.hasAccidentHistory || ""}
              onChange={(val) => setValue("history.hasAccidentHistory", val as any, { shouldTouch: true, shouldValidate: true })}
              options={YES_NO_OPTIONS}
              name="hasAccidentHistory"
              hasError={!!errors.history?.hasAccidentHistory}
            />
            <FieldError>{errors.history?.hasAccidentHistory?.message}</FieldError>
          </Field>

          {/* Main Driver Gender */}
          <Field>
            <FieldLabel id="err-label-mainDriverGender" htmlFor="history-mainDriverGender">Main Driver</FieldLabel>
            <GenderToggle
              value={formValues.history?.mainDriverGender || ""}
              onChange={(val) => setValue("history.mainDriverGender", val as any, { shouldTouch: true, shouldValidate: true })}
              hasError={!!errors.history?.mainDriverGender}
            />
            <FieldError>{errors.history?.mainDriverGender?.message}</FieldError>
          </Field>

          {/* Number of Additional Drivers */}
          <Field>
            <FieldLabel id="err-label-additionalDrivers" htmlFor="history-additionalDrivers">Additional Drivers</FieldLabel>
            <Select
              value={formValues.history?.additionalDrivers || ""}
              onValueChange={(val) => setValue("history.additionalDrivers", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="history-additionalDrivers" className={`bg-white ${errors.history?.additionalDrivers ? "border-red-400 focus:ring-red-400/20" : ""}`}>
                <SelectValue placeholder="Select Additional Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ADDITIONAL_DRIVERS.map((driver) => (
                    <SelectItem key={driver} value={driver}>
                      {driver}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.history?.additionalDrivers?.message}</FieldError>
          </Field>

          {/* Manual Load % */}
          <Field>
            <FieldLabel id="err-label-manualLoadPercentage" htmlFor="history-manualLoadPercentage">Manual Load %</FieldLabel>
            <div className="relative">
              <Input
                id="history-manualLoadPercentage"
                type="number"
                placeholder="0"
                {...register("history.manualLoadPercentage", { valueAsNumber: true })}
                className="bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
            <FieldError>{errors.history?.manualLoadPercentage?.message}</FieldError>
          </Field>
        </FieldGroup>
      </section>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-6 select-none border-t border-brand-slate-light/20">
        <button
          type="submit"
          className="px-8 py-3.5 bg-brand-indigo hover:bg-brand-blue text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition duration-200 active:scale-97 border-none"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
