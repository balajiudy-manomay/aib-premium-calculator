"use client";

import React from 'react';
import Image from 'next/image';
import logoImg from '../public/cropped-AIB-GKFG-1-01.webp';
import { QuickQuoteState } from '@/types';

interface QuotationLetterProps {
  state: QuickQuoteState;
  selectedLetterOffer: any;
  quoteIssuedBy?: string;
  quoteJobTitle?: string;
}

export default function QuotationLetter({
  state,
  selectedLetterOffer,
  quoteIssuedBy,
  quoteJobTitle,
}: QuotationLetterProps) {
  function amountInWords(amount: number): string {
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function convertLessThanThousand(num: number): string {
      if (num === 0) return "";
      let str = "";
      if (num >= 100) {
        str += ones[Math.floor(num / 100)] + " Hundred";
        num %= 100;
        if (num > 0) str += " and ";
      }
      if (num >= 20) {
        str += tens[Math.floor(num / 10)];
        num %= 10;
        if (num > 0) str += "-" + ones[num];
      } else if (num > 0) {
        str += ones[num];
      }
      return str;
    }

    if (amount === 0) return "Zero Dollars";

    const dollars = Math.floor(amount);
    const cents = Math.round((amount - dollars) * 100);

    let result = "";

    if (dollars > 0) {
      let temp = dollars;
      const millions = Math.floor(temp / 1000000);
      temp %= 1000000;
      const thousands = Math.floor(temp / 1000);
      temp %= 1000;

      if (millions > 0) {
        result += convertLessThanThousand(millions) + " Million ";
      }
      if (thousands > 0) {
        result += convertLessThanThousand(thousands) + " Thousand, ";
      }
      if (temp > 0) {
        if (result !== "" && temp < 100) result += "and ";
        result += convertLessThanThousand(temp);
      }
      result += " Dollar" + (dollars === 1 ? "" : "s");
    }

    if (cents > 0) {
      if (result !== "") result += " and ";
      result += convertLessThanThousand(cents) + " Cent" + (cents === 1 ? "" : "s");
    }

    return result.trim();
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: letter;
            margin: 0 !important;
          }
          body {
            background: white !important;
            background-color: white !important;
            color: black !important;
          }
          /* Hide all other containers */
          #live-quotes-container,
          #print-layout-container,
          .no-print,
          header,
          footer,
          nav {
            display: none !important;
          }
          /* Reset wrapper backgrounds, borders, and margins to prevent gray backgrounds/offsets */
          #aib-main-layout,
          main,
          #active-calculator-workflow {
            background: transparent !important;
            background-color: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
            display: block !important;
          }
          /* Make sure the letter shows up correctly */
          #quotation-letter-print-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            background-color: white !important;
            color: black !important;
            font-family: Calibri, Arial, "Segoe UI", sans-serif !important;
            font-size: 14pt !important;
            line-height: 1.5 !important;
          }
          #quotation-letter-print-container * {
            font-family: Calibri, Arial, "Segoe UI", sans-serif !important;
            color: black !important;
          }
        }
      `}} />
      <div
        id="quotation-letter-print-container"
        className="hidden print:block w-[800px] bg-white text-black p-10 leading-relaxed text-[14pt] border border-slate-200"
        style={{ fontFamily: 'Calibri, Arial, "Segoe UI", sans-serif' }}
      >
        {/* Letterhead: logo left, contact details right */}
        <div className="m-6 flex items-center justify-between gap-6pb-4">
          <div className="shrink-0">
            <Image src={logoImg} alt="Allied Insurance Brokers" className="h-16 w-auto object-contain animate-none" priority />
          </div>
          <div className="text-[11.5pt] font-normal leading-tight space-y-0.5 text-left font-calibri">
            <div className="flex items-start gap-1 mb-3">
              <span className="shrink-0">•</span>
              <span>26 Belmont Road, Kingston 5, Jamaica</span>
            </div>
            <div className="flex items-start gap-1 mb-3">
              <span className="shrink-0">•</span>
              <span>Unit 1, Fairview Shopping Centre, Bogue, Montego Bay, St. James</span>
            </div>
            <p className="pl-3.5 mt-1">Tel: (876) 926-6784, 926-6820, 926-6828, 926-6821</p>
            <p className="pl-3.5">Fax: (876) 929-9391, 754-0179</p>
            <p className="pl-3.5">E-mail: allied@gkco.com | Website: www.youraib.com</p>
          </div>
        </div>
        <hr className='my-4  border-b-3 border-black ' />
        <div className='mx-20 my-15'>
          {/* Date */}
          <div className="mb-6 font-bold text-black text-[14pt] text-left">
            {(() => {
              const d = new Date();
              const day = d.getDate();
              const suffix = ["th", "st", "nd", "rd"][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10 ? day % 10 : 0)];
              const month = d.toLocaleString('en-US', { month: 'long' });
              const year = d.getFullYear();
              return `${String(day).padStart(2, '0')}${suffix} ${month} ${year}`;
            })()}
          </div>

          {/* Recipient Details */}
          <div className="mb-6 font-normal text-black text-[14pt] leading-tight space-y-1 text-left">
            <p className="capitalize font-normal">{state.basic.fullName}</p>
            {state.basic.address ? (
              <p className="whitespace-pre-line text-black font-normal text-[14pt]">{state.basic.address}</p>
            ) : (
              <p className="text-black font-medium italic">No Address Provided</p>
            )}
          </div>

          {/* Salutation */}
          <div className="mb-6 font-normal text-black text-left">
            Dear {state.basic.gender === 'Female' ? 'Madam' : 'Sir'}:
          </div>

          {/* Subject Block */}
          <div className="mb-0 font-normal text-black text-[14pt] text-left">
            <div className="flex gap-2">
              <div className="w-[80px] shrink-0 font-bold">RE:</div>
              <div className="flex-1 space-y-1 font-normal">
                <div className="flex">
                  <span className="font-bold underline text-black w-[120px]">Proposer(s)</span>
                  <span className="w-[20px] text-center">-</span>
                  <span className="capitalize font-normal text-black">
                    {state.basic.fullName || "(Proposer's Name (s)"}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold text-black w-[120px]">Risk</span>
                  <span className="w-[20px] text-center">-</span>
                  <span className="font-normal text-black">
                    {state.vehicle.year instanceof Date ? state.vehicle.year.getFullYear() : state.vehicle.year} {state.vehicle.makeModel}
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold text-black w-[120px]">Chassis #</span>
                  <span className="w-[20px] text-center">-</span>
                  <span className="font-normal text-black">{state.vehicle.chassisNumber || "—"}</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-black w-[120px]">Sum Insured</span>
                  <span className="w-[20px] text-center">-</span>
                  <span className="font-bold text-black">
                    ${Number(state.coverage.sumInsured || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 font-normal text-black tracking-tighter select-none text-left">
            ===================================================================
          </div>

          {/* Letter Body */}
          <div className="text-black font-normal leading-relaxed text-left mb-6 space-y-2">
            <p className='leading-6'>
              This serves to confirmed we have obtained comprehensive quotation from <strong>{selectedLetterOffer.name}</strong>.
            </p>
            <p className='leading-6'>
              The annual premium, inclusive of GCT, is {amountInWords(selectedLetterOffer.annualTotal)} (<strong>${selectedLetterOffer.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>).
            </p>
            <p className='leading-6'>
              Please be advised premiums quoted are subject to change on inception of the policy where additional information presented can alter quoted premiums.
            </p>
            <p className='leading-6 mt-6'>
              We trust this information is sufficient for the intended purpose.
            </p>
          </div>

          {/* Complimentary Close */}
          <div className="text-left font-normal text-black">
            Yours faithfully,
          </div>

          {/* Signature Block */}
          <div className="text-left text-[14pt] space-y-1 font-normal">
            <span className="leading-5">

              <p className="font-bold text-black uppercase">ALLIED INSURANCE BROKERS LIMITED</p>
              <p className="text-black select-none">............................................</p>
            </span>
            <span className="leading-5">

              <p className="font-normal text-black">{quoteIssuedBy}</p>
              <p className="font-semibold text-black uppercase">{(quoteJobTitle)?.toUpperCase()} </p>
            </span>
          </div>
        </div>
        <hr className='border-b-3 border-black ' />
        {/* Footer: Directors line */}
        <div className="my-3 mx-20 pt-3  text-center text-[10pt] leading-tight text-black">
          <p>
            Directors: Oliver Holmes (Chairman), Amanda Beepat (Managing Director), Milverton Reynolds, Peter Pearson,<br />
            Julie Thompson-James, Debra Dodd, Diane Edwards, Gerard Johnson,<br /> Karen Lowther Martin (Company Secretary)
          </p>
        </div>
      </div>
    </>
  );
}