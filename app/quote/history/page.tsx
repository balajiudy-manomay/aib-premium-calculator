"use client";

import { useRouter } from 'next/navigation';
import { useQuote } from '@/context/QuoteContext';
import HistoryDetailsForm from '@/components/HistoryDetailsForm';

export default function HistoryPage() {
  const router = useRouter();
  const { quoteState, onChangeHistory } = useQuote();

  const handleSubmit = () => {
    router.push('/quote/summary');
  };

  return (
    <HistoryDetailsForm
      state={quoteState}
      onChangeHistory={onChangeHistory}
      onSubmit={handleSubmit}
    />
  );
}
