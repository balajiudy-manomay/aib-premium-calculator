"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { QuickQuoteState, BasicDetails } from "@/types";
import { PARISHES, OCCUPATIONS } from "@/data";
import { UserCheck } from "lucide-react";
import Stepper from "./Stepper";
import ResetFormButton from "./ResetFormButton";
import { DatePicker } from "./ui/date-picker";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ComboboxSearchable } from "@/components/ui/combobox-searchable";
import { basicDetailsSchema, formatZodErrors, customZodResolver, formatAddress } from "@/config/validation-schemas";

import GenderToggle from "./GenderToggle";

interface BasicDetailsFormProps {
  state: QuickQuoteState;
  onChangeBasic: (data: Partial<BasicDetails>) => void;
}

export default function BasicDetailsForm({
  state,
  onChangeBasic,
}: BasicDetailsFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BasicDetails>({
    resolver: customZodResolver(basicDetailsSchema) as any,
    defaultValues: state.basic,
    mode: "onTouched",
  });

  // Watch all fields and sync them to the parent context state in real-time
  const formValues = watch();
  useEffect(() => {
    const computedAddress = formatAddress(formValues);
    const updated = { ...formValues, address: computedAddress };
    if (JSON.stringify(updated) !== JSON.stringify(state.basic)) {
      onChangeBasic(updated);
    }
  }, [formValues, onChangeBasic, state.basic]);

  const onSubmitForm = (data: BasicDetails) => {
    const computedAddress = formatAddress(data);
    const finalData = { ...data, address: computedAddress };
    onChangeBasic(finalData);
    router.push("/quote/vehicle");
  };

  const onInvalid = (formErrors: any) => {
    toast.error("Please fill in all required fields in the Basic Details step.", {
      duration: 4000,
      style: { borderRadius: "12px", fontWeight: "bold" },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm, onInvalid)} className="space-y-6 animate-fade-in">
      {/* 1. Page Title & Stepper */}
      <div className="space-y-6 select-none">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-brand-indigo tracking-tight">
            Quick Quote (Basic Details)
          </h2>
          <ResetFormButton />
        </div>
        <Stepper activeStep={1} />
      </div>

      {/* 2. Customer Details Card Panel */}
      <section className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 space-y-6">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-brand-indigo">
            Basic Details
          </h3>
        </div>

        {/* Inputs Grid */}
        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Full Name */}
          <Field className="col-span-1 sm:col-span-2">
            <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
            <Input
              id="fullName"
              placeholder="Alexander Thorne-Blackwood"
              {...register("fullName")}
              className={errors.fullName ? "border-red-400 focus:border-red-500" : ""}
            />
            <FieldError>{errors.fullName?.message}</FieldError>
          </Field>

          {/* Gender */}
          <Field>
            <FieldLabel htmlFor="gender">Gender</FieldLabel>
            <GenderToggle
              value={formValues.gender || ""}
              onChange={(val) => setValue("gender", val as any, { shouldTouch: true, shouldValidate: true })}
              hasError={!!errors.gender}
            />
            <FieldError>{errors.gender?.message}</FieldError>
          </Field>

          {/* Date of Birth */}
          <Field>
            <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
            <DatePicker
              id="dob"
              value={formValues.dob}
              onChange={(val) => setValue("dob", val, { shouldTouch: true, shouldValidate: true })}
              hasError={!!errors.dob}
              placeholder="Select Date of Birth"
              displayFormat="DD-MM-YYYY"
            />
            <FieldError>{errors.dob?.message}</FieldError>
          </Field>

          {/* TRN */}
          <Field>
            <FieldLabel htmlFor="trn">TRN</FieldLabel>
            <Input
              id="trn"
              placeholder="E.G. 123-456-789"
              {...register("trn")}
              className={errors.trn ? "border-red-400 focus:border-red-500" : ""}
            />
            <FieldError>{errors.trn?.message}</FieldError>
          </Field>

          {/* Occupation */}
          <Field>
            <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
            <ComboboxSearchable
              items={OCCUPATIONS}
              value={formValues.occupation || ""}
              onValueChange={(val) => setValue("occupation", val, { shouldTouch: true, shouldValidate: true })}
              placeholder="Select Occupation"
              hasError={!!errors.occupation}
            />
            <FieldError>{errors.occupation?.message}</FieldError>
          </Field>

          {/* Living / Working in */}
          <Field>
            <FieldLabel htmlFor="livingWorkingIn">Living/Working in</FieldLabel>
            <ComboboxSearchable
              items={PARISHES}
              value={formValues.livingWorkingIn || ""}
              onValueChange={(val) => setValue("livingWorkingIn", val, { shouldTouch: true, shouldValidate: true })}
              placeholder="Select Location"
              hasError={!!errors.livingWorkingIn}
            />
            <FieldError>{errors.livingWorkingIn?.message}</FieldError>
          </Field>

          {/* Employer */}
          <Field>
            <FieldLabel htmlFor="employer">Employer</FieldLabel>
            <Input
              id="employer"
              placeholder="Corporate Entity Name"
              {...register("employer")}
              className={errors.employer ? "border-red-400 focus:border-red-500" : ""}
            />
            <FieldError>{errors.employer?.message}</FieldError>
          </Field>

          {/* Address breakdown fields */}
          <div className="col-span-1 sm:col-span-2 space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">Address Details</h4>

            {/* 1. Block and Building Name*/}
            <Field>
              <FieldLabel htmlFor="blockBuildingName">Block & Building Name</FieldLabel>
              <Input
                id="blockBuildingName"
                maxLength={65}
                placeholder="E.g. Block A, Sunset Apartments"
                {...register("blockBuildingName")}
                className={errors.blockBuildingName ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError>{errors.blockBuildingName?.message}</FieldError>
            </Field>

            {/* 2-5. Street, City, State, Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="street">Street</FieldLabel>
                <Input
                  id="street"
                  maxLength={65}
                  placeholder="E.g. 12 Hope Road"
                  {...register("street")}
                  className={errors.street ? "border-red-400 focus:border-red-500" : ""}
                />
                <FieldError>{errors.street?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  maxLength={65}
                  placeholder="E.g. Kingston"
                  {...register("city")}
                  className={errors.city ? "border-red-400 focus:border-red-500" : ""}
                />
                <FieldError>{errors.city?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="state">State / Parish</FieldLabel>
                <Input
                  id="state"
                  maxLength={65}
                  placeholder="E.g. St. Andrew"
                  {...register("state")}
                  className={errors.state ? "border-red-400 focus:border-red-500" : ""}
                />
                <FieldError>{errors.state?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
                <Input
                  id="postalCode"
                  maxLength={65}
                  placeholder="E.g. KGN 10"
                  {...register("postalCode")}
                  className={errors.postalCode ? "border-red-400 focus:border-red-500" : ""}
                />
                <FieldError>{errors.postalCode?.message}</FieldError>
              </Field>
            </div>

            {/* 6. Country */}
            <Field>
              <FieldLabel htmlFor="country">Country</FieldLabel>
              <Input
                id="country"
                maxLength={65}
                placeholder="E.g. Jamaica"
                {...register("country")}
                className={errors.country ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError>{errors.country?.message}</FieldError>
            </Field>
          </div>

          {/* Email Address */}
          <Field className="col-span-1 sm:col-span-2">
            <FieldLabel htmlFor="email">Email Address</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="alexander.b@institutional.corp"
              {...register("email")}
              className={errors.email ? "border-red-400 focus:border-red-500" : ""}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          {/* Telephone group side-by-side */}
          <div className="col-span-1 sm:col-span-2 grid grid-cols-3 gap-4">
            <Field>
              <FieldLabel htmlFor="telephoneHome">Telephone (Home)</FieldLabel>
              <Input
                id="telephoneHome"
                placeholder="+44..."
                {...register("telephoneHome")}
              />
              <FieldError>{errors.telephoneHome?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="telephoneWork">Telephone (Work)</FieldLabel>
              <Input
                id="telephoneWork"
                placeholder="+44..."
                {...register("telephoneWork")}
              />
              <FieldError>{errors.telephoneWork?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="telephoneMobile">Telephone (Mobile)</FieldLabel>
              <Input
                id="telephoneMobile"
                placeholder="+44..."
                {...register("telephoneMobile")}
                className={errors.telephoneMobile ? "border-red-400 focus:border-red-500" : ""}
              />
              <FieldError>{errors.telephoneMobile?.message}</FieldError>
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* 3. Footer Action */}
      <div className="flex items-center justify-end pt-4 select-none">
        <button
          type="submit"
          className="px-8 py-3 bg-brand-indigo hover:bg-brand-blue text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition duration-200 active:scale-97 border-none"
        >
          Next
        </button>
      </div>
    </form>
  );
}
