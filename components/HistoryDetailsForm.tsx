"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { QuickQuoteState, HistoryDetails } from "@/types";
import { History, Award, Users, AlertOctagon, HelpCircle } from "lucide-react";
import Stepper from "./Stepper";
import ResetFormButton from "./ResetFormButton";
import SegmentedToggle from "./SegmentedToggle";
import { PREVIOUS_CARRIERS, ADDITIONAL_DRIVERS } from "../data";
import GenderToggle from "./GenderToggle";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "./ui/date-picker";
import { historyDetailsSchema, formatZodErrors } from "@/config/validation-schemas";

interface HistoryDetailsFormProps {
  state: QuickQuoteState;
  onChangeHistory: (data: Partial<HistoryDetails>) => void;
  onSubmit: () => void;
}

export default function HistoryDetailsForm({
  state,
  onChangeHistory,
  onSubmit,
}: HistoryDetailsFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndSubmit = () => {
    const result = historyDetailsSchema.safeParse(state.history);
    if (!result.success) {
      const nextErrors = formatZodErrors(result.error);
      setErrors(nextErrors);
      toast.error("Please fill in all required fields in the Driving Details & History step.", {
        duration: 4000,
        style: { borderRadius: '12px', fontWeight: 'bold' }
      });
      return;
    }

    setErrors({});
    onSubmit();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Page Title & Stepper */}
      <div className="space-y-6 select-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-brand-indigo tracking-tight">
            Quick Quote (History)
          </h2>
          <ResetFormButton />
        </div>
        <Stepper activeStep={3} />
      </div>

      {/* CARD 1: Driving Details */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-brand-indigo">
            Driving Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* License Issue Date */}
          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              License Issue Date
            </label>
            <DatePicker
              value={state.history.licenseIssueDate}
              onChange={(val) => {
                onChangeHistory({ licenseIssueDate: val });
                if (errors.licenseIssueDate)
                  setErrors({ ...errors, licenseIssueDate: "" });
              }}
              hasError={!!errors.licenseIssueDate}
              placeholder="Select Issue Date"
              displayFormat="DD-MM-YYYY"
            />
            {errors.licenseIssueDate && (
              <p className="text-[10px] text-red-500 font-bold mt-1">
                {errors.licenseIssueDate}
              </p>
            )}
          </div>

          {/* First Time Insured */}
          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              First Time Insured?
            </label>
            <div className="py-1">
              <SegmentedToggle
                value={state.history.firstTimeInsured}
                onChange={(val) => {
                  const updates: Partial<HistoryDetails> = { firstTimeInsured: val as any };
                  if (val === "Yes") {
                    updates.previousInsurerCarrier = "";
                  }
                  onChangeHistory(updates);
                }}
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                ]}
                name="firstTimeInsured"
               hasError={!!errors.firstTimeInsured}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CARD 2: Previous Insurer */}
      {state.history.firstTimeInsured === "No" && (
        <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-brand-blue" />
            </div>
            <h3 className="text-base font-extrabold text-brand-indigo">
              Previous Insurer
            </h3>
          </div>

          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              Carrier Name
            </label>
              <Select
                value={state.history.previousInsurerCarrier || undefined}
                onValueChange={(val) => onChangeHistory({ previousInsurerCarrier: val })}
              >
                <SelectTrigger className={errors.previousInsurerCarrier ? "border-red-400 focus:ring-red-400/20 " : "border-slate-200"}>
                  <SelectValue placeholder="Select Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PREVIOUS_CARRIERS.map((carrier) => (
                      <SelectItem key={carrier} value={carrier}>
                        {carrier}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
          </div>
        </section>
      )}

      {/* CARD 3: No Claim Bonus */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-brand-indigo">
            No Claim Bonus
          </h3>
        </div>

        <div className="space-y-5">
          {/* Earning bonus check */}
          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              Are you earning a No Claim Bonus/Discount?
            </label>
            <div className="py-1">
              <SegmentedToggle
                value={state.history.hasNoClaimBonus}
                onChange={(val) => onChangeHistory({ hasNoClaimBonus: val })}
                options={[
                  { label: "Yes", value: "Yes" },
                  { label: "No", value: "No" },
                ]}
                name="hasNoClaimBonus"
               hasError={!!errors.hasNoClaimBonus}
              />
            </div>
          </div>

          {/* NCB Details Group side-by-side (Image 3) */}
          {state.history.hasNoClaimBonus === "Yes" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-2">
                  No Claim Bonus / Discount Year
                </label>
                <Select
                  value={state.history.ncbYears || undefined}
                  onValueChange={(val) => onChangeHistory({ ncbYears: val })}
                >
                  <SelectTrigger className={errors.hasNoClaimBonus ? "border-red-400 focus:ring-red-400/20 " : "border-slate-200"}>
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
              </div>

              <div>
                <label className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-2">
                  No Claim Bonus % Earned
                </label>
                <Select
                  value={state.history.ncbPercent?.toString()}
                  onValueChange={(val) => {
                    onChangeHistory({ ncbPercent: parseInt(val, 10) || 0 });
                    if (errors.ncbPercent) setErrors({ ...errors, ncbPercent: "" });
                  }}
                >
                  <SelectTrigger className={errors.ncbPercent ? "border-red-400 focus:ring-red-400/20 " : "border-slate-200"}>
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
                {errors.ncbPercent && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.ncbPercent}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-2">
                  How Much Has Been Earned ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="text"
                    value={state.history.ncbAmount}
                    onChange={(e) => {
                      onChangeHistory({ ncbAmount: e.target.value });
                      if (errors.ncbAmount) setErrors({ ...errors, ncbAmount: "" });
                    }}
                    placeholder="120000"
                    className={`w-full pl-6 pr-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border ${errors.ncbAmount ? 'border-red-400 focus:border-red-500' : 'border-slate-200'} text-brand-charcoal outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20`}
                  />
                </div>
                {errors.ncbAmount && (
                  <p className="text-[10px] text-red-500 font-bold mt-1">
                    {errors.ncbAmount}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CARD 4: Accident History */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-indigo">
                Accident History
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                Incidents occurring in the last 5 years.
              </p>
            </div>
          </div>

          <div className="shrink-0 py-1">
            <SegmentedToggle
              value={state.history.hasAccidentHistory}
              onChange={(val) => onChangeHistory({ hasAccidentHistory: val })}
              options={[
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ]}
              name="hasAccidentHistory"
             hasError={!!errors.hasAccidentHistory}
              />
          </div>
        </div>
      </section>

      {/* CARD 5: Driver Composition */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-brand-indigo">
            Driver Composition
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
          {/* Main Driver Gender */}
          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              Main Driver
            </label>
            <GenderToggle
              name="main-driver-gender"
              value={state.history.mainDriverGender}
              onChange={(value) => onChangeHistory({ mainDriverGender: value })}
             hasError={!!errors.mainDriverGender}
            />
          </div>

          {/* Number of Additional Drivers */}
          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              Number of Additional Drivers
            </label>
              <Select
                value={state.history.additionalDrivers || undefined}
                onValueChange={(val) => {
                  onChangeHistory({ additionalDrivers: val });
                  if (errors.additionalDrivers) setErrors({ ...errors, additionalDrivers: "" });
                }}
              >
                <SelectTrigger className={errors.additionalDrivers ? "border-red-400 focus:ring-red-400/20 " : "border-slate-200"}>
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
              {errors.additionalDrivers && (
                <p className="text-[10px] text-red-500 font-bold mt-1">
                  {errors.additionalDrivers}
                </p>
              )}
          </div>

          {/* Manual Load % */}
          <div>
            <label className="block text-[9px] font-black text-brand-slate tracking-wider uppercase mb-2">
              Manual Load %
            </label>
            <div className="relative">
              <input
                type="number"
                value={state.history.manualLoadPercentage || ""}
                onChange={(e) =>
                  onChangeHistory({ manualLoadPercentage: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
                className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-brand-charcoal outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                %
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Footer Action */}
      <div className="flex items-center justify-end pt-4 select-none">
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/quote/vehicle")}
            type="button"
            className="px-6 py-3 bg-white border border-slate-250 text-brand-slate hover:bg-slate-50 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition active:scale-97"
          >
            Back
          </button>

          <button
            onClick={validateAndSubmit}
            type="button"
            className="px-8 py-3 bg-brand-indigo hover:bg-brand-blue text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition duration-200 active:scale-97 border-none"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
