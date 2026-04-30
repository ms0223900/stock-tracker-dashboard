const stack = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "Recharts",
  "Supabase",
  "Yahoo Finance API",
  "Telegram Bot",
  "Vercel",
] as const;

const mustHave = [
  "完整台股代號查詢（例如 2330.TW）",
  "即時股價顯示與目標價追蹤",
  "Supabase 儲存 watchlist，達標 Telegram 通知",
  "輸入驗證與友善錯誤訊息",
] as const;

const later = [
  "登入與多使用者隔離",
  "多股票完整管理",
  "歷史股價與技術分析",
  "LINE、付費功能",
] as const;

export default function HomePage() {
  return (
    <main className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-1/4 top-0 h-[480px] w-[480px] rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[400px] w-[520px] rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-16 sm:py-24">
        <header className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-400/90">
            課程 MVP
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            股價投資看板
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-300">
            輸入台股代號與目標股價，查看即時報價、將追蹤條件存進
            Supabase，當股價達標時由 Telegram
            提醒你。這是第一版可部署、可驗收的最小產品，聚焦流程與整合，而非完整投資平台。
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-200">
              代號格式：<code className="text-emerald-300">2330.TW</code>
            </span>
            <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-200">
              第一版不自動補 <code className="text-zinc-400">.TW</code>
            </span>
          </div>
        </header>

        <section
          aria-labelledby="mvp-features"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl shadow-black/20 backdrop-blur-sm"
        >
          <h2
            id="mvp-features"
            className="text-lg font-semibold text-white"
          >
            這個版本做什麼
          </h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-300">
            {mustHave.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tech-stack" className="space-y-4">
          <h2 id="tech-stack" className="text-lg font-semibold text-white">
            技術棧
          </h2>
          <ul className="flex flex-wrap gap-2">
            {stack.map((item) => (
              <li key={item}>
                <span className="inline-flex rounded-lg border border-zinc-700/80 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-200">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="out-of-scope"
          className="rounded-2xl border border-dashed border-zinc-700/80 bg-zinc-900/20 p-8"
        >
          <h2 id="out-of-scope" className="text-lg font-semibold text-zinc-200">
            先不做（刻意縮小範圍）
          </h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-400">
            {later.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-zinc-800 pt-10 text-sm text-zinc-500">
          <p>
            規格詳見專案內{" "}
            <code className="text-zinc-400">docs/spec.md</code>。
          </p>
        </footer>
      </div>
    </main>
  );
}
