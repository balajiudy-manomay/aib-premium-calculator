"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { QuickQuoteState, VehicleDetails, CoverageDetails } from '@/types';
import { Car, ShieldCheck } from 'lucide-react';
import Stepper from './Stepper';
import ResetFormButton from './ResetFormButton';
import { VEHICLE_TYPES, INSURANCE_PRODUCTS, getCoverTypeOptions } from "@/data";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ComboboxSearchable } from "@/components/ui/combobox-searchable";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { vehicleDetailsSchema, coverageDetailsSchema, formatZodErrors, customZodResolver } from "@/config/validation-schemas";
import SegmentedToggle from "./SegmentedToggle";

const YES_NO_OPTIONS = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const REQUIRED_NO_OPTIONS = [
  { label: "Required", value: "Required" },
  { label: "No", value: "No" },
];

interface VehicleCoverageFormProps {
  state: QuickQuoteState;
  onChangeVehicle: (data: Partial<VehicleDetails>) => void;
  onChangeCoverage: (data: Partial<CoverageDetails>) => void;
}

interface FormValues {
  vehicle: VehicleDetails;
  coverage: CoverageDetails;
}

export default function VehicleCoverageForm({
  state,
  onChangeVehicle,
  onChangeCoverage,
}: VehicleCoverageFormProps) {
  const router = useRouter();
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
  } = useForm<FormValues>({
    resolver: customZodResolver(
      z.object({
        vehicle: vehicleDetailsSchema,
        coverage: coverageDetailsSchema,
      })
    ) as any,
    defaultValues: {
      vehicle: state.vehicle,
      coverage: state.coverage,
    },
    mode: "onTouched",
  });

  const formValues = watch();

  // Watch and sync state in real-time
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

  // Synchronize sumInsured with vehicle value when vehicle value changes
  const vehicleValue = formValues.vehicle?.value;
  useEffect(() => {
    if (vehicleValue !== undefined) {
      setValue("coverage.sumInsured", vehicleValue);
    }
  }, [vehicleValue, setValue]);

  const onSubmitForm = (data: FormValues) => {
    onChangeVehicle(data.vehicle);
    onChangeCoverage(data.coverage);
    router.push('/quote/history');
  };

  const onInvalid = (formErrors: any) => {
    toast.error("Please fill in all required fields in the Vehicle & Coverage step.", {
      duration: 4000,
      style: { borderRadius: '12px', fontWeight: 'bold' }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} className="space-y-6 animate-fade-in">
      {/* 1. Page Title & Stepper */}
      <div className="space-y-6 select-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-brand-indigo tracking-tight">
            Quick Quote (Vehicle Information)
          </h2>
          <ResetFormButton />
        </div>
        <Stepper activeStep={2} />
      </div>

      {/* CARD 1: Motor Vehicle Information */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-brand-indigo">
            Motor Vehicle Information
          </h3>
        </div>

        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Vehicle Type */}
          <Field>
            <FieldLabel htmlFor="vehicle-type">Vehicle Type</FieldLabel>
            <Select
              value={formValues.vehicle?.vehicleType || ""}
              onValueChange={(val) => setValue("vehicle.vehicleType", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-type" className={errors.vehicle?.vehicleType ? "border-red-400 focus:ring-red-400/20" : ""}>
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

          {/* Vehicle Year */}
          <Field>
            <FieldLabel htmlFor="vehicle-year">Vehicle Year</FieldLabel>
            <Select
              value={formValues.vehicle?.year ? String(formValues.vehicle.year) : ""}
              onValueChange={(val) => setValue("vehicle.year", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-year" className={errors.vehicle?.year ? "border-red-400 focus:ring-red-400/20" : ""}>
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

          {/* Value of Vehicle */}
          <Field>
            <FieldLabel htmlFor="vehicle-value">Value of Vehicle</FieldLabel>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
              <Input
                id="vehicle-value"
                type="number"
                placeholder="4000000"
                {...register("vehicle.value", { valueAsNumber: true })}
                className={`pl-8 ${errors.vehicle?.value ? 'border-red-400 focus:border-red-500' : ''}`}
              />
            </div>
            <FieldError>{errors.vehicle?.value?.message}</FieldError>
          </Field>

          {/* Make & Model */}
          <Field>
            <FieldLabel htmlFor="vehicle-makemodel">Make & Model</FieldLabel>
            <ComboboxSearchable
              items={vehiclesList}
              value={formValues.vehicle?.makeModel || ""}
              onValueChange={(val) => setValue("vehicle.makeModel", val, { shouldTouch: true, shouldValidate: true })}
              placeholder={isLoadingVehicles ? "Loading vehicles..." : "Search vehicle make/model"}
              hasError={!!errors.vehicle?.makeModel}
              disabled={isLoadingVehicles}
            />
            <FieldError>{errors.vehicle?.makeModel?.message}</FieldError>
          </Field>

          {/* Chassis Number */}
          <Field>
            <FieldLabel htmlFor="vehicle-chassisnumber">Chassis Number</FieldLabel>
            <Input
              id="vehicle-chassisnumber"
              placeholder="e.g. 1HGCR2F8XHA000000"
              {...register("vehicle.chassisNumber")}
              className={errors.vehicle?.chassisNumber ? "border-red-400 focus:border-red-500" : ""}
            />
            <FieldError>{errors.vehicle?.chassisNumber?.message}</FieldError>
          </Field>

          {/* Is High Performance */}
          <Field>
            <FieldLabel htmlFor="isHighPerformance">Is it a high performance vehicle?</FieldLabel>
            <SegmentedToggle
              value={formValues.vehicle?.isHighPerformance || ""}
              onChange={(val) => setValue("vehicle.isHighPerformance", val as any, { shouldTouch: true, shouldValidate: true })}
              options={YES_NO_OPTIONS}
              name="isHighPerformance"
              hasError={!!errors.vehicle?.isHighPerformance}
            />
            <FieldError>{errors.vehicle?.isHighPerformance?.message}</FieldError>
          </Field>

          {/* Valuation Completed */}
          <Field>
            <FieldLabel htmlFor="valuationCompleted">Valuation Completed (within 6 months)</FieldLabel>
            <SegmentedToggle
              value={formValues.vehicle?.valuationCompleted || ""}
              onChange={(val) => setValue("vehicle.valuationCompleted", val as any, { shouldTouch: true, shouldValidate: true })}
              options={YES_NO_OPTIONS}
              name="valuationCompleted"
              hasError={!!errors.vehicle?.valuationCompleted}
            />
            <FieldError>{errors.vehicle?.valuationCompleted?.message}</FieldError>
          </Field>

          {/* CC Displacement */}
          <Field>
            <FieldLabel htmlFor="vehicle-cc">Enter CC of your vehicle</FieldLabel>
            <Input
              id="vehicle-cc"
              type="number"
              placeholder="Eg: 1600"
              {...register("vehicle.cc", { valueAsNumber: true })}
              className={errors.vehicle?.cc ? 'border-red-400' : ''}
            />
            <FieldError>{errors.vehicle?.cc?.message}</FieldError>
          </Field>

          {/* Use */}
          <Field>
            <FieldLabel htmlFor="vehicle-use">Use</FieldLabel>
            <Select
              value={formValues.vehicle?.use || ""}
              onValueChange={(val) => setValue("vehicle.use", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-use" className={errors.vehicle?.use ? "border-red-400 focus:ring-red-400/20" : ""}>
                <SelectValue placeholder="Select Use" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Private Use">Private Use</SelectItem>
                  <SelectItem value="Business Use">Business Use</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError>{errors.vehicle?.use?.message}</FieldError>
          </Field>

          {/* Vehicle Added */}
          <Field>
            <FieldLabel htmlFor="vehicle-added">Vehicle Added</FieldLabel>
            <Select
              value={formValues.vehicle?.vehicleAdded || ""}
              onValueChange={(val) => setValue("vehicle.vehicleAdded", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="vehicle-added" className={errors.vehicle?.vehicleAdded ? "border-red-400 focus:ring-red-400/20" : ""}>
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
        </FieldGroup>
      </section>

      {/* CARD 2: Coverage Details */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-brand-indigo">
            Coverage Details
          </h3>
        </div>

        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Type of Business */}
          <Field>
            <FieldLabel htmlFor="coverage-business-type">Type of Business</FieldLabel>
            <Select
              value={formValues.coverage?.typeOfBusiness || ""}
              onValueChange={(val) => {
                setValue("coverage.typeOfBusiness", val, { shouldTouch: true, shouldValidate: true });
                if (val === 'New Business') {
                  setValue("coverage.existingPolicyYear", "1", { shouldTouch: true, shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="coverage-business-type" className={errors.coverage?.typeOfBusiness ? "border-red-400 focus:ring-red-400/20" : ""}>
                <SelectValue placeholder="Select Business Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Renewal">Renewal</SelectItem>
                  <SelectItem value="New Business">New Business</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <span className="text-[9px] text-slate-400 block mt-1 font-bold">
              Determines whether this is a new policy or renewal.
            </span>
            <FieldError>{errors.coverage?.typeOfBusiness?.message}</FieldError>
          </Field>

          {/* Existing Policy Year */}
          <Field>
            <FieldLabel htmlFor="coverage-policy-year">Existing Policy Year</FieldLabel>
            <Select
              value={formValues.coverage?.existingPolicyYear || ""}
              onValueChange={(val) => setValue("coverage.existingPolicyYear", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="coverage-policy-year" className={errors.coverage?.existingPolicyYear ? "border-red-400 focus:ring-red-400/20" : ""}>
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
            <span className="text-[9px] text-slate-400 block mt-1 font-bold">
              Applicable only for renewals.
            </span>
            <FieldError>{errors.coverage?.existingPolicyYear?.message}</FieldError>
          </Field>

          {/* Insurance Product */}
          <Field>
            <FieldLabel htmlFor="coverage-product">Insurance Product</FieldLabel>
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
              <SelectTrigger id="coverage-product" className={errors.coverage?.insuranceProduct ? "border-red-400 focus:ring-red-400/20" : ""}>
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
            <span className="text-[9px] text-slate-400 block mt-1 font-bold">
              Affects available coverage options.
            </span>
            <FieldError>{errors.coverage?.insuranceProduct?.message}</FieldError>
          </Field>

          {/* Cover Type */}
          <Field>
            <FieldLabel htmlFor="coverage-cover-type">Cover Type</FieldLabel>
            <Select
              value={formValues.coverage?.coverType || ""}
              onValueChange={(val) => setValue("coverage.coverType", val, { shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger id="coverage-cover-type" className={errors.coverage?.coverType ? "border-red-400 focus:ring-red-400/20" : ""}>
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
            <span className="text-[9px] text-slate-400 block mt-1 font-bold">
              Defines level of coverage.
            </span>
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

      {/* 3. Footer Action */}
      <div className="flex items-center justify-end pt-4 select-none">
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/quote')}
            type="button"
            className="px-6 py-3 bg-white border border-slate-250 text-brand-slate hover:bg-slate-50 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition active:scale-97"
          >
            Back
          </button>

          <button
            type="submit"
            className="px-8 py-3 bg-brand-indigo hover:bg-brand-blue text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition duration-200 active:scale-97 border-none"
          >
            Next
          </button>
        </div>
      </div>
    </form>
  );
}
