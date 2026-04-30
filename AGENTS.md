# AGENTS.md

## 專案目標

本專案是課程用「股價投資看板」MVP：輸入台股代號與目標價，顯示即時股價，儲存追蹤條件，達標時透過 Telegram 通知。

## 基本規則

- 以 Next.js App Router、TypeScript、Tailwind CSS、Supabase、Telegram Bot API 為主要技術棧。
- 第一版只做單一股票查詢、目標價追蹤、Supabase 儲存、Telegram 達標通知與 Vercel 部署準備。
- 不主動加入登入、多使用者隔離、多股票完整管理、技術分析、買賣建議、LINE 通知或付費功能。
- 股票代號需使用完整台股格式，例如 `2330.TW`；第一版不自動補 `.TW`。
- 敏感資訊必須放在環境變數，不得寫死 Supabase key、Telegram token 或 chat id。
- 每次修改都優先保持小步驟、可驗收，並更新相關文件或 spec。
