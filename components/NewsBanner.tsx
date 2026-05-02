"use client";

export default function NewsBanner() {
  return (
    <div className="col-span-12 rounded-xl overflow-hidden relative h-64 border border-outline-variant">
      <div className="absolute inset-0 bg-linear-to-r from-primary/80 to-primary/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_60%)]" />
      <div className="absolute inset-0 flex flex-col justify-center p-xl">
        <h2 className="text-white text-display-lg mb-xs max-w-md">
          Institutional Insights
        </h2>
        <p className="text-white/80 font-body-md">
          Access exclusive semiconductor supply chain analysis from top-tier
          Taiwanese analysts.
        </p>
        <button className="mt-md w-fit px-xl py-2 bg-white text-primary font-label-caps text-label-caps rounded-full hover:bg-surface-container/90 transition-all">
          READ REPORT
        </button>
      </div>
    </div>
  );
}
