"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';
import PremiumBreakdown from '@/components/PremiumBreakdown';

export default function QuoteBreakdownPage() {
  const router = useRouter();
  const params = useParams();
  const insurerId = params.insurerId as string;
  const { quoteState, quoteIssuedBy, quoteJobTitle } = useQuote();

  const handleBackToSummary = () => {
    router.push('/quote/summary');
  };

  return (
    <PremiumBreakdown
      state={quoteState}
      selectedInsurerId={insurerId}
      quoteIssuedBy={quoteIssuedBy}
      quoteJobTitle={quoteJobTitle}
      onBackToSummary={handleBackToSummary}
    />
  );
}
