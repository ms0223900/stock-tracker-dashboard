"use client";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-on-background">
        股價投資看板 — 課程實作起點
      </h1>
      <p className="mt-4 text-on-background-muted">
        此分支僅含專案工具鏈與 User Story 文件。請依序實作主線功能；卡關時請唯讀參考{" "}
        <code className="rounded bg-card-muted px-1">course/live-build</code>
        （分支說明見{" "}
        <code className="rounded bg-card-muted px-1">docs/COURSE-BRANCHES.md</code>
        ）。
      </p>
      <ol className="mt-6 list-decimal space-y-2 pl-6 text-on-background">
        <li>
          閱讀{" "}
          <code className="rounded bg-card-muted px-1">docs/user-stories/US-01.md</code>
          （US-01：即時股價查詢）
        </li>
        <li>完成 US-02～US-06</li>
        <li>
          加分：checkout{" "}
          <code className="rounded bg-card-muted px-1">
            course/student-advanced-features
          </code>
        </li>
      </ol>
      <p className="mt-8 text-sm text-on-background-muted">
        環境：複製 <code className="rounded bg-card-muted px-1">.env.example</code>{" "}
        為 <code className="rounded bg-card-muted px-1">.env.local</code> 後執行{" "}
        <code className="rounded bg-card-muted px-1">npm run dev</code>。
      </p>
    </main>
  );
}
