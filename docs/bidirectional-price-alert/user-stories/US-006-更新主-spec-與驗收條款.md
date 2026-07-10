### US-006：更新主 spec 與驗收條款

**作為** 維護者
**我想要** 主 [`docs/spec.md`](../../spec.md) 反映雙向通知行為
**以便** 課程驗收與後續開發有單一真相來源

**輸入格式**：
- [`docs/bidirectional-price-alert/spec.md`](../spec.md) 定案內容
- US-001～US-005 實作結果
- 現有 spec 第四、七、八、九、十一節

**輸出格式**：
- 更新 `docs/spec.md`：
  - MVP 功能範圍與驗收條款含雙向通知
  - 第七節資料模型表（新欄位、移除 `is_notified`／`notified_at`）
  - 第八節通知範例（above／below 各一則）
  - 第九節「更新與通知」流程步驟（雙向獨立判定）
- 可選 follow-up checklist：`AGENTS.md`、`docs/line-push-vercel-cron/spec.md` 等仍引用舊欄位者

**驗收條件**：
- [ ] 資料模型表含新欄位與移除舊欄位說明
- [ ] 驗收條款含「僅以下」「僅以上」「雙向」「全關儲存失敗」情境
- [ ] 通知範例與第八節 Telegram／LINE 規則一致（每方向獨立、成功才標記）
- [ ] 與實作行為一致，無矛盾

**依賴關係**：
- US-001～US-005 定案後

**優先級**：P1
**相關功能**：專案規格
