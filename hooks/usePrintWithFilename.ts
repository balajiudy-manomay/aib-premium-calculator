"use client";

import { useCallback } from "react";

export interface PrintOptions {
  fullName?: string;
  quoteId?: string;
  documentType: string;
  subTitle?: string;
  delayMs?: number;
}

/**
 * Custom hook for printing documents with a dynamically formatted custom PDF filename.
 * Sets document.title to `<fullName>-<quoteId>-<documentType>[-<subTitle>]` prior to window.print().
 */
export function usePrintWithFilename() {
  const printWithFilename = useCallback(
    async ({
      fullName,
      quoteId,
      documentType,
      subTitle,
      delayMs = 150,
    }: PrintOptions) => {
      if (typeof window === "undefined") return;

      const originalTitle = document.title;
      const userName = fullName && fullName.trim() ? fullName.trim() : "Client";
      const cleanName = userName.replace(/[/\\?%*:|"<>]/g, "");
      const cleanQuoteId = (quoteId || "").replace(/[/\\?%*:|"<>]/g, "");
      const cleanSubTitle = subTitle
        ? subTitle
            .replace(/[/\\?%*:|"<>]/g, "")
            .replace(/\s+/g, "_")
            .replace(/_Limited$/, "")
        : "";

      const fileNameParts = [cleanName, cleanQuoteId, documentType];
      if (cleanSubTitle) {
        fileNameParts.push(cleanSubTitle);
      }

      const customTitle = fileNameParts.filter(Boolean).join("-");
      document.title = customTitle;

      // Pause to allow browser DOM to register custom document.title before print dialog opens
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const restoreTitle = () => {
        if (typeof document !== "undefined" && originalTitle) {
          document.title = originalTitle;
        }
      };

      window.addEventListener("afterprint", restoreTitle, { once: true });

      window.print();

      // Fallback restoration after 2 seconds
      setTimeout(restoreTitle, 2000);
    },
    []
  );

  return { printWithFilename };
}

export default usePrintWithFilename;
