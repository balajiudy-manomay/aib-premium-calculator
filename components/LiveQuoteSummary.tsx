"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { QuickQuoteState } from '@/types';
import ResetFormButton from './ResetFormButton';
import {
  ArrowLeft,
  ExternalLink,
  Printer,
  Mail,
  Download,
  BadgeCheck,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { mapQuoteStateToExcelInputs, formatDateToDMY, generateSummaryCSV } from "@/utils/excel-utils";
import { generateSummaryExcelBlob } from "@/utils/excel-generator";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import EmailModal from "./EmailModal";
import Image from 'next/image';
import logoImg from '../public/cropped-AIB-GKFG-1-01.webp';
import { cn } from '@/lib/utils';
import QuotationLetter from './QuotationLetter';
import usePrintWithFilename from '@/hooks/usePrintWithFilename';

interface LiveQuoteSummaryProps {
  state: QuickQuoteState;
  quoteIssuedBy?: string;
  quoteJobTitle?: string;
  onBackToForm: () => void;
  onSelectInsurer: (insurerId: string) => void;
}

interface InsurerOffer {
  id: string;
  name: string;
  logoText: string;
  logoBg: string;
  baseRate: number; // percentage of value
  loadingAccident: number; // multiplier if accident history
  loadingHP: number; // multiplier if high performance
}



let calculatePromise: Promise<any> | null = null;
let cachedCalculationStateStr: string = "";

export default function LiveQuoteSummary({
  state,
  quoteIssuedBy,
  quoteJobTitle,
  onBackToForm,
  onSelectInsurer,
}: LiveQuoteSummaryProps) {
  const { printWithFilename } = usePrintWithFilename();
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparedFiles, setPreparedFiles] = useState<File[] | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [selectedLetterOffer, setSelectedLetterOffer] = useState<any>(null);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);

  const handlePrintQuotationLetter = async (offer: any) => {
    try {
      setIsGeneratingLetter(true);
      setSelectedLetterOffer(offer);

      // Wait for React state update and DOM render
      await new Promise((resolve) => setTimeout(resolve, 300));

      await printWithFilename({
        fullName: state.basic.fullName,
        quoteId: state.quoteId,
        documentType: "Quotation-Letter",
      });
    } catch (err) {
      console.error("Error printing quotation letter:", err);
      alert("Failed to print Quotation Letter. Please try again.");
    } finally {
      setIsGeneratingLetter(false);
      setSelectedLetterOffer(null);
    }
  };

  const handleSendEmail = async (to: string, subject: string, message: string) => {
    // Simulate generation and sending for the POC
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`Simulated sending email to ${to} with subject "${subject}"`);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchCalculations() {
      const currentStateStr = JSON.stringify(state);

      // Return immediately if we already have a pending or completed promise for this exact state
      if (cachedCalculationStateStr === currentStateStr && calculatePromise) {
        try {
          const data = await calculatePromise;
          if (isMounted) {
            setApiData(data);
            setLoading(false);
          }
        } catch (err: any) {
          if (isMounted) {
            setError(err.message);
            setLoading(false);
          }
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        const mappedPayload = mapQuoteStateToExcelInputs(state);

        calculatePromise = fetch("/api/excel/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mappedPayload),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Failed to calculate premiums. Status: ${res.status}`);
          const data = await res.json();
          if (data.success) {
            return data.outputs;
          } else {
            throw new Error(data.error || "Calculation failed");
          }
        });

        cachedCalculationStateStr = currentStateStr;

        const data = await calculatePromise;
        if (isMounted) {
          setApiData(data);
          setLoading(false);
        }
      } catch (err: any) {
        // Reset cache so user can try again on failure
        calculatePromise = null;
        cachedCalculationStateStr = "";

        if (isMounted) {
          setError(err.message || "An unknown error occurred during premium calculation.");
          setLoading(false);
        }
      }
    }

    fetchCalculations();

    return () => {
      isMounted = false;
    };
  }, [state]);

  const calculatedOffers = useMemo(() => {
    const excelComparison = apiData?.premiumComparison;
    let list: Array<{
      id: string;
      name: string;
      logoText: string;
      logoBg: string;
      annualTotal: number;
      eligible: boolean;
    }> = [];

    if (Array.isArray(excelComparison)) {
      list = excelComparison.map((item: any) => {
        const name = String(item.insurer || "Unknown Insurer");
        const annualTotal = Number(item.premium) || 0;
        const eligible = annualTotal > 0;

        // Dynamically compute clean ID (the full name lowercase alphanumeric)
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Dynamically compute logoText from acronym
        const words = name.split(/[\s_-]+/);
        let logoText = "";
        if (words.length === 1) {
          logoText = name.substring(0, 3).toUpperCase();
        } else {
          // Take first letter of major words
          const majorWords = words.filter(w => !["of", "the", "limited", "company", "co", "ltd", "ltd.", "insurance"].includes(w.toLowerCase()));
          const targetWords = majorWords.length > 0 ? majorWords : words;
          logoText = targetWords.map(w => w.charAt(0)).join("").toUpperCase().substring(0, 5);
        }

        // Dynamically compute a nice background color based on name hash
        const bgColors = [
          'bg-emerald-600',
          'bg-blue-600',
          'bg-amber-600',
          'bg-red-650',
          'bg-teal-700',
          'bg-indigo-900',
          'bg-purple-600',
          'bg-pink-600',
          'bg-orange-600'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const logoBg = bgColors[Math.abs(hash) % bgColors.length];

        return {
          id,
          name,
          logoText,
          logoBg,
          annualTotal,
          eligible
        };
      });
    }

    // Sort list:
    // 1. Eligible offers (premium > 0) go to the top, sorted from cheapest to most expensive (increasing order).
    // 2. Ineligible / $0 offers go to the bottom.
    return list.sort((a, b) => {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      if (a.eligible && b.eligible) {
        return a.annualTotal - b.annualTotal;
      }
      return a.name.localeCompare(b.name);
    });
  }, [apiData]);

  const bestOffer = useMemo(() => {
    const validOffers = calculatedOffers.filter(o => o.eligible && o.annualTotal > 0);

    if (validOffers.length > 0) {
      const cheapest = validOffers[0];
      return {
        logoText: cheapest.logoText,
        annualTotal: cheapest.annualTotal,
        name: cheapest.name
      };
    }

    return {
      logoText: "Best Offer",
      annualTotal: 0,
      name: "Not Available"
    };
  }, [calculatedOffers]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 select-none animate-pulse">
        <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-brand-indigo">Computing Underwriter Rates</h3>
          <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
            Please wait while the Excel sheet parses your details and calculates the dynamic premium rates...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 sm:p-8 space-y-4 max-w-md mx-auto text-center select-none my-12">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-black text-red-950">Calculation Error</h3>
        <p className="text-xs font-semibold text-red-700 leading-relaxed">{error}</p>
        <button
          onClick={onBackToForm}
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition active:scale-97 border-none"
        >
          Back to Parameters
        </button>
      </div>
    );
  }

  const handlePrint = async () => {
    await printWithFilename({
      fullName: state.basic.fullName,
      quoteId: state.quoteId,
      documentType: "Quote-Summary",
    });
  };

  const handleShareClick = async () => {
    if (preparedFiles) {
      let sharedNatively = false;

      // ==========================================
      // DEBUG LOGS REQUESTED BY USER
      // ==========================================
      const pdfFile = preparedFiles[0];

      // Reconstruct the Excel file just for this debugging check
      let excelFile = null;
      if (typeof window !== "undefined" && (window as any)._cachedSummaryExcelBlob) {
        excelFile = new File([(window as any)._cachedSummaryExcelBlob], (window as any)._cachedSummaryExcelName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      }

      console.log("navigator.share exists:", !!navigator.share);

      if (navigator.canShare) {
        console.log("Can share PDF ONLY:", navigator.canShare({ files: [pdfFile] }));
        if (excelFile) {
          console.log("Can share Excel ONLY:", navigator.canShare({ files: [excelFile] }));
          console.log("Can share BOTH:", navigator.canShare({ files: [pdfFile, excelFile] }));
        }
      } else {
        console.log("navigator.canShare function is NOT supported on this browser.");
      }

      console.log("PDF File Object:", pdfFile);
      if (excelFile) console.log("Excel File Object:", excelFile);
      // ==========================================

      // 1. Try Native Web Share API with the PDF file
      if (navigator.share) {
        try {
          await navigator.share({
            title: `AIB Quote Summary - ${state.quoteId}`,
            text: `Hi there,\n\nPlease find attached your Live Quote Summary and Insurer Comparison from Allied Insurance Brokers for Quote ID ${state.quoteId}.\n\nThank you for choosing AIB!`,
            files: preparedFiles, // We'll only put the PDF in here now for max compatibility
          });
          sharedNatively = true;
        } catch (err: any) {
          if (err.name === "AbortError") {
            return; // User intentionally closed
          }

          // If Windows blocks the file share, immediately fallback to sharing JUST the text
          // Note: In some browsers, the gesture is consumed, but we will try anyway.
          try {
            await navigator.share({
              title: `AIB Quote Summary - ${state.quoteId}`,
              text: `Hi there,\n\nYour Live Quote Summary and Insurer Comparison from Allied Insurance Brokers for Quote ID ${state.quoteId} is ready.\n\nThank you for choosing AIB!`,
            });
            sharedNatively = true;
          } catch (fallbackErr) {
            console.warn("Native share completely blocked:", fallbackErr);
          }
        }
      }

      // 2. Only fallback to Email Modal if native share completely fails
      if (!sharedNatively) {
        setIsEmailModalOpen(true);
      }
      return;
    }

    try {
      setIsPreparing(true);

      // 1. Generate PDF Blob from the new print layout
      const container = document.getElementById("print-layout-container");
      if (!container) throw new Error("Could not find content to print");

      // Temporarily unhide for html2canvas without breaking UI
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

      // 2. Generate Excel Blob
      const payload = {
        quoteId: state.quoteId,
        customerDetails: {
          "Full Name": state.basic.fullName || "",
          "Tax Registration Number (TRN)": state.basic.trn || "",
          "Gender": state.basic.gender,
          "Date of Birth": formatDateToDMY(state.basic.dob) || "",
          "Email Address": state.basic.email || "",
          "Mobile Number": state.basic.telephoneMobile || "",
          "Parish/Location": state.basic.livingWorkingIn || "",
        },
        vehicleDetails: {
          "Product": state.coverage.insuranceProduct || "Private Car",
          "Coverage": state.coverage.coverType || "Comprehensive",
          "Sum Insured": `$${Number(state.coverage.sumInsured || 1999999).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          "Vehicle Value": `$${Number(state.vehicle.value || 1999999).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          "Vehicle Year": state.vehicle.year || 2024,
          "Make & Model": state.vehicle.makeModel || "Subaru Forester",
          "Chassis Number": state.vehicle.chassisNumber || "—"
        },
        bestOffer: bestOfferDetail ? { name: bestOfferDetail.name, premium: bestOfferDetail.annualTotal } : null,
        offers: rankedOffers.map((offer, idx) => ({
          rank: idx + 1,
          name: offer.name,
          premium: offer.annualTotal,
          difference: idx === 0 ? "Best Price" : `+$${(offer.annualTotal - (bestOfferDetail?.annualTotal ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        }))
      };

      const excelBlob = await generateSummaryExcelBlob(payload, '/cropped-AIB-GKFG-1-01.webp');
      const excelFile = new File([excelBlob], `AIB_Quote_Summary_${state.quoteId}.xlsx`, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

      // Only attach the PDF to the native share API because Windows/Chrome heavily restricts sharing .csv and .xlsx files via navigator.share
      setPreparedFiles([pdfFile]);

      // We still store the Excel separately so the user can download it
      (window as any)._cachedSummaryExcelBlob = excelBlob;
      (window as any)._cachedSummaryExcelName = excelFile.name;

    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while preparing files.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloadStatus('loading');
      // If we already generated the Excel during the "Prepare Share" phase, use it instantly!
      if ((window as any)._cachedSummaryExcelBlob) {
        const url = window.URL.createObjectURL((window as any)._cachedSummaryExcelBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = (window as any)._cachedSummaryExcelName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setDownloadStatus('success');
        setTimeout(() => setDownloadStatus('idle'), 2000);
        return;
      }

      // --- OLD PDF-STYLE EXCEL GENERATION (Commented out per request) ---
      /*
      const bestOfferDetail = calculatedOffers.find(o => o.eligible && o.annualTotal > 0);
      const rankedOffers = [...calculatedOffers]
        .filter(o => o.eligible && o.annualTotal > 0)
        .sort((a, b) => a.annualTotal - b.annualTotal);

      const payload = {
        quoteId: state.quoteId,
        customerDetails: {
          "Full Name": state.basic.fullName || "Alexander Vance",
          "Tax Registration Number (TRN)": state.basic.trn || "123-456-789",
          "Gender": state.basic.gender,
          "Date of Birth": formatDateToDMY(state.basic.dob) || "14-10-1985",
          "Email Address": state.basic.email || "alexander.v@curator.corp",
          "Mobile Phone": state.basic.telephoneMobile || "+1 (876) 381-0000"
        },
        vehicleDetails: {
          "Product": state.coverage.insuranceProduct || "Private Car",
          "Coverage": state.coverage.coverType || "Comprehensive",
          "Sum Insured": `$${Number(state.coverage.sumInsured || 1999999).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          "Vehicle Value": `$${Number(state.vehicle.value || 1999999).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          "Vehicle Year": state.vehicle.year || 2024,
          "Make & Model": state.vehicle.makeModel || "Subaru Forester",
          "Chassis Number": state.vehicle.chassisNumber || "—"
        },
        bestOffer: bestOfferDetail ? { name: bestOfferDetail.name, premium: bestOfferDetail.annualTotal } : null,
        offers: rankedOffers.map((offer, idx) => ({
          rank: idx + 1,
          name: offer.name,
          premium: offer.annualTotal,
          difference: idx === 0 ? "Best Price" : `+$${(offer.annualTotal - (bestOfferDetail?.annualTotal ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        }))
      };

      const blob = await generateSummaryExcelBlob(payload, '/cropped-AIB-GKFG-1-01.webp');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AIB_Quote_Summary_${state.quoteId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      */
      // ------------------------------------------------------------------

      // --- NEW IMPLEMENTATION: Download Populated Master Excel ---
      const payload = mapQuoteStateToExcelInputs(state);

      const response = await fetch("/api/download-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download master calculator.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `AIB_Master_Calculator_${state.quoteId || 'Export'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadStatus('success');
      setTimeout(() => setDownloadStatus('idle'), 2000);
    } catch (err: any) {
      setDownloadStatus('idle');
      alert(err.message || "An error occurred while downloading the Excel file.");
    }
  };

  const handleDownloadIndividualCalculator = async (insurerId: string) => {
    try {
      const payload = mapQuoteStateToExcelInputs(state);

      const response = await fetch("/api/excel/individual-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, insurerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download calculator.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${insurerId}_cal.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "An error occurred while downloading the Excel file.");
    }
  };

  const validOffers = calculatedOffers.filter(o => o.eligible && o.annualTotal > 0);
  const lowestPremium = validOffers.length > 0 ? Math.min(...validOffers.map(o => o.annualTotal)) : null;
  const highestPremium = validOffers.length > 0 ? Math.max(...validOffers.map(o => o.annualTotal)) : null;

  // PRINT LAYOUT HELPERS
  const rankedOffers = [...validOffers].sort((a, b) => a.annualTotal - b.annualTotal);
  const bestOfferDetail = rankedOffers.length > 0 ? rankedOffers[0] : null;
  const highestPremiumVal = rankedOffers.length > 0 ? rankedOffers[rankedOffers.length - 1].annualTotal : 1;

  return (
    <>
      {/* =========================================================================
          WEB UI LAYOUT (Hidden in print)
          ========================================================================= */}
      <div id="live-quotes-container" className="space-y-5 pb-12 animate-fade-in print:hidden">

        {/* 1. Header Navigation Back */}
        <div className='flex items-center justify-between w-full'>
          <div className="select-none flex-1">
            <button
              onClick={onBackToForm}
              className="flex items-center gap-1.5 text-xs text-brand-slate hover:text-brand-indigo font-black uppercase tracking-wider mb-4 group cursor-pointer transition  no-print"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to parameters</span>
            </button>
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">
              <h2 className="text-xl sm:text-2xl font-black text-brand-indigo tracking-tight">
                Quick Quote
              </h2>
              <ResetFormButton />
            </div>
            <p className="text-xs font-black text-brand-blue uppercase tracking-widest mt-1">
              QUICK QUOTE ID: <span className="text-brand-indigo">{state.quoteId}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Image
              src={logoImg}
              alt="Allied Insurance Brokers"
              className="h-10 sm:h-12 w-[97px] sm:w-[116px] object-contain hidden print:block"
              priority
            />
          </div>
        </div>
        {/* 2. Customer Profile Details Card (Image 4) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] p-6 sm:p-8 select-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-semibold text-slate-500 customer-info-print">

            <div className="space-y-4">
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Full Name</span>
                <p className="text-slate-800 font-extrabold">{state.basic.fullName || '—'}</p>
              </div>
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Date of Birth</span>
                <p className="text-slate-800 font-extrabold">{formatDateToDMY(state.basic.dob) || '—'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Tax Registration Number (TRN)</span>
                <p className="text-slate-800 font-extrabold">{state.basic.trn || '—'}</p>
              </div>
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Gender</span>
                <p className="text-slate-800 font-extrabold">{state.basic.gender}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Parish / Location</span>
                <p className="text-slate-800 font-extrabold">{state.basic.livingWorkingIn || '—'}</p>
              </div>
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Email Address</span>
                <p className="text-slate-800 font-extrabold">{state.basic.email || '—'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-[8px] font-black text-brand-slate tracking-wider uppercase mb-1">Mobile</span>
                <p className="text-slate-800 font-extrabold">{state.basic.telephoneMobile || '—'}</p>
              </div>
            </div>

          </div>
        </section>

        {/* 3. Live Quote Section Banner (Image 4) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <h3 className="text-base font-extrabold text-brand-indigo">
            Live Quote Summary
          </h3>

          {/* Estimated banner */}
          <div className="flex items-center bg-emerald-50 border border-emerald-200/60 rounded-2xl py-3 px-5 shadow-sm">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1.5">
                Best Estimated Premium
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-600 leading-none">
                  ${bestOffer.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-black text-slate-800 bg-emerald-100/80 px-2 py-0.5 rounded-md font-sans">
                  from {bestOffer.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Insurers List Grid Table (Image 4) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">

              {/* Headers */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-brand-slate uppercase tracking-wider">
                  <th className="px-6 py-4">Insurer</th>
                  <th className="px-6 py-4">Estimated Premium Amount</th>
                  <th className="px-6 py-4 text-center calculator-column-print">Premium Breakdown</th>
                  <th className="px-6 py-4 text-center calculator-column-print">Quotation Letter</th>
                </tr>
              </thead>

              {/* Rows */}
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-brand-charcoal">
                {calculatedOffers.map((offer) => {
                  const isLowest = offer.eligible && offer.annualTotal > 0 && offer.annualTotal === lowestPremium;
                  const isHighest = offer.eligible && offer.annualTotal > 0 && offer.annualTotal === highestPremium;
                  const rowClass = isLowest ? "bg-green-50 hover:bg-green-100" : isHighest ? "bg-red-50 hover:bg-red-100" : "hover:bg-slate-50";

                  return (
                    <tr key={offer.id} className={`${rowClass} transition-colors`}>

                      {/* Column 1: Insurer Logo & Name */}
                      <td className="px-6 py-4.5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${offer.logoBg} text-white flex items-center justify-center font-black text-[10px] shadow-sm select-none`}>
                          {offer.logoText}
                        </div>
                        <span className={cn("font-extrabold text-slate-800", isHighest && "text-red-700", isLowest && "text-green-600")}>{offer.name}</span>
                      </td>

                      {/* Column 2: Premium Amount */}
                      <td className={cn("px-6 py-4.5 font-black text-sm text-brand-indigo", isHighest && "text-red-700", isLowest && "text-green-600")}>
                        {offer.eligible && offer.annualTotal > 0 ? (
                          `$${offer.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-slate-400 text-xs">$0.00 (Not Eligible)</span>
                        )}
                      </td>

                      {/* Column 3: Premium Breakdown Action */}
                      <td className="px-6 py-4.5 text-center calculator-column-print">
                        {offer.eligible ? (
                          <button
                            onClick={() => onSelectInsurer(offer.id)}
                            className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-cobalt cursor-pointer transition select-none font-bold"
                          >
                            <span>View Premium Breakdown</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-350 select-none">-</span>
                        )}
                      </td>

                      {/* Column 4: Quotation Letter Action */}
                      <td className="px-6 py-4.5 text-center calculator-column-print">
                        {offer.eligible ? (
                          <button
                            disabled={isGeneratingLetter}
                            onClick={() => handlePrintQuotationLetter(offer)}
                            className="inline-flex items-center gap-1 text-brand-indigo hover:text-brand-indigo/85 cursor-pointer transition select-none font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>Print Letter</span>
                            {isGeneratingLetter && selectedLetterOffer?.id === offer.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Printer className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-350 select-none">-</span>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>

            </table>
          </div>
        </section>

        {/* 5. Footer Utility Tools Actions (Image 4) */}
        <div className="flex items-center justify-between pt-4 select-none print:hidden">
          {/* Left Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-brand-charcoal font-extrabold text-xs rounded-xl cursor-pointer transition active:scale-97"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
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

          {/* Right Actions */}
          <button
            onClick={handleDownloadExcel}
            disabled={downloadStatus !== 'idle'}
            type="button"
            className={`flex items-center gap-2 px-7 py-3 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition duration-200 active:scale-97 border-none ${downloadStatus === 'success'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-brand-indigo hover:bg-brand-blue text-white disabled:opacity-75 disabled:cursor-not-allowed'
              }`}
          >
            {downloadStatus === 'loading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : downloadStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>

        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSend={handleSendEmail}
          defaultTo={state.basic.email || ""}
          pdfName={`${(state.basic.fullName ? state.basic.fullName.trim() : "Client").replace(/[/\\?%*:|"<>]/g, "")}-${(state.quoteId || "").replace(/[/\\?%*:|"<>]/g, "")}.pdf`}
          excelName={`AIB_Quote_Summary_${state.quoteId}.xlsx`}
        />
      </div>

      {/* =========================================================================
        PRINT / PDF EXPORT LAYOUT (Hidden on screen)
        ========================================================================= */}
      <div id="print-layout-container" className="hidden print:block w-[800px] min-h-[1122px] bg-white text-slate-800 p-6 mx-auto font-sans leading-tight">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-indigo pb-2 mb-4">
          <Image src={logoImg} alt="Allied Insurance Brokers" className="h-10 w-auto object-contain" priority />
          <div className="text-right">
            <h1 className="text-xl font-black text-brand-indigo tracking-tight">QUICK QUOTE</h1>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">ID: {state.quoteId}</p>
            {quoteIssuedBy && (
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                Issued By: <span className="font-black text-brand-indigo">{quoteIssuedBy}</span>
              </p>
            )}
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="mb-4">
          <h2 className="text-xs font-black text-white bg-brand-indigo px-3 py-1.5 uppercase tracking-wider">Customer Details</h2>
          <div className="border border-brand-indigo border-t-0 p-3 grid grid-cols-2 gap-y-1 gap-x-6 text-[10px]">
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Name:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.fullName || 'Alexander Vance'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">TRN:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.trn || '123-456-789'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Gender:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.gender}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">DOB:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{formatDateToDMY(state.basic.dob) || '14-10-1985'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Email:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.email || 'alexander.v@curator.corp'}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Mobile:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.basic.telephoneMobile || '+1 (876) 381-0000'}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Info Card */}
        <div className="mb-4">
          <h2 className="text-xs font-black text-white bg-brand-indigo px-3 py-1.5 uppercase tracking-wider">Vehicle & Coverage</h2>
          <div className="border border-brand-indigo border-t-0 p-3 grid grid-cols-2 gap-y-1 gap-x-6 text-[10px]">
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Product:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.coverage.insuranceProduct || "Private Car"}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Coverage:</span>
              <span className="font-extrabold text-slate-900 w-2/3">{state.coverage.coverType || "Comprehensive"}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Vehicle:</span>
              <span className="font-extrabold text-slate-900 w-2/3">
                {state.vehicle.year instanceof Date ? state.vehicle.year.getFullYear() : state.vehicle.year} {state.vehicle.makeModel || "Subaru Forester"}
              </span>
            </div>
            <div className="flex border-b border-slate-100 pb-0.5">
              <span className="font-bold text-slate-500 w-1/3">Value:</span>
              <span className="font-extrabold text-slate-900 w-2/3">${Number(state.vehicle.value || 1999999).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {state.vehicle.chassisNumber && (
              <div className="flex border-b border-slate-100 pb-0.5 col-span-2">
                <span className="font-bold text-slate-500 w-1/6">Chassis No:</span>
                <span className="font-extrabold text-slate-900 w-5/6">{state.vehicle.chassisNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Best Quote Highlight */}
        {bestOfferDetail && (
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2 mb-4">
            <h3 className="text-sm font-extrabold text-brand-indigo">
              Live Quote Summary
            </h3>
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
              <span className="text-[8px] font-black text-brand-slate uppercase tracking-wider">Estimated Annual Premium:</span>
              <span className="font-black text-brand-indigo text-[10px]">
                {bestOfferDetail.logoText} - ${bestOfferDetail.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Visual Chart */}
        {rankedOffers.length > 0 && (
          <div className="mb-4">
            <h2 className="text-[10px] font-black text-brand-slate uppercase tracking-wider mb-2">Premium Comparison Chart</h2>
            <div className="space-y-1.5">
              {rankedOffers.map((offer, idx) => {
                const widthPct = Math.max((offer.annualTotal / highestPremiumVal) * 100, 5);
                const isBest = idx === 0;
                return (
                  <div key={offer.id} className="flex items-center gap-3 text-[10px]">
                    <div className="w-20 font-bold text-right truncate" title={offer.name}>{offer.logoText}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-3.5 overflow-hidden flex items-center relative">
                      <div
                        className={`h-full ${isBest ? 'bg-emerald-500' : 'bg-brand-blue'} transition-all duration-1000`}
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className={`absolute left-2 font-black text-[9px] ${widthPct < 20 ? 'text-slate-800 translate-x-full ml-1' : 'text-white'}`}>
                        ${offer.annualTotal.toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ranked Table */}
        {rankedOffers.length > 0 && (
          <div className="mb-4">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="py-1 px-2 font-black text-slate-600 w-10 text-center">Rank</th>
                  <th className="py-1 px-2 font-black text-slate-600">Insurer</th>
                  <th className="py-1 px-2 font-black text-slate-600 text-right">Premium</th>
                  <th className="py-1 px-2 font-black text-slate-600 text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                {rankedOffers.map((offer, idx) => {
                  const diff = offer.annualTotal - (bestOfferDetail?.annualTotal ?? 0);
                  return (
                    <tr key={offer.id} className="border-b border-slate-100">
                      <td className="py-1 px-2 text-center font-bold">{idx + 1}</td>
                      <td className="py-1 px-2 font-bold">{offer.name}</td>
                      <td className="py-1 px-2 text-right font-black text-brand-indigo">
                        ${offer.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-1 px-2 text-right font-bold ${idx === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {idx === 0 ? 'Best Price' : `+$${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden Quotation Letter Print Container */}
      {selectedLetterOffer && (
        <QuotationLetter
          state={state}
          selectedLetterOffer={selectedLetterOffer}
          quoteIssuedBy={quoteIssuedBy}
          quoteJobTitle={quoteJobTitle}
        />
      )}
    </>
  );
}
