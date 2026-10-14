"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy", className = "bg-white" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className={`press brut-sm min-h-11 px-3 py-2 font-bold ${className}`}
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}>
      <span aria-live="polite">{copied ? "Copied!" : label}</span>
    </button>
  );
}
