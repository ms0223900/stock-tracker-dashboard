# UI Redesign — User Stories 一覽

本目錄收錄根據 `docs/design-sample/stitch_taiwan_stock_price_tracker/` 設計樣本進行的 UI Redesign 共 6 個 User Story（US-010 ~ US-015），範圍為**介面風格與版面調整**，**功能邏輯完全不變**。

---

## US 一覽表

| US | 標題 | 優先級 | 依賴 | 說明 |
|----|------|--------|------|------|
| **010** | 套用設計系統主題配色與字體 | P0 | — | 淺色主題、Inter 字體、CSS tokens、TWSE 紅漲綠跌 |
| **011** | 建立頂部導覽列與側邊欄 | P0 | US-010 | TopNavBar + SideNavBar + 1280px container 佈局 |
| **012** | 重新設計股價查詢與結果卡片 | P0 | US-010, US-011 | Quick Query + bento grid 結果卡片 + 走勢圖 |
| **013** | 重新設計目標價格設定與 Telegram 資訊卡 | P0 | US-010, US-011, US-012 | Target Price 表單卡 + Telegram 串接卡 |
| **014** | 重新設計追蹤清單為卡片式佈局 | P0 | US-010, US-011 | 卡片式 watchlist + sparkline + 狀態徽章 |
| **015** | 新增新聞橫幅與行動版底部導覽列 | P1 | US-010, US-011, US-014 | Insights 橫幅 + mobile bottom nav |

---

## 依賴關係圖

```
US-010 (設計系統主題)
   │
   ├──→ US-011 (導覽列與版面)
   │        │
   │        ├──→ US-012 (查詢與結果卡片)
   │        │        │
   │        │        └──→ US-013 (目標價與 Telegram)
   │        │
   │        ├──→ US-014 (卡片式 watchlist)
   │        │        │
   │        │        └──→ US-015 (新聞橫幅與 bottom nav)
   │        │
   │        └── (US-011 為 US-012~015 提供 grid 版面基礎)
   │
   └── (US-010 為所有 US 提供色彩/字體/間距基礎)
```

### 依賴說明

- **US-010** 是根本依賴，所有 US 都需要其提供的色彩 token、字體、spacing 與 rounded 系統。
- **US-011** 建立 1280px 容器與 12 欄 grid，US-012~015 的版面佈局皆仰賴此結構。
- **US-012** 需要在 US-011 的 grid 中放置查詢與結果卡片，且其圖表顏色受 US-010 的 TWSE 漲跌色影響。
- **US-013** 的右側 4 欄卡片需與 US-012 的左側 8 欄結果卡片並排，且需 US-012 查詢結果才有目標價可設定。
- **US-014** 需要 US-011 的 grid 與 US-010 的主題色，可與 US-012/US-013 平行開發。
- **US-015** 的新聞橫幅放在 watchlist 下方（需 US-014 完成），行動版 bottom nav 需 US-011 版面完成。

---

## 建議開發順序

考量依賴關係與減少衝突，建議按以下順序進行：

```
第一波（不可或缺的基礎）
  US-010 ── 設計系統主題（globals.css、layout.tsx）

第二波（版面支柱）
  US-011 ── 導覽列與版面（layout structure）

第三波（可平行開發，但改動 page.tsx 同一檔案需注意衝突）
  US-012 ── 查詢與結果卡片（改 page.tsx 上半部）
  US-014 ── 卡片式 watchlist（改 page.tsx 下半部，僅與 US-012 在檔案層級衝突）

第四波（在前三波完成後進行）
  US-013 ── 目標價與 Telegram 卡（需左右 grid 布局到位）
  US-015 ── 新聞橫幅與 bottom nav（需 watchlist 與版面完成）
```

> **注意**：US-012、US-013、US-014、US-015 皆修改 `app/page.tsx`，建議以**單一 PR** 分批或用模組化方式（extract components）降低合併衝突。若需分多次實作，建議順序為：US-012 → US-014 → US-013 → US-015（從上往下逐步重建 page.tsx）。
