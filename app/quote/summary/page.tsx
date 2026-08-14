"use client";

import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';
import LiveQuoteSummary from '@/components/LiveQuoteSummary';

export default function QuoteSummaryPage() {
  const router = useRouter();
  const { quoteState, quoteIssuedBy, quoteJobTitle } = useQuote();

  const handleBackToForm = () => {
    router.push('/quote');
  };

  const handleSelectInsurer = (insurerId: string) => {
    router.push(`/quote/breakdown/${insurerId}`);
  };

  return (
    <LiveQuoteSummary
      state={quoteState}
      quoteIssuedBy={quoteIssuedBy}
      quoteJobTitle={quoteJobTitle}
      onBackToForm={handleBackToForm}
      onSelectInsurer={handleSelectInsurer}
    />
  );
}
