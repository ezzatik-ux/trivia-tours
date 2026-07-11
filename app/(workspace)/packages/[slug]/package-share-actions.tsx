"use client";

import { useState } from "react";
import { FileDown, MessageCircle, Mail, Link2, Check } from "lucide-react";

type Props = {
  packageName: string;
  code?: string | null;
  shareUrl: string;
  pdfUrl: string;
};

export function PackageShareActions({
  packageName,
  code,
  shareUrl,
  pdfUrl,
}: Props) {
  const [copied, setCopied] = useState(false);

  const label = code ? `Package ${code}: ${packageName}` : packageName;

  const waMsg = `Check out this package: ${label}\n${shareUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;

  function handleEmail() {
    const subject = `Trivia Pro Package: ${label}`;
    const body = `Check out this package: ${label}\n\n${shareUrl}`;
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  const btnBase =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-trivia-500 hover:bg-trivia-600 text-white`}
      >
        <FileDown className="w-4 h-4" />
        Download PDF
      </a>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`}
      >
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>

      <button
        type="button"
        onClick={handleEmail}
        className={`${btnBase} bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50`}
      >
        <Mail className="w-4 h-4" />
        Email
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className={`${btnBase} bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
