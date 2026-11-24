import 'dotenv/config';
import express from 'express';
import path from 'path';
import { Readable } from 'stream';
import { ReadableStream as WebReadableStream } from 'stream/web';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseGeminiJson(text: string | undefined): unknown {
  const cleaned = (text ?? '{}')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned || '{}');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/dex-ai-audit', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const {
        venueName,
        pairLabel,
        mode,
        livePrice,
        entryPrice,
        stopLoss,
        takeProfit,
        riskPercent,
        rrRatio,
        notionalUsd,
        poolTvlUsd,
        swapFeeBps,
        priceImpactBps,
        spreadBps,
        rsi14,
        atrPct,
      } = req.body ?? {};

      const prompt = `Analyze this decentralized exchange (DEX) paper trade setup using the 11-module day-trader-skill framework:
Venue: ${venueName} (${pairLabel})
Execution Mode: ${mode}
Live DEX Mid Price: $${livePrice}
Planned Entry: $${entryPrice} | Stop-Loss (${riskPercent}% risk): $${stopLoss} | Take-Profit (1:${rrRatio} R:R): $${takeProfit}
Order Notional Size: $${notionalUsd}
AMM Pool TVL: $${poolTvlUsd} | LP Swap Fee: ${swapFeeBps} bps | AMM Price Impact: ${priceImpactBps} bps | CLOB Spread: ${spreadBps} bps
Technicals: RSI(14) = ${rsi14}, 14-bar ATR = ${atrPct}% of price.

Evaluate whether 24/7 autonomous DEX execution faces excessive slippage/fee drag relative to the stop distance, and provide an educational decision brief.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a quantitative DeFi and DEX risk educator applying the 11-module day-trader-skill workflow (scanner, news, analyst, pelosi, entry, exit, risk, budget, timemachine, alerts, broker). Keep responses concise, realistic, and strictly educational (paper simulation only, never financial advice). Highlight how AMM slippage, LP fees, and on-chain spread affect a 2% risk / 1:2 R:R setup.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: 'Short status: STAGE_LIMIT_OFFER, WAIT_FOR_PULLBACK, or REDUCE_SIZE_SLIPPAGE',
              },
              headline: {
                type: Type.STRING,
                description: 'One concise sentence summarizing the AI DEX audit result.',
              },
              executionFrictionNote: {
                type: Type.STRING,
                description: 'Analysis of AMM price impact + LP fee + spread relative to the 1:2 R:R edge.',
              },
              soloVsHumanNote: {
                type: Type.STRING,
                description: 'How a 24/7 autonomous DEX agent handles this vs. human-in-the-loop confirmation.',
              },
              moduleHighlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skill: { type: Type.STRING },
                    finding: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      res.json(parseGeminiJson(response.text));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error calling Gemini DEX audit.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/learning-coach', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const {
        question,
        symbol,
        livePrice,
        accountBalance,
        entryPrice,
        stopLoss,
        takeProfit,
        riskUsd,
        rewardUsd,
        candlePattern,
        priceZoneStatus,
        instrument,
        leverage,
      } = req.body ?? {};

      const prompt = `Learner Question: "${question}"

Live Context on Screen:
- Coin Selected: ${symbol} at Live Price $${livePrice}
- Learner Wallet Budget: $${accountBalance} (Mode: ${instrument}, Leverage: ${leverage}x)
- Planned Buy/Entry: $${entryPrice} | Safety Exit (Stop-Loss): $${stopLoss} (Max loss: $${riskUsd}) | Profit Goal: $${takeProfit} (Target gain: +$${rewardUsd})
- Latest Candlestick Clue: ${candlePattern}
- Current Price Zone: ${priceZoneStatus}

Answer the learner's question in warm, crystal-clear everyday English with zero unexplained Wall Street or crypto jargon. Help them understand how to make wise, calm decisions when experimenting with $5 in a real wallet (covering fee awareness, base reserves, never chasing spikes, and why risking pennies teaches real habits). Never give financial predictions or tell them a trade is guaranteed.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a patient, plain-English crypto market teacher helping a beginner learn market mechanics safely with a $5 real-wallet budget. Translate technical chart data into simple everyday analogies. Never promise profits or give financial advice; teach process, fee protection, and patience.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plainEnglishAnswer: {
                type: Type.STRING,
                description: 'Clear, friendly 2-4 sentence answer in everyday English.',
              },
              liveChartTranslation: {
                type: Type.STRING,
                description: 'What the live price and latest candle on screen mean right now in plain words.',
              },
              fiveDollarActionTip: {
                type: Type.STRING,
                description: 'One practical, safe habit for a $5 wallet experiment.',
              },
              jargonDecoded: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    simpleMeaning: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      res.json(parseGeminiJson(response.text));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error calling AI Learning Coach.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai-buy-sell-helper', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const {
        symbol,
        timeframe,
        livePrice,
        high24h,
        low24h,
        ema20,
        sma50,
        rsi14,
        fib382,
        fib500,
        fib618,
        latestPattern,
        accountBalance,
        riskPercent,
        recentCandlesSummary,
      } = req.body ?? {};

      const prompt = `Examine this LIVE crypto market state right now and generate recommended technical Buy (Entry), Safety Stop-Loss, and Sell (Take-Profit) points (Use at Your Own Risk):

Asset: ${symbol} (Timeframe: ${timeframe})
Current Live Price: $${livePrice}
24h Swing Range: Low $${low24h} to High $${high24h}
Moving Averages: 20 EMA = $${ema20} | 50 SMA = $${sma50}
Momentum: RSI(14) = ${rsi14}
Fibonacci Retracement Support/Resistance Levels:
- Fib 38.2%: $${fib382}
- Fib 50.0%: $${fib500}
- Fib 61.8% (Golden Pocket): $${fib618}
Latest Candlestick Pattern Detected: ${latestPattern}
Recent Candles Summary: ${recentCandlesSummary}
User Wallet Size: $${accountBalance} (Max Risk Per Trade: ${riskPercent}%)

Provide specific numerical Recommended Buy Zone 1 (Primary Pullback/Support Buy), Recommended Buy Zone 2 (Deep Value Buy), Recommended Stop-Loss (Invalidation Floor), and 3 Recommended Sell Zones (TP1 Conservative, TP2 Core 1:2 Target, TP3 Breakout Target), plus a plain-English explanation of why the live chart supports these exact points and what could invalidate the setup.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an algorithmic technical analysis helper examining live market structure (EMA 20/50, RSI 14, Fibonacci 38.2/50/61.8 levels, and candlestick patterns) to output concrete, disciplined Recommended Buy Points, Safety Stop-Loss Points, and Recommended Sell (Take-Profit) Points. Always include a clear reminder that all signals are probabilistic technical levels provided strictly on a "Use at Your Own Risk" basis with a strict 2% risk cap ($0.10 on a $5 wallet) and 1x Spot self-custody discipline.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketVerdict: {
                type: Type.STRING,
                description:
                  'One of: BUY_ZONE_ACTIVE, WAIT_FOR_PULLBACK_BUY, or SELL_RESISTANCE_ALERT',
              },
              verdictHeadline: {
                type: Type.STRING,
                description:
                  'Concise 1-sentence summary of the current live market posture and action.',
              },
              recommendedBuy1: {
                type: Type.NUMBER,
                description: 'Primary recommended buy/entry price based on live support/Fibonacci.',
              },
              recommendedBuy1Note: {
                type: Type.STRING,
                description: 'Plain-English reason why Buy Point 1 is the primary entry zone.',
              },
              recommendedBuy2: {
                type: Type.NUMBER,
                description: 'Secondary deep-discount limit buy price if a deeper wick occurs.',
              },
              recommendedBuy2Note: {
                type: Type.STRING,
                description: 'Plain-English reason for Deep Value Buy Point 2.',
              },
              recommendedStopLoss: {
                type: Type.NUMBER,
                description: 'Recommended safety stop-loss price below structural support.',
              },
              stopLossNote: {
                type: Type.STRING,
                description: 'Why this price invalidates the setup and protects the wallet.',
              },
              recommendedSell1: {
                type: Type.NUMBER,
                description: 'First recommended sell/take-profit price (TP1 conservative target).',
              },
              recommendedSell2: {
                type: Type.NUMBER,
                description: 'Second recommended sell/take-profit price (TP2 core 1:2 R:R target).',
              },
              recommendedSell3: {
                type: Type.NUMBER,
                description: 'Third recommended sell/take-profit price (TP3 upper breakout target).',
              },
              sellStrategyNote: {
                type: Type.STRING,
                description: 'How to scale out across Sell Points 1, 2, and 3 in plain English.',
              },
              liveMarketWhy: {
                type: Type.STRING,
                description:
                  '2-3 sentences in plain English explaining what the live candles, RSI, and moving averages are doing right now.',
              },
              riskDisclaimer: {
                type: Type.STRING,
                description:
                  'Explicit Use-at-Your-Own-Risk reminder tailored to this trade setup.',
              },
            },
          },
        },
      });

      res.json(parseGeminiJson(response.text));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error running AI Buy & Sell Helper.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ten-set-ai-explainer', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured. Please check Settings > Secrets in AI Studio.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const {
        symbol,
        executionMode,
        startingBalance,
        endingBalance,
        winCount,
        lossCount,
        netPnlUsd,
        setsSummary,
      } = req.body ?? {};

      const prompt = `An advanced student just ran a fast-forward 10-Set Automated Buy & Sell Rehearsal on ${symbol} (Mode: ${executionMode}).
Starting Rehearsal Balance (sized from their wallet): $${startingBalance} -> Projected Ending Rehearsal Balance after 10 Sets: $${endingBalance} (Projected Net PnL: $${netPnlUsd}, Wins: ${winCount}, Controlled 1R Stops: ${lossCount}).

IMPORTANT NON-CUSTODIAL TRUTH TO CLARIFY FOR THE STUDENT:
Because Symphony Markets Academy is 100% non-custodial (read-only public address, zero private keys held), this fast-forward 10-set run is a SIMULATED MATHEMATICAL REHEARSAL sized from their real wallet—it did NOT move coins on the blockchain or change their actual on-chain Trust Wallet / Xaman balance yet. Explain clearly that to grow their actual on-chain wallet balance, they place & sign real Limit Buy / Sell offers inside Xaman DEX or Trust Wallet and wait for live market prices to reach those marks over real time.

Here are the 10 Buy & Sell Sets rehearsed:
${setsSummary}

Write a crystal-clear, encouraging Masterclass Explanation with concise, well-balanced paragraphs (3-5 sentences per field) teaching the student:
1. headline: 1-sentence headline summarizing the 10-Set rehearsal result and reminding them this is a read-only projection sized from their wallet.
2. whatTheEngineDid: How the automation selected the 10 buy and sell marks (Fibonacci pullbacks, EMA staircase, RSI springs) and why fast-forwarding 10 sets rehearses real execution before risking coins on-chain.
3. whyTenSetsMatter: Why executing in 10-trade batches (Law of Large Numbers with 1:2+ Risk-to-Reward) removes micromanagement emotion—and why real on-chain DEX orders only change their wallet balance after they sign inside Xaman/Trust Wallet and live market price touches each mark.
4. stopLossLesson: Why Sets #3 and #7 hitting their controlled -1R (2%) Safety Stop-Loss marks were actually a huge victory for capital protection so the 8 winning sets could compound.
5. advancedStudentTakeaways: Exactly 3 concise, practical takeaways for moving from this 10-set rehearsal to real self-custody DEX orders.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a transparent, plain-English trading mentor at Symphony Markets Academy. Always populate EVERY JSON field (headline, whatTheEngineDid, whyTenSetsMatter, stopLossLesson, advancedStudentTakeaways) with concise 3-5 sentence paragraphs. Never claim a simulated rehearsal already changed the user’s real on-chain wallet balance; clearly distinguish read-only wallet sizing (rehearsal projection) from real signed on-chain DEX trades in Xaman or Trust Wallet.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            required: [
              'headline',
              'whatTheEngineDid',
              'whyTenSetsMatter',
              'stopLossLesson',
              'advancedStudentTakeaways',
            ],
            properties: {
              headline: {
                type: Type.STRING,
                description:
                  '1-sentence headline summarizing the 10-Set rehearsal projection and core lesson.',
              },
              whatTheEngineDid: {
                type: Type.STRING,
                description:
                  'Concise 3-5 sentence explanation of how the automation selected the 10 buy and sell marks.',
              },
              whyTenSetsMatter: {
                type: Type.STRING,
                description:
                  'Concise 3-5 sentence explanation of 10-set batch math AND why real wallet balances only change when signed on-chain in Xaman/Trust Wallet DEX.',
              },
              stopLossLesson: {
                type: Type.STRING,
                description:
                  'Concise 3-5 sentence explanation of why the 2 controlled -1R stop-loss sets were a victory for protecting the wallet.',
              },
              advancedStudentTakeaways: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: '3 concise actionable lessons for the student from this 10-set run.',
              },
            },
          },
        },
      });

      res.json(parseGeminiJson(response.text));
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unexpected error generating 10-Set AI Masterclass explanation.';
      res.status(500).json({ error: message });
    }
  });

  const guideSignups: Array<{ email: string; requestedAt: string }> = [];

  app.post('/api/free-guide-signup', (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    guideSignups.push({ email, requestedAt: new Date().toISOString() });
    res.json({
      ok: true,
      email,
      message: 'Your 100% Free No-Scam Zone Manifesto PDF is unlocked and ready to download below.',
    });
  });

  // Live XRPL Mainnet DEX Orderbook & Account Proxy (for Embedded XRPL DEX Desk inside RiskSimulatorPanel)
  const XRPL_ENDPOINTS = ['https://xrplcluster.com/', 'https://s1.ripple.com:51234/'];
  const XRPL_RLUSD_HEX = '524C555344000000000000000000000000000000';
  const XRPL_RLUSD_ISSUER = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';

  async function callXrplRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    let lastError: Error | null = null;
    for (const endpoint of XRPL_ENDPOINTS) {
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method, params: [params] }),
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('XRPL RPC network error');
      }
    }
    throw lastError ?? new Error('Unable to reach XRPL Mainnet RPC nodes.');
  }

  app.get('/api/xrpl-orderbook', async (_req, res) => {
    try {
      // Asks: Makers selling XRP (TakerGets = XRP drops) for RLUSD (TakerPays = RLUSD)
      // Bids: Makers selling RLUSD (TakerGets = RLUSD) to buy XRP (TakerPays = XRP drops)
      const [asksRaw, bidsRaw] = (await Promise.all([
        callXrplRpc('book_offers', {
          taker_gets: { currency: 'XRP' },
          taker_pays: { currency: XRPL_RLUSD_HEX, issuer: XRPL_RLUSD_ISSUER },
          limit: 6,
        }),
        callXrplRpc('book_offers', {
          taker_gets: { currency: XRPL_RLUSD_HEX, issuer: XRPL_RLUSD_ISSUER },
          taker_pays: { currency: 'XRP' },
          limit: 6,
        }),
      ])) as Array<{
        result?: {
          ledger_current_index?: number;
          offers?: Array<{
            Account?: string;
            Sequence?: number;
            TakerGets?: string | { value?: string };
            TakerPays?: string | { value?: string };
            taker_gets_funded?: string | { value?: string };
            taker_pays_funded?: string | { value?: string };
          }>;
        };
      }>;

      const parseAsk = (o: {
        TakerGets?: string | { value?: string };
        TakerPays?: string | { value?: string };
      }) => {
        const xrpDrops = typeof o.TakerGets === 'string' ? Number(o.TakerGets) : 0;
        const rlusdVal =
          typeof o.TakerPays === 'object' && o.TakerPays ? Number(o.TakerPays.value || 0) : 0;
        const xrp = xrpDrops / 1_000_000;
        if (xrp <= 0 || rlusdVal <= 0) return null;
        return {
          priceUsd: Number((rlusdVal / xrp).toFixed(4)),
          xrpSize: Number(xrp.toFixed(2)),
          rlusdTotal: Number(rlusdVal.toFixed(2)),
        };
      };

      const parseBid = (o: {
        TakerGets?: string | { value?: string };
        TakerPays?: string | { value?: string };
      }) => {
        const rlusdVal =
          typeof o.TakerGets === 'object' && o.TakerGets ? Number(o.TakerGets.value || 0) : 0;
        const xrpDrops = typeof o.TakerPays === 'string' ? Number(o.TakerPays) : 0;
        const xrp = xrpDrops / 1_000_000;
        if (xrp <= 0 || rlusdVal <= 0) return null;
        return {
          priceUsd: Number((rlusdVal / xrp).toFixed(4)),
          xrpSize: Number(xrp.toFixed(2)),
          rlusdTotal: Number(rlusdVal.toFixed(2)),
        };
      };

      const asks = (asksRaw?.result?.offers ?? [])
        .map(parseAsk)
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .filter((x) => x.priceUsd > 0.05 && x.priceUsd < 50)
        .sort((a, b) => a.priceUsd - b.priceUsd)
        .slice(0, 4);

      const bids = (bidsRaw?.result?.offers ?? [])
        .map(parseBid)
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .filter((x) => x.priceUsd > 0.05 && x.priceUsd < 50)
        .sort((a, b) => b.priceUsd - a.priceUsd)
        .slice(0, 4);

      res.json({
        pair: 'XRP/RLUSD',
        issuer: XRPL_RLUSD_ISSUER,
        ledgerIndex: asksRaw?.result?.ledger_current_index ?? bidsRaw?.result?.ledger_current_index ?? null,
        bestBid: bids[0]?.priceUsd ?? null,
        bestAsk: asks[0]?.priceUsd ?? null,
        asks,
        bids,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'XRPL orderbook fetch failed.';
      res.status(502).json({ error: message });
    }
  });

  app.post('/api/xrpl-account', async (req, res) => {
    const account = String(req.body?.account ?? '').trim();
    if (!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(account)) {
      res.status(400).json({ error: 'Enter a valid XRPL r... public address.' });
      return;
    }

    try {
      const [acctJson, linesJson, offersJson] = (await Promise.all([
        callXrplRpc('account_info', { account, strict: true, ledger_index: 'current' }),
        callXrplRpc('account_lines', { account, ledger_index: 'current' }),
        callXrplRpc('account_offers', { account, ledger_index: 'current' }),
      ])) as Array<{
        result?: {
          error?: string;
          account_data?: { Balance?: string; OwnerCount?: number };
          lines?: Array<{ currency?: string; account?: string; balance?: string }>;
          offers?: Array<{
            seq?: number;
            taker_gets?: string | { currency?: string; value?: string };
            taker_pays?: string | { currency?: string; value?: string };
          }>;
        };
      }>;

      if (acctJson?.result?.error === 'actNotFound') {
        res.json({
          activated: false,
          account,
          totalXrp: 0,
          reservedXrp: 1,
          spendableXrp: 0,
          hasRlusdTrustline: false,
          rlusdBalance: 0,
          openOffers: [],
        });
        return;
      }

      const drops = Number(acctJson?.result?.account_data?.Balance ?? 0);
      const ownerCount = Number(acctJson?.result?.account_data?.OwnerCount ?? 0);
      const totalXrp = Number((drops / 1_000_000).toFixed(4));
      const reservedXrp = Number(Math.min(totalXrp, 1 + ownerCount * 0.2).toFixed(4));
      const spendableXrp = Number(Math.max(0, totalXrp - reservedXrp).toFixed(4));

      let hasRlusdTrustline = false;
      let rlusdBalance = 0;
      for (const ln of linesJson?.result?.lines ?? []) {
        const cur = String(ln.currency || '');
        const bal = Number(ln.balance || 0);
        if (cur === XRPL_RLUSD_HEX) {
          hasRlusdTrustline = true;
          rlusdBalance += Math.max(0, bal);
        } else if (cur === 'USD' || cur === 'USDC') {
          rlusdBalance += Math.max(0, bal);
        }
      }

      const openOffers: Array<{
        seq: number;
        side: 'BUY_XRP' | 'SELL_XRP';
        xrpAmount: number;
        usdAmount: number;
        limitPriceUsd: number;
      }> = [];

      for (const off of offersJson?.result?.offers ?? []) {
        const seq = Number(off.seq || 0);
        if (typeof off.taker_gets === 'string' && typeof off.taker_pays === 'object' && off.taker_pays) {
          const xrpAmt = Number(off.taker_gets) / 1_000_000;
          const usdAmt = Number(off.taker_pays.value || 0);
          if (xrpAmt > 0 && usdAmt > 0) {
            openOffers.push({
              seq,
              side: 'SELL_XRP',
              xrpAmount: Number(xrpAmt.toFixed(4)),
              usdAmount: Number(usdAmt.toFixed(4)),
              limitPriceUsd: Number((usdAmt / xrpAmt).toFixed(4)),
            });
          }
        } else if (
          typeof off.taker_gets === 'object' &&
          off.taker_gets &&
          typeof off.taker_pays === 'string'
        ) {
          const usdAmt = Number(off.taker_gets.value || 0);
          const xrpAmt = Number(off.taker_pays) / 1_000_000;
          if (xrpAmt > 0 && usdAmt > 0) {
            openOffers.push({
              seq,
              side: 'BUY_XRP',
              xrpAmount: Number(xrpAmt.toFixed(4)),
              usdAmount: Number(usdAmt.toFixed(4)),
              limitPriceUsd: Number((usdAmt / xrpAmt).toFixed(4)),
            });
          }
        }
      }

      res.json({
        activated: true,
        account,
        totalXrp,
        reservedXrp,
        spendableXrp,
        hasRlusdTrustline,
        rlusdBalance: Number(rlusdBalance.toFixed(4)),
        openOffers,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'XRPL account lookup failed.';
      res.status(502).json({ error: message });
    }
  });

  // =========================================================================
  // Xaman (Xumm) Android QR Direct Connect & 1-Swipe Signing Proxy Routes
  // Keeps XAMAN_API_KEY & XAMAN_API_SECRET strictly server-side (zero client exposure)
  // =========================================================================
  const XAMAN_PLATFORM_BASE = 'https://xumm.app/api/v1/platform';

  function getXamanCredentials(): { apiKey: string; apiSecret: string } | null {
    const apiKey = String(process.env.XAMAN_API_KEY ?? '').trim();
    const apiSecret = String(process.env.XAMAN_API_SECRET ?? '').trim();
    if (!apiKey || !apiSecret) return null;
    return { apiKey, apiSecret };
  }

  app.get('/api/xaman/status', (_req, res) => {
    const creds = getXamanCredentials();
    res.json({
      configured: Boolean(creds),
      mode: creds ? 'live_xaman_api' : 'direct_qr_handoff',
    });
  });

  app.post('/api/xaman/payload', async (req, res) => {
    const creds = getXamanCredentials();
    if (!creds) {
      res.status(503).json({
        configured: false,
        error:
          'Xaman API credentials are not configured yet. Add XAMAN_API_KEY and XAMAN_API_SECRET in AI Studio Secrets for 1-swipe pre-filled signing, or use the built-in Direct Xaman QR Handoff below.',
      });
      return;
    }

    try {
      const kind = String(req.body?.kind ?? 'signin').toLowerCase();
      const userToken = typeof req.body?.userToken === 'string' ? req.body.userToken.trim() : '';
      let txjson: Record<string, unknown>;

      if (kind === 'signin') {
        txjson = { TransactionType: 'SignIn' };
      } else if (kind === 'trustset') {
        txjson = {
          TransactionType: 'TrustSet',
          LimitAmount: {
            currency: XRPL_RLUSD_HEX,
            issuer: XRPL_RLUSD_ISSUER,
            value: '100000',
          },
        };
      } else if (kind === 'offercreate') {
        const rawTx = req.body?.txjson;
        if (
          !rawTx ||
          typeof rawTx !== 'object' ||
          rawTx.TransactionType !== 'OfferCreate' ||
          !rawTx.TakerGets ||
          !rawTx.TakerPays
        ) {
          res.status(400).json({ error: 'Invalid XRPL OfferCreate payload.' });
          return;
        }
        txjson = {
          TransactionType: 'OfferCreate',
          TakerGets: rawTx.TakerGets,
          TakerPays: rawTx.TakerPays,
        };
      } else if (kind === 'offercancel') {
        const offerSeq = Number(req.body?.offerSequence ?? 0);
        if (!Number.isInteger(offerSeq) || offerSeq <= 0) {
          res.status(400).json({ error: 'Invalid OfferSequence for OfferCancel.' });
          return;
        }
        txjson = {
          TransactionType: 'OfferCancel',
          OfferSequence: offerSeq,
        };
      } else {
        res.status(400).json({ error: 'Unsupported Xaman payload kind.' });
        return;
      }

      const payloadBody: Record<string, unknown> = {
        txjson,
        options: {
          submit: kind !== 'signin',
          expire: 5,
        },
        custom_meta: {
          instruction:
            typeof req.body?.instruction === 'string' && req.body.instruction.trim()
              ? req.body.instruction.trim().slice(0, 180)
              : kind === 'signin'
              ? 'Connect your Android Xaman wallet to Symphony Markets Academy Trade Desk.'
              : 'Review your Symphony Markets 1x Spot XRPL DEX request and slide to sign.',
        },
      };

      if (userToken) {
        payloadBody.user_token = userToken;
      }

      const upstream = await fetch(`${XAMAN_PLATFORM_BASE}/payload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': creds.apiKey,
          'X-API-Secret': creds.apiSecret,
        },
        body: JSON.stringify(payloadBody),
      });

      const data = (await upstream.json()) as {
        uuid?: string;
        next?: { always?: string };
        refs?: { qr_png?: string; websocket_status?: string };
        pushed?: boolean;
        error?: { reference?: string; code?: number };
        message?: string;
      };

      if (!upstream.ok || !data?.uuid) {
        res.status(upstream.status || 502).json({
          error: data?.message || 'Unable to create Xaman QR signing request.',
        });
        return;
      }

      res.json({
        configured: true,
        uuid: data.uuid,
        qrPng: data.refs?.qr_png ?? '',
        nextAlways: data.next?.always ?? `https://xumm.app/sign/${data.uuid}`,
        pushed: Boolean(data.pushed),
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Network error connecting to Xaman API.';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/xaman/payload/:uuid', async (req, res) => {
    const creds = getXamanCredentials();
    if (!creds) {
      res.status(503).json({ configured: false, error: 'Xaman API not configured.' });
      return;
    }

    const uuid = String(req.params.uuid ?? '').trim();
    if (!/^[0-9a-fA-F-]{16,64}$/.test(uuid)) {
      res.status(400).json({ error: 'Invalid Xaman payload UUID.' });
      return;
    }

    try {
      const upstream = await fetch(`${XAMAN_PLATFORM_BASE}/payload/${encodeURIComponent(uuid)}`, {
        method: 'GET',
        headers: {
          'X-API-Key': creds.apiKey,
          'X-API-Secret': creds.apiSecret,
        },
      });

      const data = (await upstream.json()) as {
        meta?: {
          resolved?: boolean;
          signed?: boolean;
          cancelled?: boolean;
          expired?: boolean;
          app_opened?: boolean;
        };
        response?: {
          account?: string | null;
          txid?: string | null;
          dispatched_result?: string | null;
        };
        application?: {
          issued_user_token?: string | null;
        };
      };

      if (!upstream.ok) {
        res.status(upstream.status).json({ error: 'Unable to check Xaman payload status.' });
        return;
      }

      res.json({
        uuid,
        resolved: Boolean(data?.meta?.resolved),
        signed: Boolean(data?.meta?.signed),
        cancelled: Boolean(data?.meta?.cancelled),
        expired: Boolean(data?.meta?.expired),
        opened: Boolean(data?.meta?.app_opened),
        account: data?.response?.account ?? null,
        txid: data?.response?.txid ?? null,
        dispatchedResult: data?.response?.dispatched_result ?? null,
        userToken: data?.application?.issued_user_token ?? null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to poll Xaman status.';
      res.status(502).json({ error: message });
    }
  });

  // =========================================================================
  // Free Android Lock-Screen Market Alert Relay (ntfy.sh — Zero API Key / Zero KYC)
  // =========================================================================
  app.post('/api/notify-ntfy', async (req, res) => {
    try {
      const topic = String(req.body?.topic ?? '').trim();
      const title = String(req.body?.title ?? 'Symphony Markets Alert').trim().slice(0, 120);
      const message = String(req.body?.message ?? '').trim().slice(0, 500);
      const priority = String(req.body?.priority ?? 'default').trim();

      if (!/^[a-zA-Z0-9_-]{6,64}$/.test(topic)) {
        res.status(400).json({
          error:
            'Enter a private topic name (6–64 letters, numbers, hyphens, or underscores — no spaces).',
        });
        return;
      }

      if (!message) {
        res.status(400).json({ error: 'Alert message cannot be empty.' });
        return;
      }

      const upstream = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers: {
          Title: title,
          Priority: ['min', 'low', 'default', 'high', 'urgent'].includes(priority)
            ? priority
            : 'default',
          Tags: 'chart_with_upwards_trend',
        },
        body: message,
      });

      if (!upstream.ok) {
        res.status(upstream.status).json({ error: 'Could not deliver notification to ntfy.sh.' });
        return;
      }

      res.json({ ok: true, topic, deliveredAt: new Date().toISOString() });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Notification relay failed.';
      res.status(502).json({ error: msg });
    }
  });

  // Default Google Drive Asset IDs from the shared Symphony Markets Academy folder & Video Media subfolder
  // Folder: https://drive.google.com/drive/folders/1hPDCoTd5K4163HsDW7_LtQXXB8VvBkv3
  // Video Media Subfolder: https://drive.google.com/drive/folders/1UbpPHFwQ9WSu7X1-O8qmNk7UCyroS5og
  const DEFAULT_DRIVE_VIDEO_ID = '1FTGu-yv8TPVv2YT9gsLUceCak3bAEvcw'; // Symphony_Markets__The_No-Scam_Sandbox.mp4
  const ANTIDOTE_DRIVE_VIDEO_ID = '1vgJ0QiwY1aVtJwr-iPtKLdxTdcVqTTnr'; // Symphony_Markets__The_Antidote_to_Predation.mp4
  const BLUEPRINT_DRIVE_VIDEO_ID = '1RNomMOr0irdvq0nsbm8nQh2fhooCPoBp'; // Symphony_Markets__The__5_Blueprint.mp4
  const RHYTHM_OF_CROWD_DRIVE_VIDEO_ID = '1kCLZNmmcUAXP5XuRcAWfWnkWBXTs3YD5'; // The_Rhythm_of_the_Crowd.mp4 (Fibonacci Part 1)
  const SURVIVAL_FINANCE_DRIVE_VIDEO_ID = '1pCtFdKXo6Fhd88QnSCoH95qlRTXAf5Dj'; // Survival_Finance_Traditional_Markets.mp4 (5:07)
  const ORGANIC_RHYTHM_DRIVE_VIDEO_ID = '1s-wUCvu1e3p3Rp93k1mzgi1TYHBuHw3i'; // The_Organic_Rhythm_of_Trading.mp4 (7:03)
  const ANTIDOTE_LOOSE_CYCLES_DRIVE_VIDEO_ID = '1RCuSGFs76KSTkdQBPDXrSN5ND8y_ZBBi'; // The_Antidote_to_Loose_Cycles.mp4 (6:14)
  // Newly added 10-second Promo Series streamed via /api/drive-video/:fileId:
  // - 1vvE86gSwiJeR7LxLPZcGfxbxw5EbPWM7 (Promo 1: KSBC Gold RWA & Open Math Proof)
  // - 1IANyjDSGVeC_7ksdot8cmAuNcZrSO8nO (Promo 2: 11-Module Day-Trader-Skill Sandbox)
  // - 1R_Cy_uBTBjVgLjCqseoAjPxm0oqh5e9g (Promo 3: Symphony Harp Candlesticks & 10-Cent Cap)
  // - 1eDtMP2vrBOl1AVqQ9ECVOUI0ByJ_JPtl (Promo 4: Transparent Crystalline AMM x * y = k)
  const DEFAULT_DRIVE_PDF_ID = '1mMH2ngPd4gWPjFYEOAHtpv9XZm-v9McN'; // no-scam-zone-manifesto.pdf
  const MAX_VIDEO_CHUNK_BYTES = 2 * 1024 * 1024; // 2 MB chunks keep every HTTP response well under Cloud Run's 32 MB limit

  const DRIVE_DOCS_MAP: Record<
    string,
    { localFile: string; driveId: string; downloadName: string; mimeType: string }
  > = {
    manifesto: {
      localFile: 'no-scam-zone-manifesto.pdf',
      driveId: '1mMH2ngPd4gWPjFYEOAHtpv9XZm-v9McN',
      downloadName: 'no-scam-zone-manifesto.pdf',
      mimeType: 'application/pdf',
    },
    certificate: {
      localFile: 'no-scam-zone-certificate.pdf',
      driveId: '1gijppbcHpuRfAcLSzOsYXJiD3SzIxf-e',
      downloadName: 'no-scam-zone-certificate.pdf',
      mimeType: 'application/pdf',
    },
    companion: {
      localFile: 'quantum-analemma-companion.pdf',
      driveId: '1L6Fq0y4Jwm7_j03Qb6Pbh83kZONAaXzy',
      downloadName: 'quantum-analemma-companion.pdf',
      mimeType: 'application/pdf',
    },
    book_pdf: {
      localFile: 'quantum-analemma-cycle.pdf',
      driveId: '1VOPZ7qvbJN9AbkxRaBG8kIl-fAMgdWer',
      downloadName: 'quantum-analemma-a-i-technology-cycle.pdf',
      mimeType: 'application/pdf',
    },
    book_epub: {
      localFile: 'quantum-analemma-cycle.epub',
      driveId: '1Us_E4FMnxOgcRZ-S056JR-Enq4s_v-u0',
      downloadName: 'quantum-analemma-a-i-technology-cycle.epub',
      mimeType: 'application/epub+zip',
    },
  };

  app.get('/api/drive-video/:fileId', async (req, res) => {
    const rawId = String(req.params.fileId || DEFAULT_DRIVE_VIDEO_ID).trim();
    if (!/^[a-zA-Z0-9_-]{10,80}$/.test(rawId)) {
      res.status(400).json({ error: 'Invalid Google Drive video ID.' });
      return;
    }

    // Fast-path: if requesting one of our known Google Drive videos and local web-optimized asset exists, stream from disk
    const fs = await import('fs');
    const localVideoCandidate =
      rawId === DEFAULT_DRIVE_VIDEO_ID
        ? path.join(__dirname, 'public', 'assets', 'symphony-welcome.mp4')
        : rawId === ANTIDOTE_DRIVE_VIDEO_ID
        ? path.join(__dirname, 'public', 'assets', 'symphony-antidote.mp4')
        : rawId === BLUEPRINT_DRIVE_VIDEO_ID
        ? path.join(
            __dirname,
            'public',
            'assets',
            'aistudio',
            'Symphony_Markets__The__5_Blueprint_781e68ab.mp4'
          )
        : rawId === RHYTHM_OF_CROWD_DRIVE_VIDEO_ID
        ? path.join(__dirname, 'public', 'assets', 'The_Rhythm_of_the_Crowd.mp4')
        : rawId === SURVIVAL_FINANCE_DRIVE_VIDEO_ID
        ? path.join(__dirname, 'public', 'assets', 'Survival_Finance_Traditional_Markets.mp4')
        : rawId === ORGANIC_RHYTHM_DRIVE_VIDEO_ID
        ? path.join(__dirname, 'public', 'assets', 'The_Organic_Rhythm_of_Trading.mp4')
        : rawId === ANTIDOTE_LOOSE_CYCLES_DRIVE_VIDEO_ID
        ? path.join(__dirname, 'public', 'assets', 'The_Antidote_to_Loose_Cycles.mp4')
        : null;

    if (localVideoCandidate && fs.existsSync(localVideoCandidate)) {
      const stat = fs.statSync(localVideoCandidate);
      const totalSize = stat.size;
      const rangeHeader = req.headers.range;

      if (rangeHeader) {
        const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
        const start = match ? parseInt(match[1], 10) : 0;
        const requestedEnd =
          match && match[2] ? parseInt(match[2], 10) : start + MAX_VIDEO_CHUNK_BYTES - 1;
        const end = Math.min(requestedEnd, start + MAX_VIDEO_CHUNK_BYTES - 1, totalSize - 1);

        if (start >= totalSize || start > end) {
          res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
          return;
        }

        const chunkLength = end - start + 1;
        res.status(206);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Content-Length', String(chunkLength));
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const fileStream = fs.createReadStream(localVideoCandidate, { start, end });
        fileStream.on('error', () => {
          if (!res.writableEnded) res.end();
        });
        fileStream.pipe(res);
        return;
      }

      // Non-range fallback: clamp to 2 MB chunk if > 20 MB
      const end = Math.min(MAX_VIDEO_CHUNK_BYTES - 1, totalSize - 1);
      res.status(206);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes 0-${end}/${totalSize}`);
      res.setHeader('Content-Length', String(end + 1));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      fs.createReadStream(localVideoCandidate, { start: 0, end }).pipe(res);
      return;
    }

    await streamGoogleDriveVideoChunk(rawId, req, res);
  });

  app.get('/api/drive-pdf', async (req, res) => {
    const isDownload = req.query.download === '1';
    const docKey = String(req.query.doc || 'manifesto').trim();
    const docMeta = DRIVE_DOCS_MAP[docKey] ?? DRIVE_DOCS_MAP.manifesto;

    try {
      const fs = await import('fs');
      const localDocPath = path.join(__dirname, 'public', 'assets', docMeta.localFile);
      let fileBuffer: Buffer | null = null;

      if (fs.existsSync(localDocPath)) {
        fileBuffer = fs.readFileSync(localDocPath);
      } else {
        const driveUrl = `https://drive.google.com/uc?export=download&id=${docMeta.driveId || DEFAULT_DRIVE_PDF_ID}`;
        const upstream = await fetch(driveUrl, { redirect: 'follow' });
        if (!upstream.ok) {
          throw new Error(`Google Drive returned status ${upstream.status}`);
        }
        const arrayBuf = await upstream.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
      }

      res.setHeader('Content-Type', docMeta.mimeType);
      res.setHeader('Content-Length', String(fileBuffer.length));
      res.setHeader(
        'Content-Disposition',
        `${isDownload ? 'attachment' : 'inline'}; filename="${docMeta.downloadName}"`
      );
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(fileBuffer);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to retrieve document from Google Drive.';
      res.status(502).json({ error: message });
    }
  });

  const ASSET_VIDEO_FILENAME_TO_DRIVE_ID: Record<string, string> = {
    'The_Organic_Rhythm_of_Trading.mp4': ORGANIC_RHYTHM_DRIVE_VIDEO_ID,
    'The_Antidote_to_Loose_Cycles.mp4': ANTIDOTE_LOOSE_CYCLES_DRIVE_VIDEO_ID,
    'Survival_Finance_Traditional_Markets.mp4': SURVIVAL_FINANCE_DRIVE_VIDEO_ID,
    'The_Rhythm_of_the_Crowd.mp4': RHYTHM_OF_CROWD_DRIVE_VIDEO_ID,
    'symphony-welcome.mp4': DEFAULT_DRIVE_VIDEO_ID,
    'symphony-antidote.mp4': ANTIDOTE_DRIVE_VIDEO_ID,
    'Symphony_Markets__The__5_Blueprint_781e68ab.mp4': BLUEPRINT_DRIVE_VIDEO_ID,
  };

  async function streamGoogleDriveVideoChunk(
    rawId: string,
    req: express.Request,
    res: express.Response
  ) {
    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) {
        abortController.abort();
      }
    });

    try {
      const driveUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
        rawId
      )}&export=download&confirm=t`;
      const rangeHeader = req.headers.range;
      let start = 0;
      let end = MAX_VIDEO_CHUNK_BYTES - 1;

      if (rangeHeader) {
        const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
        if (match) {
          start = parseInt(match[1], 10);
          const requestedEnd = match[2]
            ? parseInt(match[2], 10)
            : start + MAX_VIDEO_CHUNK_BYTES - 1;
          end = Math.min(requestedEnd, start + MAX_VIDEO_CHUNK_BYTES - 1);
        }
      }

      const upstream = await fetch(driveUrl, {
        headers: {
          Range: `bytes=${start}-${end}`,
        },
        redirect: 'follow',
        signal: abortController.signal,
      });

      if (!upstream.ok && upstream.status !== 206) {
        res.status(upstream.status).json({ error: 'Unable to stream video from Google Drive.' });
        return;
      }

      res.status(206);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      const contentLength = upstream.headers.get('content-length');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) {
        res.setHeader('Content-Range', contentRange);
      }
      res.setHeader('Cache-Control', 'public, max-age=3600');

      if (req.method === 'HEAD' || !upstream.body) {
        res.end();
        return;
      }

      const nodeStream = Readable.fromWeb(upstream.body as unknown as WebReadableStream);
      nodeStream.on('error', () => {
        if (!res.writableEnded) res.end();
      });
      nodeStream.pipe(res);
    } catch (err: unknown) {
      if (abortController.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Video stream error';
      if (!res.headersSent) {
        res.status(502).json({ error: message });
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  }

  // Serve local /assets/*.mp4 and /assets/*.m4a media in 2 MB Range chunks (or stream Drive-backed HD MP4s without storing >40MB binaries in GitHub)
  app.get(/^\/assets\/.+\.(mp4|m4a|mp3|ogg|webm)$/i, async (req, res, next) => {
    try {
      const fs = await import('fs');
      const publicRoot = path.resolve(__dirname, 'public');
      const distRoot = path.resolve(__dirname, 'dist');
      const decodedPath = decodeURIComponent(req.path).replace(/^\/+/, '');
      let candidatePath = path.resolve(publicRoot, decodedPath);
      if (!candidatePath.startsWith(publicRoot + path.sep) || !fs.existsSync(candidatePath)) {
        const distCandidate = path.resolve(distRoot, decodedPath);
        if (distCandidate.startsWith(distRoot + path.sep) && fs.existsSync(distCandidate)) {
          candidatePath = distCandidate;
        } else {
          const baseFile = path.basename(decodedPath);
          const mappedDriveId = ASSET_VIDEO_FILENAME_TO_DRIVE_ID[baseFile];
          if (mappedDriveId) {
            await streamGoogleDriveVideoChunk(mappedDriveId, req, res);
            return;
          }
          next();
          return;
        }
      }

      const stat = fs.statSync(candidatePath);
      if (!stat.isFile()) {
        next();
        return;
      }

      const ext = path.extname(candidatePath).toLowerCase();
      const mediaMimeType =
        ext === '.m4a'
          ? 'audio/mp4'
          : ext === '.mp3'
          ? 'audio/mpeg'
          : ext === '.ogg'
          ? 'audio/ogg'
          : ext === '.webm'
          ? 'video/webm'
          : 'video/mp4';

      const totalSize = stat.size;
      const rangeHeader = req.headers.range;

      if (rangeHeader) {
        const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
        const start = match ? parseInt(match[1], 10) : 0;
        const requestedEnd =
          match && match[2] ? parseInt(match[2], 10) : start + MAX_VIDEO_CHUNK_BYTES - 1;
        const end = Math.min(requestedEnd, start + MAX_VIDEO_CHUNK_BYTES - 1, totalSize - 1);

        if (start >= totalSize || start > end) {
          res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
          return;
        }

        const chunkLength = end - start + 1;
        res.status(206);
        res.setHeader('Content-Type', mediaMimeType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Content-Length', String(chunkLength));
        res.setHeader('Cache-Control', 'public, max-age=3600');

        if (req.method === 'HEAD') {
          res.end();
          return;
        }

        const stream = fs.createReadStream(candidatePath, { start, end });
        stream.on('error', () => {
          if (!res.writableEnded) res.end();
        });
        stream.pipe(res);
        return;
      }

      if (req.method === 'HEAD') {
        res.status(200);
        res.setHeader('Content-Type', mediaMimeType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', String(totalSize));
        res.end();
        return;
      }

      // If a client requests a large MP4/M4A without Range, return the first 2 MB chunk as 206 so Cloud Run never drops >32MB payloads
      if (totalSize > 20 * 1024 * 1024) {
        const end = Math.min(MAX_VIDEO_CHUNK_BYTES - 1, totalSize - 1);
        res.status(206);
        res.setHeader('Content-Type', mediaMimeType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Range', `bytes 0-${end}/${totalSize}`);
        res.setHeader('Content-Length', String(end + 1));
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const stream = fs.createReadStream(candidatePath, { start: 0, end });
        stream.on('error', () => {
          if (!res.writableEnded) res.end();
        });
        stream.pipe(res);
        return;
      }

      next();
    } catch {
      next();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    let viteMiddleware: express.RequestHandler | null = null;
    const viteReady = (async () => {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false, watch: null },
        appType: 'spa',
      });
      viteMiddleware = vite.middlewares;
    })();

    app.use(async (req, res, next) => {
      if (!viteMiddleware) {
        await viteReady;
      }
      if (viteMiddleware) {
        viteMiddleware(req, res, next);
      } else {
        next();
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Symphony Markets Academy server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
