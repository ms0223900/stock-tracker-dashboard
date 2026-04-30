好，直接給你一套**可落地的一鍵切換 AI 開發模式（Cursor 為主）**。
目標是：**不用手動改檔、不中斷 workflow，就能在 Prototype ↔ Production 間切換「AI 行為」**。

我會用「工程化」方式設計：**結構 → 腳本 → 規則 → 使用方式**。

---

# 一、設計原則（先講清楚策略）

這套方案的核心不是複製檔案，而是：

👉 **把 AI 行為視為「runtime config」**

所以我們做三件事：

1. **規則分層（mode-based）**
2. **入口統一（AGENTS.md + Cursor Rules）**
3. **用 script 切換（不是手動改）**

---

# 二、專案結構（可直接用）

```bash
.
├── AGENTS.md                # 統一入口（會被覆蓋）
├── agents/
│   ├── prototype.md
│   └── production.md
│
├── .cursor/
│   ├── rules/
│   │   ├── active/         # 👉 目前啟用（會被覆蓋）
│   │   ├── prototype/
│   │   │   ├── frontend.md
│   │   │   └── api.md
│   │   └── production/
│   │       ├── frontend.md
│   │       └── architecture.md
│
├── scripts/
│   └── switch-ai-mode.ts
│
├── package.json
```

---

# 三、AGENTS.md（兩種模式）

## agents/prototype.md

```md
# MODE: PROTOTYPE

## Goal
Ship fast. Minimize cognitive overhead.

## Rules
- Prefer speed over correctness
- Avoid abstractions unless necessary
- Inline logic is acceptable

## Code Style
- TypeScript preferred but not strict
- `any` is allowed
- Skip edge cases unless critical

## Architecture
- Flat structure
- Co-locate logic

## Testing
- Optional
```

---

## agents/production.md

```md
# MODE: PRODUCTION

## Goal
Maintainable, scalable, production-grade system.

## Rules
- Follow SOLID principles
- Enforce separation of concerns
- Avoid technical debt

## Code Style
- Strict TypeScript (no `any`)
- Explicit types required
- Pure functions preferred

## Architecture
- Layered / Clean Architecture
- Domain separation required

## Testing
- Unit tests required
- Edge cases must be handled
```

---

# 四、Cursor Rules（差異關鍵）

## prototype/frontend.md

```md
- Prefer simple implementations
- Avoid unnecessary abstractions
- Inline API calls are acceptable
- Minimal error handling
```

---

## production/frontend.md

```md
- Use hooks to encapsulate logic
- Separate UI and business logic
- No inline API calls
- Proper error handling required
```

---

## production/architecture.md

```md
- Follow Clean Architecture
- Separate domain / application / infrastructure
- Dependency direction must be inward
```

---

# 五、核心：切換腳本（TypeScript）

`scripts/switch-ai-mode.ts`

```ts
import fs from "fs";
import path from "path";

const mode = process.argv[2];

if (!mode || !["prototype", "production"].includes(mode)) {
  console.error("Usage: pnpm ai:mode [prototype|production]");
  process.exit(1);
}

const root = process.cwd();

// 1️⃣ 切 AGENTS.md
fs.copyFileSync(
  path.join(root, `agents/${mode}.md`),
  path.join(root, "AGENTS.md")
);

// 2️⃣ 清空 active rules
const activeDir = path.join(root, ".cursor/rules/active");

if (fs.existsSync(activeDir)) {
  fs.rmSync(activeDir, { recursive: true, force: true });
}
fs.mkdirSync(activeDir, { recursive: true });

// 3️⃣ 複製 rules
const sourceDir = path.join(root, `.cursor/rules/${mode}`);
const files = fs.readdirSync(sourceDir);

for (const file of files) {
  fs.copyFileSync(
    path.join(sourceDir, file),
    path.join(activeDir, file)
  );
}

console.log(`✅ Switched AI mode to: ${mode}`);
```

---

# 六、package.json

```json
{
  "scripts": {
    "ai:prototype": "tsx scripts/switch-ai-mode.ts prototype",
    "ai:production": "tsx scripts/switch-ai-mode.ts production"
  }
}
```

---

# 七、使用方式（你日常會怎麼用）

### 🚀 開發初期（快速做）

```bash
pnpm ai:prototype
```

👉 AI 會：

* 少抽象
* 快速產 code
* 容忍 hack

---

### 🏗️ 要上線前（收斂品質）

```bash
pnpm ai:production
```

👉 AI 會：

* 開始拆層
* 強制型別
* 補測試

---

# 八、Cursor System Prompt（關鍵加成）

👉 建議你在 Cursor 設定裡固定放：

---

## System Prompt（通用版）

```txt
You are a senior frontend engineer.

Follow the rules defined in AGENTS.md and /rules strictly.

If rules conflict:
- Prioritize AGENTS.md
- Then /rules
- Then user instruction

Always explain tradeoffs when making decisions.
```

---

👉 這段很重要，它做兩件事：

1. **強制 AI 去讀 AGENTS.md**
2. 建立「優先順序模型」

---

# 九、進階優化（可選但很強）

## 1️⃣ 顯示目前模式（避免混亂）

在 AGENTS.md 最上面：

```md
> 🚨 CURRENT MODE: PRODUCTION
```

---

## 2️⃣ Git hook（避免錯模式 commit）

```bash
# .husky/pre-commit
grep "PRODUCTION" AGENTS.md || echo "⚠️ Not in production mode"
```

---

## 3️⃣ CI 檢查（進階）

* production mode 才允許 merge main
* prototype mode 禁止 deploy

---

# 十、你會得到什麼效果

這套跑起來之後：

### Prototype 模式

👉 AI = 中階工程師（快但隨便）

### Production 模式

👉 AI = 資深架構師（慢但穩）

---

# 最後總結（關鍵一句）

👉 **你不是在「調 prompt」，你是在「切換工程文化」**