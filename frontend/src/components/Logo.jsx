import React from "react";

export function LogoIcon({ className = "h-8 w-8", showRing = false }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {showRing && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-fuchsia-500/20 blur-md" aria-hidden />
      )}
      <img src="/logo-icon.png" alt="StudyOS" className="relative h-full w-auto object-contain" draggable={false} />
    </div>
  );
}

export function LogoFull({ className = "h-10" }) {
  return <img src="/logo.png" alt="StudyOS" className={`${className} w-auto object-contain`} draggable={false} />;
}

export function LogoMark({ size = "md" }) {
  const sizes = { sm: "h-7", md: "h-9", lg: "h-12" }[size] || "h-9";
  return (
    <span className="inline-flex items-center gap-2">
      <img src="/logo-icon.png" alt="" className={`${sizes} w-auto object-contain`} />
      <span className="font-heading font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
        StudyOS
      </span>
    </span>
  );
}
