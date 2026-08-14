"use client";

import React, { useState, useEffect } from 'react';
import { QuickQuoteState } from '@/types';
import ResetFormButton from './ResetFormButton';
import {
  ArrowLeft,
  Car,
  TrendingUp,
  Award,
  Calculator,
  FileText,
  Printer,
  Mail,
  Download
} from 'lucide-react';
import { mapQuoteStateToExcelInputs, generateBreakdownCSV, formatDateToDMY } from "@/utils/excel-utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import EmailModal from "./EmailModal";
import Image from 'next/image';
import logoImg from '../public/cropped-AIB-GKFG-1-01.webp';
import usePrintWithFilename from '@/hooks/usePrintWithFilename';

interface PremiumBreakdownProps {
  state: QuickQuoteState;
  selectedInsurerId: string;
  quoteIssuedBy?: string;
  quoteJobTitle?: string;
  onBackToSummary: () => void;
}



const LOADING_FIELDS = [
  { key: 'manualLoad', label: 'Manual Load' },
  { key: 'vehicleTheftLoad', label: 'Vehicle Theft Load' },
];

const DISCOUNT_FIELDS = [
  { key: 'introductoryRenewalDiscount', label: 'Introductory/Renewal Reward' },
  { key: 'otherVehicleInsured', label: 'Other Vehicle Insured' },
  { key: 'restrictedDriverDiscount', label: 'Restricted Driver Provision' },
  { key: 'ncdStepBack', label: 'NCD / NCD Step Back' },
  { key: 'civilServantDiscount', label: 'Civil Servant Endorsement' },
  { key: 'companyOwnedVehicleDiscount', label: 'Company Owned Vehicle Discount' },
  { key: 'seniorCitizenDiscount', label: 'Senior Citizen Discount' },
  { key: 'makeAndModelDiscount', label: 'Make and Model Discount' },
  { key: 'gkgCarePackDiscount', label: 'GKG Care Pack Discount' },
  { key: 'gkvrDiscount', label: 'GKVR Discount' },
  { key: 'aibSchemeDiscount', label: 'AIB Scheme Discount' },
  { key: 'loyaltyDiscount', label: 'Loyalty Discount' },
  { key: 'euroCarClub', label: 'Euro Car Club' },
  { key: 'mensClub', label: 'Mens Club' },
  { key: 'suvClub', label: 'SUV Club' },
  { key: 'specialDiscount', label: 'Special Discount' },
  { key: 'legacyDiscount', label: 'Legacy Discount' },
  { key: 'vehicleAgeDiscount', label: 'Vehicle Age Discount' },
  { key: 'kiclDiscount', label: 'KICL Discount' },
  { key: 'smartDriverDiscount', label: 'Smart Driver Discount' },
  { key: 'femaleDriverPolicyHolderDiscount', label: 'Female Driver/Policy Holder Discount' },
];

export default function PremiumBreakdown({
  state,
  selectedInsurerId,
  quoteIssuedBy,
  quoteJobTitle,
  onBackToSummary,
}: PremiumBreakdownProps) {
  const { printWithFilename } = usePrintWithFilename();
  const [breakdown, setBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparedFiles, setPreparedFiles] = useState<File[] | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleSendEmail = async (to: string, subject: string, message: string) => {
    // Simulate generation and sending for the POC
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Simulated sending email to ${to} with subject "${subject}"`);
  };

  const insurerName = breakdown?.insurer || 'Loading Insurer...';

  const activeLoadings = LOADING_FIELDS.filter(f => {
    const val = breakdown?.[f.key];
    if (val === undefined || val === null || val === "") return false;
    if (isNaN(Number(val))) return true; // keep strings like "Not Found"
    return Number(val) !== 0;
  });

  const activeDiscounts = DISCOUNT_FIELDS.filter(f => {
    const val = breakdown?.[f.key];
    if (val === undefined || val === null || val === "") return false;
    if (isNaN(Number(val))) return true;
    return Number(val) !== 0;
  });


  useEffect(() => {
    async function fetchBreakdownData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/excel/breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputs: mapQuoteStateToExcelInputs(state),
            insurer: selectedInsurerId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to calculate breakdown');
        }

        setBreakdown(data.breakdown);
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading the breakdown');
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdownData();
  }, [state, selectedInsurerId]);

  const formatPercent = (val: any) => {
    if (val === undefined || val === null || val === "") return "0%";
    const num = Number(val);
    if (isNaN(num)) return "-";
    if (num === 0) return "0%";
    if (Math.abs(num) < 1.0) {
      return `${(num * 100).toFixed(0)}%`;
    }
    return `${num.toFixed(0)}%`;
  };

  const formatCurrency = (val: any) => {
    if (val === undefined || val === null || val === "") return "$0.00";
    const num = Number(val);
    if (isNaN(num)) return "-";
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handlePrint = async () => {
    await printWithFilename({
      fullName: state.basic.fullName,
      quoteId: state.quoteId,
      documentType: "Premium-Breakdown",
      subTitle: insurerName,
    });
  };

  const handleShareClick = async () => {
    if (preparedFiles) {
      let sharedNatively = false;

      // ==========================================
      // DEBUG LOGS REQUESTED BY USER
      // ==========================================
      const pdfFile = preparedFiles[0];

      // Reconstruct the CSV file just for this debugging check
      let csvFile = null;
      if (typeof window !== "undefined" && (window as any)._cachedBreakdownCsvBlob) {
        csvFile = new File([(window as any)._cachedBreakdownCsvBlob], (window as any)._cachedBreakdownCsvName, { type: "text/csv" });
      }

      console.log("navigator.share exists:", !!navigator.share);

      if (navigator.canShare) {
        console.log("Can share PDF ONLY:", navigator.canShare({ files: [pdfFile] }));
        if (csvFile) {
          console.log("Can share CSV ONLY:", navigator.canShare({ files: [csvFile] }));
          console.log("Can share BOTH:", navigator.canShare({ files: [pdfFile, csvFile] }));
        }
      } else {
        console.log("navigator.canShare function is NOT supported on this browser.");
      }

      console.log("PDF File Object:", pdfFile);
      if (csvFile) console.log("CSV File Object:", csvFile);
      // ==========================================

      // 1. Try Native Web Share API
      if (navigator.share) {
        try {
          await navigator.share({
            title: `AIB Premium Breakdown - ${insurerName} - ${state.quoteId}`,
            text: `Hi there,\n\nPlease find attached your detailed Premium Breakdown from Allied Insurance Brokers for ${insurerName} (Quote ID ${state.quoteId}).\n\nThank you for choosing AIB!`,
            files: preparedFiles, // We'll only put the PDF in here now for max compatibility
          });
          sharedNatively = true;
        } catch (err: any) {
          if (err.name === "AbortError") {
            return; // User intentionally closed
          }

          // If Windows blocks the file share, immediately fallback to sharing JUST the text
          try {
            await navigator.share({
              title: `AIB Premium Breakdown - ${insurerName} - ${state.quoteId}`,
              text: `Hi there,\n\nYour detailed Premium Breakdown from Allied Insurance Brokers for ${insurerName} (Quote ID ${state.quoteId}) is ready.\n\nThank you for choosing AIB!`,
            });
            sharedNatively = true;
          } catch (fallbackErr) {
            console.warn("Native share completely blocked:", fallbackErr);
          }
        }
      }

      // 2. Fallback to Email Modal
      if (!sharedNatively) {
        setIsEmailModalOpen(true);
      }
      return;
    }

    try {
      setIsPreparing(true);

      const container = document.getElementById("premium-breakdown-print-layout");
      if (!container) throw new Error("Could not find content to print");

      // Temporarily unhide for html2canvas
      container.classList.remove("hidden", "print:block");
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.zIndex = "-9999";

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });

      // Revert
      container.style.position = "";
      container.style.top = "";
      container.style.left = "";
      container.style.zIndex = "";
      container.classList.add("hidden", "print:block");

      const imgData = canvas.toDataURL("image/jpeg", 0.8);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output("blob");
      const userName = state.basic.fullName ? state.basic.fullName.trim() : "Client";
      const cleanName = userName.replace(/[/\\?%*:|"<>]/g, "");
      const cleanQuoteId = (state.quoteId || "").replace(/[/\\?%*:|"<>]/g, "");
      const pdfFile = new File([pdfBlob], `${cleanName}-${cleanQuoteId}.pdf`, { type: "application/pdf" });

      const payload = {
        quoteId: state.quoteId,
        insurerName: insurerName,
        policyDetails: {
          "Product": breakdown?.product || "Private Car",
          "Coverage": breakdown?.coverage || "Comprehensive",
          "Sum Insured": breakdown?.sumInsured,
          "Rate": breakdown?.rate,
          "Rate Band": breakdown?.rateBand,
          "Base Premium": breakdown?.basePremium,
        },
        loadings: activeLoadings.map(f => ({
          label: f.label,
          value: breakdown[f.key]
        })),
        premiumAfterLoading: breakdown?.premiumAfterLoading,
        discounts: activeDiscounts.map(f => ({
          label: f.label,
          value: breakdown[f.key]
        })),
        premiumAfterDiscounts: breakdown?.premiumAfterDiscounts,
        premiumAfterMinimumPremium: breakdown?.premiumAfterMinimumPremium,
        charges: {
          "Service Charge": breakdown?.serviceCharge,
          "Stamp Duty": breakdown?.stampDuty,
          "General Consumption Tax (GCT)": breakdown?.gct,
        },
        finalPremium: breakdown?.finalPremium
      };

      const csvString = generateBreakdownCSV(payload);
      const csvBlob = new Blob([csvString], { type: "text/csv" });
      const csvFile = new File([csvBlob], `AIB_Premium_Breakdown_${insurerName.replace(/\s+/g, '_')}_${state.quoteId}.csv`, { type: "text/csv" });

      // Only attach the PDF to the native share API because Windows/Chrome heavily restricts sharing .csv and .xlsx files via navigator.share
      setPreparedFiles([pdfFile]);

      // We still store the CSV separately so the user can download it
      (window as any)._cachedBreakdownCsvBlob = csvBlob;
      (window as any)._cachedBreakdownCsvName = csvFile.name;

    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while preparing files.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDownloadBreakdown = async () => {
    try {
      // If we already generated the CSV during the "Prepare Share" phase, use it instantly!
      if ((window as any)._cachedBreakdownCsvBlob) {
        const url = window.URL.createObjectURL((window as any)._cachedBreakdownCsvBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (window as any)._cachedBreakdownCsvName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      // Otherwise, generate it on the fly
      const payload = {
        quoteId: state.quoteId,
        insurerName: insurerName,
        policyDetails: {
          "Product": breakdown?.product || "Private Car",
          "Coverage": breakdown?.coverage || "Comprehensive",
          "Sum Insured": breakdown?.sumInsured,
          "Rate": breakdown?.rate,
          "Rate Band": breakdown?.rateBand,
          "Base Premium": breakdown?.basePremium,
        },
        loadings: activeLoadings.map(f => ({
          label: f.label,
          value: breakdown[f.key]
        })),
        premiumAfterLoading: breakdown?.premiumAfterLoading,
        discounts: activeDiscounts.map(f => ({
          label: f.label,
          value: breakdown[f.key]
        })),
        premiumAfterDiscounts: breakdown?.premiumAfterDiscounts,
        premiumAfterMinimumPremium: breakdown?.premiumAfterMinimumPremium,
        charges: {
          "Service Charge": breakdown?.serviceCharge,
          "Stamp Duty": breakdown?.stampDuty,
          "General Consumption Tax (GCT)": breakdown?.gct,
        },
        finalPremium: breakdown?.finalPremium
      };

      const csvString = generateBreakdownCSV(payload);
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AIB_Premium_Breakdown_${insurerName.replace(/\s+/g, '_')}_${state.quoteId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "An error occurred while downloading the CSV file.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-6 select-none animate-pulse">
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-brand-indigo">Retrieving Underwriter Breakdown</h3>
          <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
            Please wait while we load the granular underwriter parameters and calculations from the Excel sheet...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 select-none">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 space-y-4 max-w-md text-center shadow-sm">
          <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-md">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-black text-red-950">Error Loading Breakdown</h3>
          <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
          <button
            onClick={onBackToSummary}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition active:scale-97 border-none"
          >
            Back to Quick Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================================================
          WEB UI LAYOUT (Hidden in print)
          ========================================================================= */}
      <div id="premium-breakdown-container" className="w-full flex flex-col font-sans print:hidden">
        {/* Navigation Back Button */}
        <div className="w-full pb-2 select-none no-print">
          <button
            onClick={onBackToSummary}
            className="flex items-center gap-1.5 text-xs text-brand-slate hover:text-brand-indigo font-black uppercase tracking-wider group cursor-pointer transition no-print"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Quick Quote</span>
          </button>
        </div>

        <main className="flex-1 w-full my-4 flex flex-col space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none px-4 sm:px-0">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-black text-brand-indigo tracking-tight">
                Premium Breakdown – {insurerName.replace(' Limited', '')}
              </h2>
              <p className="text-xs font-black text-brand-blue uppercase tracking-widest">
                QUICK QUOTE ID: <span className="text-brand-indigo">{state.quoteId}</span>
              </p>
            </div>
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] p-6 sm:p-10 space-y-8 select-none">
            {/* Policy Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-8 h-8 bg-blue-900 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <Car className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-wide">
                  Policy Details
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-semibold text-slate-500 py-1">
                <div>
                  <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-1.5">Product</span>
                  <p className="text-slate-800 font-extrabold text-sm">{breakdown?.product || 'Private Car'}</p>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-1.5">Coverage</span>
                  <p className="text-slate-800 font-extrabold text-sm">{breakdown?.coverage || 'Comprehensive'}</p>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-slate-400 tracking-wider uppercase mb-1.5">Sum Insured</span>
                  <p className="text-slate-800 font-extrabold text-sm">{formatCurrency(breakdown?.sumInsured)}</p>
                </div>
              </div>

              <div className="bg-[#F1F5F9] rounded-xl px-5 py-4 flex justify-between items-center text-slate-650 font-bold text-xs uppercase tracking-wide">
                <span>BASE PREMIUM</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900">{formatCurrency(breakdown?.basePremium)}</span>
              </div>
            </div>

            {/* Loadings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-wide">Loadings</h4>
              </div>

              <div className="text-xs sm:text-sm font-semibold text-slate-650 py-1 space-y-2">
                {activeLoadings.length > 0 ? (
                  activeLoadings.map(field => (
                    <div key={field.key} className="flex justify-between items-center">
                      <span>{field.label}</span>
                      <span className="font-extrabold text-slate-800">
                        {isNaN(Number(breakdown[field.key])) ? "-" : `+${formatPercent(breakdown[field.key])}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-slate-400 italic">
                    <span>No Loadings Applied</span>
                    <span>0%</span>
                  </div>
                )}
              </div>

              <div className="bg-[#F1F5F9] rounded-xl px-5 py-4 flex justify-between items-center text-slate-650 font-bold text-xs uppercase tracking-wide">
                <span>PREMIUM AFTER LOADING</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900">{formatCurrency(breakdown?.premiumAfterLoading)}</span>
              </div>
            </div>

            {/* Discounts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-8 h-8 bg-green-100 text-green-500 rounded-lg flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-wide">Discounts</h4>
              </div>

              {activeDiscounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs sm:text-sm font-semibold text-slate-600 py-1">
                  {activeDiscounts.map(field => (
                    <div key={field.key} className="flex justify-between items-center">
                      <span>{field.label}</span>
                      <span className="font-extrabold text-emerald-600">
                        {isNaN(Number(breakdown[field.key])) ? "-" : `-${formatPercent(breakdown[field.key])}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between items-center py-1 text-slate-400 italic text-xs sm:text-sm font-semibold">
                  <span>No Discounts Applied</span>
                  <span>0%</span>
                </div>
              )}

              <div className="bg-[#F0FDF4] rounded-xl px-5 py-4 flex justify-between items-center text-emerald-800 font-bold text-xs border border-emerald-150 uppercase tracking-wide">
                <span>PREMIUM AFTER AGGREGATE DISCOUNTS</span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-700">{formatCurrency(breakdown?.premiumAfterDiscounts)}</span>
              </div>
            </div>

            {/* Minimum Premium */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-wide">Minimum Premium</h4>
              </div>

              <div className="bg-[#F1F5F9] rounded-xl px-5 py-4 flex justify-between items-center text-slate-650 font-bold text-xs uppercase tracking-wide">
                <span>PREMIUM AFTER MINIMUM PREMIUM CHECK:</span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900">{formatCurrency(breakdown?.premiumAfterMinimumPremium)}</span>
              </div>
            </div>

            {/* Charges & Taxes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <div className="w-8 h-8 bg-sky-100 text-sky-500 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black text-slate-800 tracking-wide">Charges &amp; Taxes</h4>
              </div>

              <div className="flex flex-col space-y-3.5 text-xs sm:text-sm font-semibold text-slate-600 py-1">
                <div className="flex justify-between items-center">
                  <span>Service Charge</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(breakdown?.serviceCharge)}</span>
                </div>
                {breakdown?.stampDuty !== undefined && breakdown?.stampDuty !== null && Number(breakdown.stampDuty) !== 0 && (
                  <div className="flex justify-between items-center">
                    <span>Stamp Duty</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(breakdown.stampDuty)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>General Consumption Tax (GCT)</span>
                  <span className="font-extrabold text-slate-900">{formatCurrency(breakdown?.gct)}</span>
                </div>
              </div>

              <div className="bg-[#F1F5F9] rounded-xl px-5 py-4.5 flex justify-between items-center text-slate-650 font-bold text-xs uppercase tracking-wide">
                <span>TOTAL PREMIUM PAYABLE:</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">{formatCurrency(breakdown?.finalPremium)}</span>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between select-none px-4 sm:px-0 no-print">
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                type="button"
                className="flex flex-col items-center justify-center gap-1 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-black text-[9px] text-slate-500 hover:text-brand-indigo w-18 h-14 cursor-pointer transition active:scale-97"
              >
                <Printer className="w-5 h-5 text-slate-400" />
                <span>PRINT</span>
              </button>
              <button
                onClick={handleShareClick}
                disabled={isPreparing}
                type="button"
                className={`flex flex-col items-center justify-center gap-1 border rounded-xl font-black text-[9px] w-24 h-14 cursor-pointer transition active:scale-97 disabled:opacity-50 ${preparedFiles
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-brand-indigo"
                  }`}
              >
                {isPreparing ? (
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-brand-blue rounded-full animate-spin" />
                ) : (
                  <Mail className={`w-5 h-5 ${preparedFiles ? "text-green-600" : "text-slate-400"}`} />
                )}
                <span className="text-center leading-tight">
                  {isPreparing ? "PREPARING..." : preparedFiles ? "READY! CLICK\nTO SHARE" : "SHARE VIA\nAPPS"}
                </span>
              </button>
            </div>

            {/* <button
              onClick={handleDownloadBreakdown}
              type="button"
              className="px-7 py-4 bg-blue-800 hover:bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition duration-200 active:scale-97 flex items-center gap-2 border-none"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD</span>
            </button> */}
          </div>
        </main>

        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSend={handleSendEmail}
          defaultTo={state.basic.email || ""}
          pdfName={`${(state.basic.fullName ? state.basic.fullName.trim() : "Client").replace(/[/\\?%*:|"<>]/g, "")}-${(state.quoteId || "").replace(/[/\\?%*:|"<>]/g, "")}.pdf`}
          excelName={`AIB_Premium_Breakdown_${insurerName.replace(/\s+/g, '_')}_${state.quoteId}.csv`}
        />
      </div>

      {/* =========================================================================
          PRINT / PDF EXPORT LAYOUT (Hidden on screen, shown only when printing)
          ========================================================================= */}
      <div id="premium-breakdown-print-layout" className="hidden print:block w-[800px] min-h-[1122px] bg-white text-slate-800 p-6 mx-auto font-sans leading-tight">

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-indigo pb-2 mb-4">
          <Image src={logoImg} alt="Allied Insurance Brokers" className="h-10 w-auto object-contain" priority />
          <div className="text-right">
            <h1 className="text-xl font-black text-brand-indigo tracking-tight">PREMIUM BREAKDOWN</h1>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{insurerName}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">ID: {state.quoteId}</p>
            {quoteIssuedBy && (
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Issued By: <span className="font-black text-brand-indigo">{quoteIssuedBy}</span>
              </p>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-3">
          <h2 className="text-xs font-black text-white bg-brand-indigo px-3 py-1.5 uppercase tracking-wider">Customer Details</h2>
          <div className="border border-brand-indigo border-t-0 p-3 grid grid-cols-2 gap-y-1 gap-x-6 text-[10px]">
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Name:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.fullName || '—'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">TRN:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.trn || '—'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Gender:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.gender || '—'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">DOB:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{formatDateToDMY(state.basic.dob) || '—'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Email:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.email || '—'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Mobile:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.telephoneMobile || '—'}</span>
            </div>
          </div>
        </div>

        {/* Vehicle & Coverage */}
        <div className="mb-3">
          <h2 className="text-xs font-black text-white bg-brand-indigo px-3 py-1.5 uppercase tracking-wider">Vehicle &amp; Coverage</h2>
          <div className="border border-brand-indigo border-t-0 p-3 grid grid-cols-2 gap-y-1 gap-x-6 text-[10px]">
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Product:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{breakdown?.product || state.coverage.insuranceProduct || 'Private Car'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Coverage:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{breakdown?.coverage || state.coverage.coverType || 'Comprehensive'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Vehicle:</span>
              <span className="font-extrabold text-slate-900 w-2/3">
                {state.vehicle.year instanceof Date ? state.vehicle.year.getFullYear() : state.vehicle.year} {state.vehicle.makeModel || '—'}
              </span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Sum Insured:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{formatCurrency(breakdown?.sumInsured)}</span>
            </div>
            {state.vehicle.chassisNumber && (
              <div className="flex border-b border-slate-100 pb-0.5 col-span-2">
                <span className="font-bold text-slate-500 w-1/6">Chassis No:</span>
                <span className="font-extrabold text-slate-900 w-5/6">{state.vehicle.chassisNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Premium Calculation Breakdown */}
        <div className="mb-3">
          <h2 className="text-xs font-black text-white bg-brand-indigo px-3 py-1.5 uppercase tracking-wider">Premium Calculation</h2>
          <table className="w-full text-left text-[10px] border-collapse border border-brand-indigo border-t-0">

            {/* Base Premium */}
            <tbody>
              <tr className="bg-slate-50 border-b border-slate-200">
                <td className="py-1.5 px-3 font-black text-slate-700 uppercase tracking-wide w-2/3">Base Premium</td>
                <td className="py-1.5 px-3 font-black text-slate-900 text-right">{formatCurrency(breakdown?.basePremium)}</td>
              </tr>

              {/* Loadings section */}
              {activeLoadings.length > 0 && (
                <>
                  <tr className="bg-red-50 border-b border-slate-100">
                    <td colSpan={2} className="py-1 px-3 font-black text-red-700 text-[9px] uppercase tracking-wider">Loadings</td>
                  </tr>
                  {activeLoadings.map(field => (
                    <tr key={field.key} className="border-b border-slate-100">
                      <td className="py-1 px-3 pl-6 font-semibold text-slate-600">{field.label}</td>
                      <td className="py-1 px-3 font-bold text-slate-800 text-right">
                        {isNaN(Number(breakdown[field.key])) ? "-" : `+${formatPercent(breakdown[field.key])}`}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              <tr className="bg-slate-100 border-b border-slate-300">
                <td className="py-1.5 px-3 font-black text-slate-700 uppercase tracking-wide">Premium After Loading</td>
                <td className="py-1.5 px-3 font-black text-slate-900 text-right">{formatCurrency(breakdown?.premiumAfterLoading)}</td>
              </tr>

              {/* Discounts section */}
              {activeDiscounts.length > 0 && (
                <>
                  <tr className="bg-emerald-50 border-b border-slate-100">
                    <td colSpan={2} className="py-1 px-3 font-black text-emerald-700 text-[9px] uppercase tracking-wider">Discounts</td>
                  </tr>
                  {activeDiscounts.map(field => (
                    <tr key={field.key} className="border-b border-slate-100">
                      <td className="py-1 px-3 pl-6 font-semibold text-slate-600">{field.label}</td>
                      <td className="py-1 px-3 font-bold text-emerald-600 text-right">
                        {isNaN(Number(breakdown[field.key])) ? "-" : `-${formatPercent(breakdown[field.key])}`}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              <tr className="bg-emerald-50 border-b border-slate-300">
                <td className="py-1.5 px-3 font-black text-emerald-800 uppercase tracking-wide">Premium After Aggregate Discounts</td>
                <td className="py-1.5 px-3 font-black text-emerald-700 text-right">{formatCurrency(breakdown?.premiumAfterDiscounts)}</td>
              </tr>

              <tr className="bg-slate-100 border-b border-slate-300">
                <td className="py-1.5 px-3 font-black text-slate-700 uppercase tracking-wide">Premium After Minimum Premium Check</td>
                <td className="py-1.5 px-3 font-black text-slate-900 text-right">{formatCurrency(breakdown?.premiumAfterMinimumPremium)}</td>
              </tr>

              {/* Charges */}
              <tr className="bg-sky-50 border-b border-slate-100">
                <td colSpan={2} className="py-1 px-3 font-black text-sky-700 text-[9px] uppercase tracking-wider">Charges &amp; Taxes</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 px-3 pl-6 font-semibold text-slate-600">Service Charge</td>
                <td className="py-1 px-3 font-bold text-slate-800 text-right">{formatCurrency(breakdown?.serviceCharge)}</td>
              </tr>
              {breakdown?.stampDuty !== undefined && breakdown?.stampDuty !== null && Number(breakdown.stampDuty) !== 0 && (
                <tr className="border-b border-slate-100">
                  <td className="py-1 px-3 pl-6 font-semibold text-slate-600">Stamp Duty</td>
                  <td className="py-1 px-3 font-bold text-slate-800 text-right">{formatCurrency(breakdown.stampDuty)}</td>
                </tr>
              )}
              <tr className="border-b border-slate-200">
                <td className="py-1 px-3 pl-6 font-semibold text-slate-600">General Consumption Tax (GCT)</td>
                <td className="py-1 px-3 font-bold text-slate-800 text-right">{formatCurrency(breakdown?.gct)}</td>
              </tr>

              {/* Final Total */}
              <tr className="bg-brand-indigo">
                <td className="py-2 px-3 font-black text-white uppercase tracking-wider text-xs">Total Premium Payable</td>
                <td className="py-2 px-3 font-black text-white text-right text-sm">{formatCurrency(breakdown?.finalPremium)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-slate-200 text-[9px] text-slate-400 flex justify-between">
          <span>Allied Insurance Brokers — Confidential Quote Document</span>
          <span>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </>
  );
}
