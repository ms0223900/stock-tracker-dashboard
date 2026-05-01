---
name: develop-stock-dashboard
description: Implements the stock investment dashboard with Next.js, Supabase, Yahoo Finance, Recharts, and Telegram. Use when building or modifying project features.
---

# Develop Stock Dashboard

## Development Flow

1. Check `docs/spec.md` before changing behavior.
2. Implement validation first: stock symbols must match full Taiwan format such as `2330.TW`; target price must be a number greater than 0.
3. Fetch quotes from Yahoo Finance chart API and normalize data into typed objects.
4. Persist watchlist rows in Supabase and keep notification state in `is_notified` and `notified_at`.
5. Send Telegram alerts from server-side code only.
6. Run the available package scripts after changes and report any missing environment variables.

## MVP Boundaries

- Do not add login, paid features, trading, advice, technical indicators, or LINE integration without an explicit request.
- Do not duplicate notifications after a row is marked notified.
- Prefer clear Traditional Chinese UI messages for validation and runtime errors.
