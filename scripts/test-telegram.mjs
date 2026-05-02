import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envRaw = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envRaw
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("="))
    .map(([k, ...v]) => [k.trim(), v.join("=").trim()]),
);

const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error("❌ 請設定 TELEGRAM_BOT_TOKEN 與 TELEGRAM_CHAT_ID 環境變數");
  process.exit(1);
}

console.log(`🤖 Bot Token: ${TELEGRAM_BOT_TOKEN.slice(0, 20)}...`);
console.log(`👤 Chat ID: ${TELEGRAM_CHAT_ID}`);
console.log("---");

const text = [
  `🚀 股價達標通知（測試）`,
  ``,
  `股票代號：AAPL`,
  `目前股價：$198.50`,
  `目標股價：$195.00`,
  `觸發時間：${new Date().toLocaleString("zh-TW", { hour12: false })}`,
].join("\n");

try {
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
      }),
    },
  );

  const data = await res.json();
  if (data.ok) {
    console.log("✅ Telegram 測試訊息發送成功！");
  } else {
    console.log("❌ 發送失敗:", data.description);
  }
} catch (err) {
  console.error("❌ 錯誤:", err.message);
}
