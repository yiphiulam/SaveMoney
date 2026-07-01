import React, { useState, useEffect } from "react";
import { 
  Coins, 
  Flame, 
  Brain, 
  Sparkles, 
  TrendingDown, 
  ShieldAlert, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  HelpCircle, 
  Layers, 
  Gift, 
  Lock, 
  Unlock, 
  AlertTriangle,
  Award, 
  Share2, 
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Transaction, RoastResponse, CollectibleCard, MicroTask } from "./types";
import { INITIAL_CARDS, INITIAL_TASKS } from "./data";

export default function App() {
  // 1. Core State
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "tx_1",
      amount: 85,
      category: "手搖飲",
      description: "大杯手工黑糖波霸鮮奶茶",
      date: "2026-06-29",
      isImpulse: true,
      resisted: false,
      willpowerEarned: 0,
    },
    {
      id: "tx_2",
      amount: 380,
      category: "潮玩盲盒",
      description: "原價購入日本知名IP限定盲盒",
      date: "2026-06-30",
      isImpulse: true,
      resisted: false,
      willpowerEarned: 0,
    },
    {
      id: "tx_3",
      amount: 450,
      category: "萬惡外送",
      description: "深夜餓到靈魂出竅外送雙倍起司大披薩",
      date: "2026-06-30",
      isImpulse: true,
      resisted: false,
      willpowerEarned: 0,
    },
    {
      id: "tx_4",
      amount: 2400,
      category: "潮流服飾",
      description: "高反差極簡 Cyberpunk 戰術防風外套",
      date: "2026-07-01",
      isImpulse: true,
      resisted: true,
      willpowerEarned: 40,
    },
    {
      id: "tx_5",
      amount: 680,
      category: "跟風剁手",
      description: "網紅同款拍照專用辣妹上衣",
      date: "2026-07-01",
      isImpulse: true,
      resisted: false,
      willpowerEarned: 0,
    }
  ]);

  const [monthlyBudget, setMonthlyBudget] = useState<number>(5000);
  const [willpower, setWillpower] = useState<number>(40); // Willpower points
  const [walletCash, setWalletCash] = useState<number>(180); // Extra cash earned from microtasks

  // Cards and Tasks State
  const [unlockedCards, setUnlockedCards] = useState<string[]>(["card_wallet_ghost"]); // initial unlocked card
  const [customCards, setCustomCards] = useState<CollectibleCard[]>([]);
  const [tasks, setTasks] = useState<MicroTask[]>(INITIAL_TASKS);
  
  // Interactive UI State
  const [activeTab, setActiveTab] = useState<"FEED" | "COLLECTION" | "BATTLE" | "TASKS">("FEED");
  const [roastForm, setRoastForm] = useState({
    description: "",
    amount: "",
    category: "手搖飲",
    isImpulse: true,
    isResisted: false
  });

  const [currentRoast, setCurrentRoast] = useState<RoastResponse>({
    roastText: "準備好了嗎？輸入你剛才揮霍的成果，或者你想買但正在痛苦掙扎的商品。本 AI 絕對不會對你溫柔。",
    severity: "mild",
    memeTitle: "預備小韭菜"
  });
  
  const [isRoasting, setIsRoasting] = useState(false);
  const [isUnboxing, setIsUnboxing] = useState(false);
  const [justUnboxedCard, setJustUnboxedCard] = useState<CollectibleCard | null>(null);
  
  // Audit战报 state
  const [auditReport, setAuditReport] = useState<{
    title: string;
    summary: string;
    lethalAdvice: string;
    survivalRate: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Task active execution state
  const [activeTask, setActiveTask] = useState<MicroTask | null>(null);
  const [taskStep, setTaskStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // State for adding standard transactions directly
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [newTxForm, setNewTxForm] = useState({
    description: "",
    amount: "",
    category: "手搖飲",
    isImpulse: true,
    resisted: false
  });

  // Share Notification helper
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Calculated variables
  const totalSpent = transactions.filter(t => !t.resisted).reduce((sum, t) => sum + t.amount, 0);
  const totalResistedSaved = transactions.filter(t => t.resisted).reduce((sum, t) => sum + t.amount, 0);
  const remainingBudget = monthlyBudget - totalSpent;
  const sinsCount = transactions.filter(t => !t.resisted && t.isImpulse).length;

  const severityColors = {
    mild: "text-green-400 border-green-500 bg-green-950/20",
    savage: "text-amber-400 border-amber-500 bg-amber-950/20",
    nuclear: "text-rose-500 border-rose-600 bg-rose-950/40"
  };

  // Run initial audit analysis automatically
  useEffect(() => {
    generateQuickAudit();
  }, [transactions]);

  // Handle transaction deletion
  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.resisted) {
      // deduct willpower gained if deleted
      setWillpower(prev => Math.max(0, prev - tx.willpowerEarned));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Submit quick roast & optionally log transaction
  const handleRoastSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roastForm.description || !roastForm.amount) return;

    setIsRoasting(true);
    const amountNum = parseFloat(roastForm.amount);

    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: roastForm.description,
          amount: amountNum,
          category: roastForm.category,
          isImpulse: !roastForm.isResisted, // if user checked 'resisted', it's not a complete impulse success
          currentBalance: `剩餘預算: $${remainingBudget} 元`
        })
      });

      if (!response.ok) throw new Error("Server error");
      const data: RoastResponse = await response.json();
      setCurrentRoast(data);

      // Add to transaction stream
      const earnedWP = roastForm.isResisted ? Math.round(amountNum * 0.05 + 10) : 0;
      const newTx: Transaction = {
        id: "tx_" + Date.now(),
        amount: amountNum,
        category: roastForm.category,
        description: roastForm.description,
        date: new Date().toISOString().split('T')[0],
        isImpulse: roastForm.isImpulse,
        resisted: roastForm.isResisted,
        willpowerEarned: earnedWP
      };

      setTransactions(prev => [newTx, ...prev]);
      if (roastForm.isResisted) {
        setWillpower(prev => prev + earnedWP);
        triggerNotification(`💪 忍耐成功！獲得了 ${earnedWP} 意志力`);
      } else {
        triggerNotification(`💸 罪惡記帳已登錄！AI 為你起草了無情評語`);
      }

      // Reset form description/amount but keep others for ease
      setRoastForm(prev => ({ ...prev, description: "", amount: "" }));

    } catch (err) {
      console.error(err);
      // Fallback
      const index = Math.floor(Math.random() * 3);
      const fallbacks = [
        {
          roastText: `（斷網吐槽）想買「${roastForm.description}」？你的錢包空虛度已經跟宇宙虛無差不多了。下個月直接去超商搶乞丐超人六折貼紙吧！`,
          severity: "savage" as const,
          memeTitle: "空氣儲蓄家"
        },
        {
          roastText: `（本地吐槽）花 $${amountNum} 買這個？你這是在幫資本家繳房租，自己卻連泡麵都要分兩餐吃。真是偉大的無私奉獻精神！`,
          severity: "nuclear" as const,
          memeTitle: "慈善家韭菜"
        },
        {
          roastText: `（本地吐槽）省省吧，這件「${roastForm.description}」買回去大概也只是在家裡堆灰塵。建議直接把卡剪掉。`,
          severity: "mild" as const,
          memeTitle: "一時腦熱患者"
        }
      ];
      const data = fallbacks[index];
      setCurrentRoast(data);

      const earnedWP = roastForm.isResisted ? Math.round(amountNum * 0.05 + 10) : 0;
      const newTx: Transaction = {
        id: "tx_" + Date.now(),
        amount: amountNum,
        category: roastForm.category,
        description: roastForm.description,
        date: new Date().toISOString().split('T')[0],
        isImpulse: roastForm.isImpulse,
        resisted: roastForm.isResisted,
        willpowerEarned: earnedWP
      };

      setTransactions(prev => [newTx, ...prev]);
      if (roastForm.isResisted) {
        setWillpower(prev => prev + earnedWP);
        triggerNotification(`💪 忍耐成功！獲得了 ${earnedWP} 意志力`);
      }
      setRoastForm(prev => ({ ...prev, description: "", amount: "" }));
    } finally {
      setIsRoasting(false);
    }
  };

  // Generate complete Gen Z monthly analysis
  const generateQuickAudit = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze-spending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions,
          monthlyBudget
        })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setAuditReport(data);
    } catch {
      // Local fallback
      const ratio = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 100;
      let title = "初級吃土新秀";
      let summary = "（本地吐槽）你的記帳紀錄跟你的腦波一樣，充滿了隨機性。看起來你正走在月底準時吃土的康莊大道上，連導航都省了。";
      let lethalAdvice = "建議每天對著錢包默哀三秒鐘，或者直接把信用卡放進冰箱冷凍。";
      let survivalRate = "12.5% (僅靠超商 65 折泡麵維持生命體徵)";

      if (ratio > 100) {
        title = "資本主義優秀韭菜";
        summary = `你已經超支了 ${Math.round(ratio - 100)}%！你真以為自己家裡有礦嗎？大腦的多巴胺腺體是不是被購物軟體綁架了？`;
        lethalAdvice = "月底請自備吸管，去公園吸取自然界能量，因為你連空氣可能都快買不起了。";
        survivalRate = "0.01% (靠喝白開水飽腹)";
      } else if (transactions.filter(t => t.resisted).length > 0) {
        title = "微弱抵抗的掙扎者";
        summary = `恭喜你成功擊退了幾次衝動！雖然你還是花了不少錢，但至少你的錢包還殘存一口氣。`;
        lethalAdvice = "別高興得太早，下一次手搖飲的香氣正在下個街角等著擊碎你的防線。";
        survivalRate = "45% (勉勉強強活到發薪日)";
      }

      setAuditReport({ title, summary, lethalAdvice, survivalRate });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Trigger temporary onscreen notification
  const triggerNotification = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Unlock Blind Box (costs 50 WP)
  const handleOpenBlindBox = async () => {
    if (willpower < 50) {
      triggerNotification("❌ 意志力點數不足 50！快去完成任務或忍耐消費賺取！");
      return;
    }

    setIsUnboxing(true);
    setJustUnboxedCard(null);

    // Give it a 2-second epic loading feel
    await new Promise(resolve => setTimeout(resolve, 1800));

    try {
      // Deduct willpower
      setWillpower(prev => prev - 50);

      // Roll 60% chance for a personalized transaction-based card if custom transactions exist
      const rollPersonalized = Math.random() < 0.6 && transactions.length > 0;

      if (rollPersonalized) {
        const tx = transactions[Math.floor(Math.random() * transactions.length)];
        const response = await fetch("/api/generate-custom-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            resisted: tx.resisted
          })
        });

        if (response.ok) {
          const generatedData = await response.json();
          const newCustomCard: CollectibleCard = {
            id: "custom_" + Date.now(),
            title: generatedData.title,
            description: generatedData.description,
            imagePrompt: generatedData.imagePrompt,
            bgColor: generatedData.bgColor || "bg-purple-950/40 border-purple-500",
            textColor: generatedData.textColor || "text-purple-400",
            rarity: generatedData.rarity || "SR",
            unlockedAt: new Date().toISOString()
          };

          setCustomCards(prev => [newCustomCard, ...prev]);
          setJustUnboxedCard(newCustomCard);
          triggerNotification(`🎉 成功抽到【專屬客製自嘲卡】：【${newCustomCard.title}】！`);
          setIsUnboxing(false);
          return;
        }
      }

      // Default standard card roll
      const locked = INITIAL_CARDS.filter(c => !unlockedCards.includes(c.id));
      let chosenCard: CollectibleCard;

      if (locked.length > 0) {
        chosenCard = locked[Math.floor(Math.random() * locked.length)];
      } else {
        chosenCard = INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)];
      }

      setUnlockedCards(prev => [...prev, chosenCard.id]);
      setJustUnboxedCard(chosenCard);
      triggerNotification(`🎉 成功抽到盲盒卡片：【${chosenCard.title}】！`);
    } catch (err) {
      console.error("Personalized unboxing failed, falling back to standard card:", err);
      // Fallback
      const locked = INITIAL_CARDS.filter(c => !unlockedCards.includes(c.id));
      const chosenCard = locked.length > 0 
        ? locked[Math.floor(Math.random() * locked.length)] 
        : INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)];

      setUnlockedCards(prev => [...prev, chosenCard.id]);
      setJustUnboxedCard(chosenCard);
      triggerNotification(`🎉 成功抽到經典盲盒卡片：【${chosenCard.title}】！`);
    } finally {
      setIsUnboxing(false);
    }
  };

  // Start executing microtask
  const startTask = (task: MicroTask) => {
    if (task.completed) return;
    setActiveTask(task);
    setTaskStep(0);
    setSurveyAnswers([]);
    setIsUploadingPhoto(false);
  };

  // Handle interactive survey microtask steps
  const submitSurveyAnswer = (answer: string) => {
    const updatedAnswers = [...surveyAnswers, answer];
    setSurveyAnswers(updatedAnswers);
    if (updatedAnswers.length >= 3) {
      // Complete survey task
      completeActiveTask(35, "willpower");
    } else {
      setTaskStep(prev => prev + 1);
    }
  };

  // complete clothes recycle upload
  const simulatePhotoUpload = () => {
    setIsUploadingPhoto(true);
    setTimeout(() => {
      completeActiveTask(150, "cash");
    }, 1800);
  };

  // complete watching commercial ad
  const simulateAdWatch = () => {
    setIsUploadingPhoto(true); // acts as loading spinner
    setTimeout(() => {
      completeActiveTask(20); // willpower
    }, 3000);
  };

  // Complete the current task & claim rewards
  const completeActiveTask = (amount: number, type: "willpower" | "cash" = "willpower") => {
    if (!activeTask) return;

    setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, completed: true } : t));
    
    if (type === "willpower") {
      setWillpower(prev => prev + amount);
      triggerNotification(`💰 任務完成！獲得 +${amount} 意志力！`);
    } else {
      setWalletCash(prev => prev + amount);
      triggerNotification(`💵 任務完成！實體補貼 +$${amount} 模擬金已存入！`);
    }

    setActiveTask(null);
  };

  // Reset demo states
  const resetDemoState = () => {
    setTransactions([
      {
        id: "tx_1",
        amount: 85,
        category: "手搖飲",
        description: "大杯手工黑糖波霸鮮奶茶",
        date: "2026-06-29",
        isImpulse: true,
        resisted: false,
        willpowerEarned: 0,
      }
    ]);
    setWillpower(10);
    setWalletCash(0);
    setUnlockedCards(["card_wallet_ghost"]);
    setCustomCards([]);
    setTasks(INITIAL_TASKS.map(t => ({ ...t, completed: false })));
    setCurrentRoast({
      roastText: "系統已歸零。來吧，向本 AI 申報你的最新愚蠢行為。",
      severity: "mild",
      memeTitle: "重生小白兔"
    });
    triggerNotification("🔄 系統已重設！重新開始你的反人性財務干預。");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans flex flex-col items-center justify-start p-2 sm:p-6 md:p-8">
      
      {/* Visual Header Grid & Container */}
      <div id="app-container" className="w-full max-w-6xl bg-[#0F0F0F] border-4 border-white p-4 sm:p-8 relative shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col min-h-[800px]">
        
        {/* Floating notifications */}
        {showNotification && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#FF0055] text-black text-xs sm:text-sm font-black px-4 py-3 border-2 border-white flex items-center gap-2 animate-bounce uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <ShieldAlert className="w-4 h-4" />
            <span>{showNotification}</span>
          </div>
        )}

        {/* Top Status & Main Typography Headings */}
        <header className="flex flex-col md:flex-row justify-between items-start border-b-4 border-white pb-6 mb-6 gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#FF0055] text-black font-mono text-xs font-bold px-2 py-0.5 tracking-widest uppercase">
                [ {remainingBudget < 1000 ? "STATUS: CRITICAL_DEBT" : remainingBudget < 3000 ? "STATUS: WARNING_DEBT" : "STATUS: TEMPORARY_STABLE"} ]
              </span>
              <span className="text-[#00FF41] font-mono text-xs hidden sm:inline">V1.0.42-STABLE</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-none uppercase tracking-tighter text-white font-display select-none">
              FINANCIAL<br/>
              <span className="text-[#FF0055]">FAILURE</span>
            </h1>
            <p className="text-xs sm:text-sm font-mono tracking-wide text-gray-400 mt-2">
              GEN-Z 反人性財務干預與微型變現引擎
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="bg-[#FF0055] text-black px-4 py-2 font-black text-sm uppercase tracking-wider transform -rotate-1 self-end w-max hover:rotate-0 transition-transform">
              🔥 毒舌盲盒防剁手
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-3 w-full md:w-auto text-right">
              <div className="border border-white/20 p-2 bg-[#141414]">
                <span className="text-[10px] block text-gray-500 font-mono">REMAINING BUDGET</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-[#00FF41]">${remainingBudget}</span>
              </div>
              <div className="border border-white/20 p-2 bg-[#141414]">
                <span className="text-[10px] block text-gray-500 font-mono">WILLPOWER POINTS</span>
                <span className="text-2xl sm:text-3xl font-mono font-black text-yellow-400 flex items-center justify-end gap-1">
                  <Brain className="w-5 h-5 text-yellow-400 inline" />
                  {willpower}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mt-1 self-end">
              <span>月度預算限額: </span>
              <input 
                id="budget-input"
                type="number" 
                value={monthlyBudget} 
                onChange={(e) => setMonthlyBudget(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-16 bg-[#1a1a1a] border border-white/40 text-center text-white px-1 py-0.5 focus:outline-none focus:border-[#00FF41]"
              />
              <span>元</span>
            </div>
          </div>
        </header>

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow pb-4">
          
          {/* ================= COLUMN 1: AI ROAST ZONE (Left - 5 Cols) ================= */}
          <section id="roast-zone" className="col-span-1 lg:col-span-5 bg-[#121212] border-2 border-white p-4 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#FF0055] rounded-full animate-pulse"></div>
                  <span className="font-mono text-xs uppercase tracking-widest text-[#FF0055]">AI_ROAST_ENGINE</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest border border-white/30 rounded ${
                  currentRoast.severity === "nuclear" ? "bg-rose-950 text-rose-400 border-rose-500" :
                  currentRoast.severity === "savage" ? "bg-amber-950 text-amber-400 border-amber-500" :
                  "bg-green-950 text-green-400 border-green-500"
                }`}>
                  {currentRoast.severity.toUpperCase()}
                </span>
              </div>

              {/* Current active roast screen */}
              <div className="min-h-[160px] flex flex-col justify-between bg-black/60 border border-white/10 p-4 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 font-mono text-[9px] text-gray-600 bg-white/5 uppercase select-none">
                  INTERACTIVE_PROMPT
                </div>
                <div>
                  <div className="font-mono text-xs text-yellow-400 mb-1">
                    [ AI 贈予你的嘲諷稱號: <span className="font-bold underline text-white">{currentRoast.memeTitle}</span> ]
                  </div>
                  <p className="text-lg sm:text-xl font-bold leading-relaxed italic text-white">
                    "{currentRoast.roastText}"
                  </p>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500 border-t border-white/10 pt-2 font-mono">
                  <span>SYSTEM_ONLINE_V1</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`【${currentRoast.memeTitle}】${currentRoast.roastText} #AI毒舌記帳`);
                      triggerNotification("📋 已複製毒舌戰報！分享到社交平台解鎖流量變現！");
                    }}
                    className="hover:text-white flex items-center gap-1 cursor-pointer"
                    id="copy-roast-btn"
                  >
                    <Share2 className="w-3 h-3 text-[#FF0055]" />
                    分享至社交媒體
                  </button>
                </div>
              </div>

              {/* Quick spending submit box */}
              <form onSubmit={handleRoastSubmission} className="bg-black p-4 border border-white/30 space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-white flex justify-between">
                  <span>登錄新消費 / 攔截衝動</span>
                  <span className="text-[#00FF41]">情緒阻力 + 意志考驗</span>
                </div>

                {/* Counter Human Nature Mode Select Toggle */}
                <div className="grid grid-cols-2 gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setRoastForm(prev => ({ ...prev, isResisted: false }))}
                    className={`py-2 text-xs font-bold transition-all border ${
                      !roastForm.isResisted 
                        ? "bg-[#FF0055] text-black border-white font-black" 
                        : "bg-transparent text-gray-400 border-white/20"
                    }`}
                    id="mode-spent-btn"
                  >
                    💸 我已經偷偷付錢了
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoastForm(prev => ({ ...prev, isResisted: true }))}
                    className={`py-2 text-xs font-bold transition-all border ${
                      roastForm.isResisted 
                        ? "bg-[#00FF41] text-black border-white font-black" 
                        : "bg-transparent text-gray-400 border-white/20"
                    }`}
                    id="mode-resist-btn"
                  >
                    🛑 考慮中（攔截衝動）
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1">商品名稱 / 購物衝動原因：</label>
                    <input 
                      id="roast-desc-input"
                      type="text" 
                      placeholder="e.g. 大杯波霸微糖微冰、原神抽卡儲值、全新抗寒外套"
                      value={roastForm.description}
                      onChange={(e) => setRoastForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      className="w-full bg-[#151515] border border-white/30 p-2 text-white font-sans focus:outline-none focus:border-[#FF0055]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-1">金額 (TWD)：</label>
                      <input 
                        id="roast-amount-input"
                        type="number" 
                        placeholder="金額 $"
                        value={roastForm.amount}
                        onChange={(e) => setRoastForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                        className="w-full bg-[#151515] border border-white/30 p-2 text-white font-mono focus:outline-none focus:border-[#FF0055]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">消費類別：</label>
                      <select 
                        id="roast-cat-select"
                        value={roastForm.category}
                        onChange={(e) => setRoastForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#151515] border border-white/30 p-2 text-white focus:outline-none focus:border-[#FF0055]"
                      >
                        <option value="手搖飲">手搖飲 🧋</option>
                        <option value="萬惡外送">萬惡外送 🍕</option>
                        <option value="潮玩盲盒">潮玩盲盒 🧸</option>
                        <option value="跟風剁手">跟風剁手 🛍️</option>
                        <option value="社交聚餐">社交聚餐 🍺</option>
                        <option value="數位訂閱">數位訂閱 🎮</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  id="submit-roast-btn"
                  type="submit" 
                  disabled={isRoasting}
                  className={`w-full font-black text-sm p-3 transition-colors flex items-center justify-center gap-2 border-2 border-white ${
                    roastForm.isResisted 
                      ? "bg-[#00FF41] hover:bg-emerald-400 text-black" 
                      : "bg-[#FF0055] hover:bg-rose-600 text-white"
                  }`}
                >
                  {isRoasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>正在連結毒舌 AI 審計中...</span>
                    </>
                  ) : roastForm.isResisted ? (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>發起抵抗挑戰（賺取意志力）</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>直接付款（承受無情吐槽）</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sins Meter display */}
            <div className="mt-6 border-t border-white/20 pt-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-mono uppercase text-gray-400">Financial Sins (Last 10 Sins)</span>
                <span className="text-xs font-mono font-bold text-[#FF0055]">
                  {sinsCount} / 10 級紅色警戒
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const isSin = i < sinsCount;
                  return (
                    <div 
                      key={i} 
                      className={`h-3 border border-white/10 transition-colors ${
                        isSin ? "bg-[#FF0055] animate-pulse" : "bg-white/5"
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500 font-mono mt-1 text-right">
                [ 紅色區塊越多，代表你越容易向多巴胺妥協 ]
              </p>
            </div>
          </section>

          {/* ================= COLUMN 2: BLIND BOX LOOT SYSTEM (Middle - 4 Cols) ================= */}
          <section id="blind-box-system" className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            
            {/* The Blind Box Unboxing Center */}
            <div className="bg-[#00FF41] text-black p-5 flex-grow flex flex-col justify-between border-2 border-white relative shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
              <div className="absolute top-2 right-2 bg-black text-[#00FF41] text-[9px] px-2 py-0.5 font-mono">
                LOOT_BOX_V2
              </div>
              
              <div>
                <h3 className="font-black text-2xl uppercase italic tracking-tighter mb-2 flex items-center gap-1">
                  <Gift className="w-6 h-6 inline text-black" />
                  隨機盲盒抽獎
                </h3>
                <p className="text-xs text-black/80 leading-tight font-bold">
                  用你的『抗剁手意志力』進行對賭！每 50 點意志力可以解鎖一個極致自嘲盲盒，隨機解鎖珍稀 Gen Z 虛榮卡片。
                </p>
              </div>

              {/* Dynamic Blind Box visual placeholder */}
              <div className="my-6 flex justify-center relative">
                {isUnboxing ? (
                  <div className="w-36 h-36 border-4 border-black flex flex-col items-center justify-center bg-black text-[#00FF41] animate-bounce">
                    <span className="text-5xl font-mono animate-ping">?!</span>
                    <span className="text-xs font-black mt-2 tracking-widest uppercase">震盪爆箱中...</span>
                  </div>
                ) : justUnboxedCard ? (
                  <div className={`w-48 p-3 border-4 border-black text-left relative flex flex-col justify-between ${justUnboxedCard.bgColor} text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black text-white font-bold">{justUnboxedCard.rarity}</span>
                      <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider">Unlocked Art</span>
                    </div>
                    {/* Generative Image Art Canvas */}
                    <div className="w-full aspect-square mb-3 overflow-hidden border-2 border-black bg-black/60 relative flex items-center justify-center">
                      <img 
                        src={`https://image.pollinations.ai/prompt/${encodeURIComponent(justUnboxedCard.imagePrompt)}?width=300&height=300&nologo=true&seed=${justUnboxedCard.id}`}
                        alt={justUnboxedCard.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover animate-fade-in"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white mb-1 tracking-tight">{justUnboxedCard.title}</h4>
                      <p className="text-[9px] leading-tight text-white/90 font-sans line-clamp-3">
                        {justUnboxedCard.description}
                      </p>
                    </div>
                    <button 
                      onClick={() => setJustUnboxedCard(null)} 
                      className="absolute -top-2 -right-2 w-5 h-5 bg-black border border-white text-white flex items-center justify-center text-xs font-black rounded-full shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-36 h-36 border-4 border-black bg-[#0d0d0d] flex flex-col items-center justify-center relative group select-none">
                    <span className="text-6xl font-black text-[#00FF41] group-hover:scale-110 transition-transform">?</span>
                    <div className="absolute -top-2 -right-2 bg-black text-white text-[9px] px-1.5 py-0.5 border border-white">
                      {willpower >= 50 ? "READY" : "LOCKED"}
                    </div>
                    <span className="text-[10px] text-white/60 font-mono mt-1">COST: 50 WP</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                {willpower >= 50 ? (
                  <button 
                    onClick={handleOpenBlindBox}
                    disabled={isUnboxing}
                    className="w-full bg-black text-[#00FF41] hover:bg-white hover:text-black transition-colors font-black text-lg py-3 px-4 border-2 border-black"
                    id="unbox-btn"
                  >
                    🎉 立即消耗 50 意志力開箱！
                  </button>
                ) : (
                  <div className="bg-black/10 border border-black/30 p-2 text-xs font-bold text-center uppercase">
                    <Lock className="w-3 h-3 inline mr-1" />
                    還差 {50 - willpower} 點意志力 解鎖盲盒
                  </div>
                )}
                
                <p className="text-[10px] text-black/70 font-mono mt-2 uppercase tracking-tighter">
                  Avoid Impulse Purchases to Unlock Mythic Dopamine
                </p>
              </div>
            </div>

            {/* Streak Tracker */}
            <div className="border-2 border-white p-4 flex flex-col justify-between bg-black">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">🔥 CONTINUOUS RESIST STREAK</span>
                <span className="text-xs font-black text-[#00FF41]">+50 WP BONUS</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-2xl font-black font-display text-white">
                  <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                  <span>03 DAYS NO STARBUCKS</span>
                </div>
                <span className="bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/40 text-[10px] font-mono px-2 py-0.5">
                  STREAKING
                </span>
              </div>
            </div>
          </section>

          {/* ================= COLUMN 3: MICRO-MONETIZATION & AUDIT (Right - 3 Cols) ================= */}
          <section id="micro-monetization" className="col-span-1 lg:col-span-3 flex flex-col gap-4">
            
            {/* Real-time cash supplement hub (Microtasks) */}
            <div className="bg-white text-black p-4 border-2 border-white flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-black">
                    💸 缺錢吃土了？流量變現補貼
                  </h4>
                  <div className="bg-black text-white text-[10px] px-2 py-0.5 font-mono flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-400" />
                    <span>$ {walletCash} TWD</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-700 mb-4 leading-tight font-sans">
                  我們不會高高在上地教育你省錢，而是直接幫你賺。點擊下方 B2B 品牌微任務，模擬為商業公司出賣靈魂獲取意志力或月底低保金！
                </p>

                <div className="space-y-2.5">
                  {tasks.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => startTask(t)}
                      className={`border p-2.5 transition-all cursor-pointer flex flex-col justify-between ${
                        t.completed 
                          ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed" 
                          : "border-black hover:bg-black hover:text-white"
                      }`}
                      id={`task-btn-${t.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-[9px] font-bold uppercase text-[#FF0055] tracking-tight">
                          {t.sponsor}
                        </p>
                        <span className="text-[9px] font-mono px-1 border border-current font-bold">
                          +{t.rewardAmount} {t.rewardType === "willpower" ? "WP" : "$"}
                        </span>
                      </div>
                      <p className="text-xs font-black mt-1 line-clamp-1">{t.title}</p>
                      {t.completed && (
                        <p className="text-[9px] font-mono text-emerald-600 mt-1 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> 已申領回血補貼
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/10 text-[9px] text-gray-500 font-mono flex justify-between">
                <span>MUTUAL_AID_NET</span>
                <span>SPONSORED BY BRATS</span>
              </div>
            </div>

            {/* Quick action: Spend / Resist Switch Box */}
            <div className="border border-white/20 p-4 bg-black/80 flex flex-col gap-2">
              <span className="text-[10px] font-mono text-gray-400">🎯 QUICK FINANCIAL INTERVENTION</span>
              <p className="text-xs leading-snug">
                拿不準到底該不該買某個東西？點擊下方按鈕，直接開始一場高頻的多巴胺博弈。
              </p>
              <button 
                onClick={() => {
                  setRoastForm({
                    description: "想買但怕被吐槽的垃圾寶物",
                    amount: "250",
                    category: "跟風剁手",
                    isImpulse: true,
                    isResisted: true
                  });
                  document.getElementById("roast-zone")?.scrollIntoView({ behavior: "smooth" });
                  triggerNotification("✏️ 快速填充：已將模擬商品填入 AI 吐槽區，請在左側填寫具體名稱！");
                }}
                className="bg-white text-black font-black text-sm py-2 px-3 uppercase hover:bg-[#FF0055] hover:text-white transition-colors border border-black flex items-center justify-center gap-1 cursor-pointer"
                id="quick-eval-btn"
              >
                🔮 財務靈魂拷問診斷
              </button>
            </div>
            
            <div className="mt-auto flex justify-between font-mono text-[9px] opacity-40">
              <span>BratMoney STABLE-V1</span>
              <span>© 2026 ANTI-DOPAMINE INC.</span>
            </div>
          </section>

        </div>

        {/* ================= LOWER MODULE: TABBED VIEW / MORE HIGH FIDELITY PANELS ================= */}
        <section className="mt-6 border-t-2 border-white pt-6">
          
          {/* Bottom Tabs Nav Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/20 pb-4 mb-4 gap-4">
            <div className="flex gap-4 sm:gap-8 font-black italic text-sm sm:text-base md:text-lg">
              <button 
                onClick={() => setActiveTab("FEED")}
                className={`pb-1 transition-all uppercase cursor-pointer border-b-4 ${
                  activeTab === "FEED" ? "text-[#FF0055] border-[#FF0055]" : "text-gray-400 hover:text-white border-transparent"
                }`}
                id="tab-feed"
              >
                🧾 罪惡流水帳 ({transactions.length})
              </button>
              <button 
                onClick={() => setActiveTab("COLLECTION")}
                className={`pb-1 transition-all uppercase cursor-pointer border-b-4 ${
                  activeTab === "COLLECTION" ? "text-[#00FF41] border-[#00FF41]" : "text-gray-400 hover:text-white border-transparent"
                }`}
                id="tab-collection"
              >
                🃏 收藏盲盒集 ({unlockedCards.length})
              </button>
              <button 
                onClick={() => setActiveTab("BATTLE")}
                className={`pb-1 transition-all uppercase cursor-pointer border-b-4 ${
                  activeTab === "BATTLE" ? "text-yellow-400 border-yellow-400" : "text-gray-400 hover:text-white border-transparent"
                }`}
                id="tab-battle"
              >
                📊 毒舌財務戰報
              </button>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto text-xs font-mono">
              <span className="text-gray-500">ID: BROKE_STUDENT_404</span>
              <button 
                onClick={resetDemoState}
                className="text-rose-500 hover:text-rose-400 hover:underline border border-rose-500/30 px-2 py-0.5 text-[10px] cursor-pointer"
                id="reset-state-btn"
              >
                重置防剁手系統
              </button>
            </div>
          </div>

          {/* Tab Panel Content */}
          <div className="min-h-[220px]">
            
            {/* Tab 1: FEED - Dynamic Transaction Sin list */}
            {activeTab === "FEED" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400 font-mono pb-1 border-b border-white/10">
                  <span>所有已記錄消費或意志力抵抗</span>
                  <span>操作</span>
                </div>
                
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 border border-dashed border-white/10">
                    <AlertTriangle className="w-8 h-8 mx-auto text-[#FF0055] mb-2" />
                    無任何罪惡交易紀錄！看來你甚至連記帳都懶，真是末期患者。快在左側輸入你的消費！
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                    {transactions.map(t => (
                      <div 
                        key={t.id} 
                        className={`border-2 p-3 flex justify-between items-center bg-black/40 ${
                          t.resisted ? "border-[#00FF41] shadow-[2px_2px_0px_0px_rgba(0,255,65,0.2)]" : "border-[#FF0055] shadow-[2px_2px_0px_0px_rgba(255,0,85,0.2)]"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl mt-1">
                            {t.resisted ? "🛑" : "💸"}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-sm">{t.description}</span>
                              <span className={`text-[9px] font-bold px-1.5 uppercase ${
                                t.resisted 
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" 
                                  : "bg-rose-950 text-rose-400 border border-rose-500/30"
                              }`}>
                                {t.category}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {t.date} — {t.resisted ? `意志力抗衡省下 $${t.amount}元 (獎勵 +${t.willpowerEarned} WP)` : `失控噴了 $${t.amount}元`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-black text-base ${t.resisted ? "text-[#00FF41]" : "text-[#FF0055]"}`}>
                            {t.resisted ? `+$${t.amount}` : `-$${t.amount}`}
                          </span>
                          <button 
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-gray-600 hover:text-red-500 transition-colors p-1"
                            title="刪除此紀錄"
                            id={`del-tx-${t.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: COLLECTION - Mystery Cards Opened */}
            {activeTab === "COLLECTION" && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-400 font-mono">
                    你解鎖了 {unlockedCards.length + customCards.length} / {INITIAL_CARDS.length + customCards.length} 張 Gen Z 自嘲神卡
                  </span>
                  <span className="text-xs text-yellow-400 font-mono font-bold">
                    [ SSR卡代表你抗拒剁手或吃土的本領突破天際 ]
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Standard Cards */}
                  {INITIAL_CARDS.map(card => {
                    const isUnlocked = unlockedCards.includes(card.id);
                    return (
                      <div 
                        key={card.id}
                        className={`border-2 p-3 relative flex flex-col justify-between min-h-[240px] transition-all ${
                          isUnlocked 
                            ? `${card.bgColor} border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.15)]` 
                            : "bg-zinc-900/30 border-dashed border-white/20 text-gray-600"
                        }`}
                        id={`card-${card.id}`}
                      >
                        {card.rarity === "SSR" && isUnlocked && (
                          <div className="absolute -top-2.5 -right-2 bg-yellow-400 text-black font-black text-[8px] px-1.5 uppercase animate-pulse">
                            SSR 神話
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono px-1 bg-black text-white">{card.rarity}</span>
                          {!isUnlocked && <Lock className="w-3 h-3" />}
                        </div>

                        {/* Dynamic generative card artwork */}
                        <div className="w-full aspect-square overflow-hidden border border-black bg-black/60 relative flex items-center justify-center mb-2">
                          {isUnlocked ? (
                            <img 
                              src={`https://image.pollinations.ai/prompt/${encodeURIComponent(card.imagePrompt)}?width=300&height=300&nologo=true&seed=${card.id}`}
                              alt={card.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-3xl text-zinc-700">❓</span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-xs tracking-tight text-white line-clamp-1">
                            {isUnlocked ? card.title : "【未解鎖自嘲卡】"}
                          </h4>
                          <p className="text-[9px] leading-tight text-gray-400 mt-1 line-clamp-3">
                            {isUnlocked ? card.description : "消耗 50 點意志力抽盲盒，即有機會解鎖此卡片內容與宿命嘲諷！"}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Personalized Cards (Automatically unlocked upon unboxing) */}
                  {customCards.map(card => {
                    return (
                      <div 
                        key={card.id}
                        className={`border-2 p-3 relative flex flex-col justify-between min-h-[240px] transition-all ${card.bgColor} border-white text-white shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]`}
                        id={`card-${card.id}`}
                      >
                        <div className="absolute -top-2.5 -right-2 bg-[#FF0055] text-black font-black text-[8px] px-1.5 uppercase tracking-tighter">
                          專屬定制
                        </div>
                        
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono px-1 bg-black text-white">{card.rarity}</span>
                        </div>

                        {/* Generative card artwork */}
                        <div className="w-full aspect-square overflow-hidden border border-black bg-black/60 relative flex items-center justify-center mb-2">
                          <img 
                            src={`https://image.pollinations.ai/prompt/${encodeURIComponent(card.imagePrompt)}?width=300&height=300&nologo=true&seed=${card.id}`}
                            alt={card.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform hover:scale-110 duration-300"
                            loading="lazy"
                          />
                        </div>

                        <div>
                          <h4 className="font-black text-xs tracking-tight text-white line-clamp-1">
                            {card.title}
                          </h4>
                          <p className="text-[9px] leading-tight text-gray-300 mt-1 line-clamp-3">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: BATTLE - AI Audit Reports & Stats */}
            {activeTab === "BATTLE" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-black p-4 border border-white/20">
                <div className="md:col-span-4 space-y-4 border-r border-white/10 pr-0 md:pr-6">
                  <h4 className="text-xs font-black uppercase text-yellow-400 font-mono tracking-widest flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    月度財務赤字剖析
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-gray-400">當月預算額度:</span>
                      <span className="font-mono text-white font-bold">${monthlyBudget} TWD</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-gray-400">目前累計已花:</span>
                      <span className="font-mono text-rose-500 font-bold">${totalSpent} TWD</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-gray-400">阻斷衝動成功省下:</span>
                      <span className="font-mono text-[#00FF41] font-bold">${totalResistedSaved} TWD</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-gray-400">總交易筆數:</span>
                      <span className="font-mono text-white font-bold">{transactions.length} 筆</span>
                    </div>
                  </div>

                  <button 
                    onClick={generateQuickAudit}
                    disabled={isAnalyzing}
                    className="w-full bg-[#00FF41] text-black font-black text-xs py-2 px-3 border border-black hover:bg-white transition-colors"
                    id="trigger-audit-btn"
                  >
                    {isAnalyzing ? "正在連線 AI 重新計算生存率..." : "🔄 重新計算毒舌財務戰報"}
                  </button>
                </div>

                <div className="md:col-span-8 flex flex-col justify-between">
                  {auditReport ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-gray-500 font-mono block">AUDIT REPORT TITLE</span>
                          <h3 className="text-2xl font-black text-[#FF0055] uppercase italic font-display">
                            【 {auditReport.title} 】
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 font-mono block">月底生存概率</span>
                          <span className="text-xl font-mono font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 border border-yellow-400/30">
                            {auditReport.survivalRate}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/5 p-3 border border-white/10">
                        <span className="text-[9px] text-yellow-500 font-mono block mb-1">無情審計鑑定:</span>
                        <p className="text-sm text-gray-300 leading-relaxed font-sans">
                          {auditReport.summary}
                        </p>
                      </div>

                      <div className="bg-rose-950/20 p-3 border border-rose-500/30">
                        <span className="text-[9px] text-rose-400 font-mono block mb-1">致命財務建議:</span>
                        <p className="text-xs text-rose-300 font-bold font-sans">
                          " {auditReport.lethalAdvice} "
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full py-8 text-gray-500">
                      載入審計報告中...
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>

      </div>

      {/* Interactive Microtask execution modal */}
      {activeTask && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f0f0f] border-4 border-white p-6 max-w-md w-full relative shadow-[8px_8px_0px_0px_rgba(255,0,85,1)]">
            <button 
              onClick={() => setActiveTask(null)}
              className="absolute top-2 right-2 text-white hover:text-[#FF0055] text-xl font-bold p-1"
              id="close-task-modal"
            >
              ×
            </button>
            
            <span className="text-[9px] bg-[#FF0055] text-black font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
              B2B 流量變現微型試煉
            </span>

            <h3 className="text-xl font-black text-white uppercase italic mt-3 mb-1">
              {activeTask.title}
            </h3>
            <p className="text-xs text-gray-400 font-mono mb-4">
              主辦方：{activeTask.sponsor} | 獎勵：+{activeTask.rewardAmount} {activeTask.rewardType === "willpower" ? "意志力 (WP)" : "模擬回血金 ($)"}
            </p>

            <div className="bg-black/80 border border-white/20 p-4 min-h-[140px] flex flex-col justify-between mb-4">
              {/* Task 1: Survey Question Steps */}
              {activeTask.id === "task_survey_slang" && (
                <div>
                  {taskStep === 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-white">問題 1/3：當你想點一杯 $80 的黑糖波霸鮮奶茶時，你最真實的內心小劇場是？</p>
                      <div className="space-y-2">
                        <button 
                          onClick={() => submitSurveyAnswer("我辛苦工作難道不配喝一杯？")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          A. 「我今天這麼辛苦，喝一杯珍奶犒賞自己，很合理吧！」
                        </button>
                        <button 
                          onClick={() => submitSurveyAnswer("不喝我會破防。")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          B. 「不喝珍奶我下午會當場破防，無法工作，造成的產值損失更大。」
                        </button>
                        <button 
                          onClick={() => submitSurveyAnswer("我是韭菜，我認了。")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          C. 「我是心甘情願被資本家收割的多巴胺韭菜。」
                        </button>
                      </div>
                    </div>
                  )}

                  {taskStep === 1 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-white">問題 2/3：看到「買一送一」或「第二杯七折」的促銷，你的理智線在幾秒內斷裂？</p>
                      <div className="space-y-2">
                        <button 
                          onClick={() => submitSurveyAnswer("0.1秒")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          A. 0.1秒。甚至連手指都還沒反應過來，購物車已經結帳完畢。
                        </button>
                        <button 
                          onClick={() => submitSurveyAnswer("掙扎三秒")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          B. 勉強掙扎了 3 秒，想了想『省下來的錢反正也買不起台北市廁所』。
                        </button>
                        <button 
                          onClick={() => submitSurveyAnswer("買到就是賺到")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          C. 腦袋自動換算：『我不買就等於虧了那一份優惠，買到就是賺到！』
                        </button>
                      </div>
                    </div>
                  )}

                  {taskStep === 2 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-white">問題 3/3：當你看完本 App 給你的無情毒舌吐槽時，你的心率變化？</p>
                      <div className="space-y-2">
                        <button 
                          onClick={() => submitSurveyAnswer("破防但服氣")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          A. 當場心率飆到 130，破防了但不得不承認 AI 罵得太有道理。
                        </button>
                        <button 
                          onClick={() => submitSurveyAnswer("沒感覺，繼續剁手")}
                          className="w-full text-left bg-zinc-900 border border-white/30 p-2 text-xs hover:bg-white hover:text-black transition-colors"
                        >
                          B. 面無表情。死豬不怕滾水燙，吐槽越狠，我剁手越穩。
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Task 2: Clothes Upload Simulation */}
              {activeTask.id === "task_sell_old" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-gray-300">
                    請上架一件你買回來只拍過一次照，或者買了之後連吊牌都沒拆就堆在衣櫃深處的過季潮牌衣服。
                  </p>
                  
                  {isUploadingPhoto ? (
                    <div className="py-4 space-y-2">
                      <div className="w-10 h-10 border-4 border-t-[#FF0055] border-white/20 rounded-full animate-spin mx-auto"></div>
                      <p className="text-[10px] text-gray-400 font-mono">正在分析你的虛榮心溢價與衣物二手行情...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={simulatePhotoUpload}
                      className="mx-auto w-40 bg-[#00FF41] text-black font-black text-xs py-3 border border-black hover:bg-white transition-colors"
                    >
                      📸 拍照並一鍵二手回收
                    </button>
                  )}
                  <p className="text-[9px] text-gray-500">
                    系統將自動生成『兜售虛榮：我的高溢價後悔產物』拍賣標題，保證吸引下一個韭菜。
                  </p>
                </div>
              )}

              {/* Task 3: Watch commercial ad */}
              {activeTask.id === "task_ad_roast" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-gray-300">
                    我們強迫你觀看一段極度精準、用極致精美畫面試圖勾起你購買慾望的高級腕錶宣傳廣告。你需要保持心如止水、不被任何折扣或奢華字眼動搖。
                  </p>
                  
                  {isUploadingPhoto ? (
                    <div className="py-4 space-y-2">
                      <div className="h-2 bg-[#FF0055]/20 w-full overflow-hidden">
                        <div className="bg-[#FF0055] h-full animate-pulse w-3/4"></div>
                      </div>
                      <p className="text-[10px] text-white font-mono">正在強效植入多巴胺誘惑 (剩餘 2 秒)...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={simulateAdWatch}
                      className="mx-auto w-44 bg-[#FF0055] text-white font-black text-xs py-3 border border-white hover:bg-white hover:text-black transition-colors"
                    >
                      📺 觀看廣告（意志力鋼鐵淬煉）
                    </button>
                  )}
                  <p className="text-[9px] text-gray-500">
                    觀看完成後將直接注入 20 點意志能量，修補你脆弱的心防。
                  </p>
                </div>
              )}

              {/* Task 4: Social Share pocket reward */}
              {activeTask.id === "task_pocket_apply" && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-gray-300">
                    將你的『瀕死生存率』或『AI 靈魂吐槽』分享到 Instagram 限時動態或 Threads（模擬分享），向好友公開展示你被 AI 罵得狗血淋頭的窘境。
                  </p>
                  
                  <button 
                    onClick={() => completeActiveTask(50, "cash")}
                    className="mx-auto w-48 bg-[#00FF41] text-black font-black text-xs py-3 border border-black hover:bg-white transition-colors"
                  >
                    🤳 分享战報並秒領 $50 低保金
                  </button>
                  <p className="text-[9px] text-gray-500">
                    「只要我不覺得尷尬，尷尬的就是別人。」將焦慮轉化為社群互動，回血才是最實在的。
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setActiveTask(null)}
                className="bg-transparent text-gray-400 hover:text-white font-mono text-xs hover:underline"
              >
                取消任務
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
