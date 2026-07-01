import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialize Gemini client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback funny roasts for when the Gemini API key is missing
const FALLBACK_ROASTS = [
  {
    roastText: "買這個？你確定不是腦波弱被資本主義收割？你的存款餘額跟你的理智線一樣，已經細到看不見了。月底準備去超商守候乞丐超人貼紙吧！",
    severity: "savage",
    memeTitle: "多巴胺提款機"
  },
  {
    roastText: "哇，真是奢侈的生活方式呢！你血管裡流的已經不是血液，是新台幣和高糖分。月初當皇帝，月底當空氣吸食大師，這無縫切換的本領我給滿分。",
    severity: "nuclear",
    memeTitle: "月初暴裂皇帝"
  },
  {
    roastText: "買了這個，你離買房夢想又遠了整整 15 秒！沒關係，反正你也買不起。今天省下的手搖飲錢，過二十年就能買到半張壁紙了，繼續加油喔！",
    severity: "mild",
    memeTitle: "理財夢想家"
  }
];

// 1. API: Roast single purchase or buying desire (counter-human-nature intervention)
app.post("/api/roast", async (req, res) => {
  const { description, amount, category, isImpulse, currentBalance } = req.body;

  if (!description || typeof amount !== "number") {
    res.status(400).json({ error: "Missing description or amount." });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `你是一個專為 Gen Z 與月光族設計的極度毒舌、搞笑、嘲諷技能滿點的 AI 財務分析導師。
你的任務是針對用戶輸入的「想買的物品或已買物品」進行無情吐槽，提供足夠的情緒阻力，來幫助他們克制衝動消費或反省消費行爲。

以下是該筆消費的資料：
- 商品/消費名稱: "${description}"
- 金額: $${amount} 元
- 類別: "${category || "未分類"}"
- 是否為「衝動消費攔截」（即用戶在付錢前猶豫，想買但還沒買）: ${isImpulse ? "是 (請大力吐槽阻止他買！)" : "否 (他已經付錢了，請狠狠嘲笑他的馬後炮行為)"}
- 用戶當前狀態/餘額提示: "${currentBalance || "存款告急"}"

請使用生動活潑、極具台灣 Z 世代社群文化與網路流行語的繁體中文（例如：吃土、乞丐超人、腦波弱、韭菜、多巴胺、血管裡流著手搖飲、繳房租、破防、退坑、刷存在感）進行吐槽。
請注意：字數控制在 100 字以內，要句句帶刺、一針見血，但具有黑色幽默，讓人看了雖然受傷，但忍不住想截圖分享到 Instagram。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roastText: {
              type: Type.STRING,
              description: "繁體中文極度毒舌且好笑的吐槽內容，字數在 100 字內。"
            },
            severity: {
              type: Type.STRING,
              description: "毒舌嚴重程度：'mild' (輕微刺傷), 'savage' (當頭棒喝), 'nuclear' (體無完膚)。"
            },
            memeTitle: {
              type: Type.STRING,
              description: "針對這個消費給用戶起的嘲諷性稱號或迷因標題（如：乞丐超人候補、資本主義好韭菜、全糖血管大師，長度在 2-6 字）。"
            }
          },
          required: ["roastText", "severity", "memeTitle"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    const resultObj = JSON.parse(resultText);
    res.json(resultObj);

  } catch (error: any) {
    console.warn("Gemini API missing or failed, using custom local roaster:", error.message);
    // Grab a random local roast and customize it slightly based on the description
    const index = Math.floor(Math.random() * FALLBACK_ROASTS.length);
    const chosen = FALLBACK_ROASTS[index];
    
    // Customize fallback with user item
    let customizedText = chosen.roastText;
    if (description) {
      customizedText = `（本地吐槽引擎啟動）想買「${description}」？` + chosen.roastText;
    }
    
    res.json({
      roastText: customizedText,
      severity: chosen.severity,
      memeTitle: chosen.memeTitle,
      _isFallback: true
    });
  }
});

// 2. API: Dynamic Monthly Audit (毒舌財務戰報)
app.post("/api/analyze-spending", async (req, res) => {
  const { transactions, monthlyBudget } = req.body;

  if (!Array.isArray(transactions)) {
    res.status(400).json({ error: "Transactions must be an array." });
    return;
  }

  const budget = monthlyBudget || 8000;
  const totalSpent = transactions.filter(t => !t.resisted).reduce((sum, t) => sum + t.amount, 0);
  const totalSaved = transactions.filter(t => t.resisted).reduce((sum, t) => sum + t.amount, 0);
  const impulseCount = transactions.filter(t => t.isImpulse && !t.resisted).length;
  const successfullyResistedCount = transactions.filter(t => t.resisted).length;

  const transactionSummary = transactions
    .slice(0, 15)
    .map(t => `${t.date} ${t.resisted ? "[忍住未買]" : "[已消費]"} ${t.description} $${t.amount}元 (${t.category})`)
    .join("\n");

  try {
    const ai = getGeminiClient();
    const prompt = `你是一個無情的 Gen Z 財務會計機器人。請針對用戶最近的消費清單，撰寫一份總體『毒舌財務戰報（精準破防審計）』。
    
以下是統計數據：
- 月度預算：$${budget} 元
- 累計已花費：$${totalSpent} 元 (${totalSpent > budget ? "已超支！" : "尚未超支，但餘額岌岌可危"})
- 靠意志力省下的錢（攔截衝動消費成功）：$${totalSaved} 元
- 衝動消費得逞次數：${impulseCount} 次
- 成功干預衝動次數：${successfullyResistedCount} 次

最近消費明細如下：
${transactionSummary || "無任何記帳紀錄（看來是連記帳都懶的末期患者）"}

請根據上述情況，撰寫一個極其嘲諷且帶有黑色幽默的財務審計總結。
字數限制 150 字以內，用台灣 Z 世代習慣的繁體中文，格式包含：
1. 戰報總結（用嘲諷的語氣評價他們的理財狀態，例如『大灑幣時代』或『乞丐超人進化中』）
2. 一句最致命的毒舌建議。
3. 預測他們月底的生存概率 (如 0.01% 或 150% 等)。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "本期戰報稱號（如：瀕臨破產的狂歡、乞丐超人之王，4-8字繁體中文）"
            },
            summary: {
              type: Type.STRING,
              description: "毒舌財務審計總結，嘲諷性極高，100字內。"
            },
            lethalAdvice: {
              type: Type.STRING,
              description: "一句最致命的無情財務建議（50字內）。"
            },
            survivalRate: {
              type: Type.STRING,
              description: "月底生存機率預測百分比或搞怪字眼（如 '0.0003%', '靠吸空氣 100%'）"
            }
          },
          required: ["title", "summary", "lethalAdvice", "survivalRate"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    res.json(JSON.parse(resultText));

  } catch (error: any) {
    console.warn("Gemini API missing or failed, using fallback audit:", error.message);
    const ratio = budget > 0 ? (totalSpent / budget) * 100 : 100;
    let title = "初級吃土新秀";
    let summary = "你的記帳紀錄跟你的腦波一樣，充滿了隨機性。看起來你正走在月底準時吃土的康莊大道上，連導航都省了。";
    let lethalAdvice = "建議每天對著錢包默哀三秒鐘，或者直接把信用卡放進冰箱冷凍。";
    let survivalRate = "12.5% (僅靠超商 65 折泡麵維持生命體徵)";

    if (ratio > 100) {
      title = "資本主義優秀韭菜";
      summary = `你已經超支了 ${Math.round(ratio - 100)}%！你真以為自己家裡有礦嗎？大腦的多巴胺腺體是不是被購物軟體綁架了？`;
      lethalAdvice = "月底請自備吸管，去公園吸取日月精華，因為你連空氣可能都快買不起了。";
      survivalRate = "0.01% (靠喝白開水飽腹)";
    } else if (successfullyResistedCount > 0) {
      title = "微弱抵抗的掙扎者";
      summary = `恭喜你成功擊退了 ${successfullyResistedCount} 次腦波弱衝動！雖然你還是花了不少錢，但至少你的錢包還殘存一口氣。`;
      lethalAdvice = "別高興得太早，下一次手搖飲的香氣正在下個街角等著擊碎你的防線。";
      survivalRate = "45% (勉勉強強活到發薪日)";
    }

    res.json({
      title,
      summary: `（本地分析引擎）${summary}`,
      lethalAdvice,
      survivalRate,
      _isFallback: true
    });
  }
});

// 3. API: Dynamic Personalized Blind Box Card Generation based on a Transaction
app.post("/api/generate-custom-card", async (req, res) => {
  const { description, amount, category, resisted } = req.body;

  if (!description || typeof amount !== "number") {
    res.status(400).json({ error: "Missing description or amount for card generation." });
    return;
  }

  try {
    const ai = getGeminiClient();
    const prompt = `你是一個極度幽默、嘲諷技能拉滿的 Gen Z 盲盒收藏卡片設計師。
請根據用戶的某一次真實消費行為（或他靠意志力忍耐未買的行為），為他量身定制一張「獨一無二的自嘲收藏卡片」。

以下是該筆消費的數據：
- 消費/想買物品: "${description}"
- 金額: $${amount} 元
- 類別: "${category || "未分類"}"
- 是否靠意志力克制了購買衝動: ${resisted ? "是 (他成功忍住了！請在卡片中大力讚賞他的鋼鐵意志，給予他無上的光榮自嘲，卡片稀有度推薦 SR 或 SSR)" : "否 (他還是買了，花錢買了後悔。請狠狠吐槽嘲諷，卡片稀有度推薦 N 或 R)"}

請輸出 JSON 格式的卡片設計，包含：
1. title: 卡片名稱。必須極具 Z 世代社群文化與網梗（如：手搖飲大體積血栓、極地吸空氣大師、全糖血管戰士、二手虛榮回收商，4-8 字繁體中文）。
2. description: 卡片的自嘲或歌頌內容。極度搞笑，讓人看了雖然受傷，但忍不住想截圖分享到 Instagram。字數控制在 80 字以內，繁體中文。
3. imagePrompt: 專門用來生成這張卡片插畫的詳細、高畫質英文提示詞。
   - 格式應為描述性英文，如 "minimalist digital vector art of a boba tea cup with a cartoon skull face, glowing neon cyan background, flat colors, cyberpunk aesthetic, high contrast"
   - 請根據物品與卡片標題設計有趣的插畫。
4. rarity: 卡片稀有度。如果是克制成功則輸出 "SR" 或 "SSR"；如果克制失敗則輸出 "N" 或 "R"。
5. bgColor: 對應 rarity 的 Tailwind 背景與邊框顏色類別（如：SSR 是 "bg-yellow-950/40 border-yellow-500", SR 是 "bg-purple-950/40 border-purple-500", R 是 "bg-indigo-950/40 border-indigo-500", N 是 "bg-zinc-900 border-zinc-500"）。
6. textColor: 卡片文字色類別（如：SSR 是 "text-yellow-400", SR 是 "text-purple-400", R 是 "text-indigo-400", N 是 "text-zinc-400"）。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            rarity: { type: Type.STRING },
            bgColor: { type: Type.STRING },
            textColor: { type: Type.STRING }
          },
          required: ["title", "description", "imagePrompt", "rarity", "bgColor", "textColor"]
        }
      }
    });

    const resultText = response.text?.trim() || "{}";
    res.json(JSON.parse(resultText));

  } catch (error: any) {
    console.warn("Gemini Custom Card generation failed or key missing, using fallback generator:", error.message);
    // Dynamic local fallback card
    const isSSR = resisted;
    const title = resisted ? `鋼鐵意志【${description}】防禦盾` : `虛無【${description}】收割者`;
    const rarity = isSSR ? "SSR" : "R";
    const bgColor = isSSR ? "bg-emerald-950/40 border-emerald-500" : "bg-rose-950/40 border-rose-500";
    const textColor = isSSR ? "text-emerald-400" : "text-rose-400";
    
    // Create custom illustrative image prompt for local fallback too
    const itemQuery = description.replace(/[^\w\s\u4e00-\u9fa5]/gi, "");
    const imagePrompt = `minimalist stylized vector line art depicting ${itemQuery || "empty wallet"} in high contrast neon glow, cyberpunk dark background`;

    res.json({
      title,
      description: resisted 
        ? `（本地生成）你成功戰勝了對於「${description}」的誘惑，省下了 $${amount} 元！你的大腦前額葉在這一刻發出了耀眼的金光，你是理財界的奇蹟。`
        : `（本地生成）你終究還是為「${description}」噴了 $${amount} 元。你大腦的多巴胺在發酵，而你的銀行帳戶在哭泣。恭喜收穫一件垃圾！`,
      imagePrompt,
      rarity,
      bgColor,
      textColor,
      _isFallback: true
    });
  }
});

// Serve static assets / Vite setup
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BratMoney Server] Running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
