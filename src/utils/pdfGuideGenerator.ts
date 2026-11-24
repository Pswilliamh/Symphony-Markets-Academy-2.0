function escapePdfText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function createNoScamZonePdfBlob(recipientEmail?: string): Blob {
  const blocks: Array<{ font: 'F1' | 'F2'; size: number; leading: number; text: string }> = [
    { font: 'F2', size: 18, leading: 26, text: 'SYMPHONY MARKETS ACADEMY - THE NO-SCAM ZONE GUIDE' },
    {
      font: 'F1',
      size: 10,
      leading: 16,
      text: `100% Free Community Market Education Guide${
        recipientEmail ? ` | Prepared for: ${recipientEmail}` : ''
      }`,
    },
    { font: 'F1', size: 10, leading: 18, text: '--------------------------------------------------------------------------------' },
    { font: 'F2', size: 12, leading: 20, text: 'Why This Guide Exists' },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: 'Years ago, our founder tried an online trading site that displayed a fake "Stop-Trading" safety button while stealing user deposits. Symphony Markets Academy was created as an open-source No-Scam Zone so beginners can learn market mechanics safely without hype or deception.',
    },
    { font: 'F2', size: 12, leading: 22, text: '1. The 5 Non-Negotiable Rules of the No-Scam Zone' },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Never type your 12-word or 24-word wallet recovery phrase into ANY website or chat.',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Never trust platforms or bots promising "guaranteed daily returns" or asking for prepaid gas cards.',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Keep your funds in your own self-custody wallet; use public addresses only for read-only tracking.',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Verify stop-loss math yourself before entering any trade; never rely on a black-box button.',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Stay in 1x Spot mode (zero borrowed leverage) while learning so you cannot be liquidated.',
    },
    { font: 'F2', size: 12, leading: 22, text: '2. How to Practice Safely With a Real $5 Wallet' },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Pick a Near-Zero Fee Network: Ethereum mainnet gas fees can cost $2-$5 per swap. Stellar (XLM) and XRP Ledger (XRP) cost ~$0.00005 per transaction so $5 stays intact.',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Understand Wallet Base Reserves: Stellar locks ~1 XLM (~$0.41) and XRPL locks 1 XRP to activate an address on-chain. Stellar leaves over $4.30+ of a $5 budget free to swap with USDC.',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '- Use the 10-Cent Safety Net (2% Risk Rule): On a $5 budget, risking 2% means choosing a Safety Exit price where your maximum loss is $0.10 (keeping $4.90 safe) while aiming for +$0.20 (1:2 R:R).',
    },
    { font: 'F2', size: 12, leading: 22, text: '3. Pre-Swap Wise Choice Checklist' },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '[ ] Did I check the chart to confirm I am NOT chasing a sudden ceiling spike?',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '[ ] Am I using 1x Spot ownership with sub-penny network fees?',
    },
    {
      font: 'F1',
      size: 10,
      leading: 14,
      text: '[ ] Did I write down my exact Safety Exit price and Profit Target before buying?',
    },
    {
      font: 'F1',
      size: 9,
      leading: 22,
      text: 'Educational use only. Not financial advice. Open-source community project by Symphony Markets Academy.',
    },
  ];

  let y = 750;
  const streamCommands: string[] = ['BT'];

  for (const block of blocks) {
    const wrapped = wrapLines(block.text, block.size >= 14 ? 58 : 84);
    for (let i = 0; i < wrapped.length; i++) {
      const stepDown = i === 0 ? block.leading : 14;
      y -= stepDown;
      if (y < 48) break;
      streamCommands.push(`/${block.font} ${block.size} Tf`);
      streamCommands.push(`1 0 0 1 48 ${y} Tm`);
      streamCommands.push(`(${escapePdfText(wrapped[i])}) Tj`);
    }
  }
  streamCommands.push('ET');

  const contentStream = streamCommands.join('\n');
  const encoder = new TextEncoder();
  const streamByteLength = encoder.encode(contentStream).length;

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamByteLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefStart = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

type ManualBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'divider' }
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'body'; text: string }
  | { kind: 'step'; text: string }
  | { kind: 'note'; text: string };

function buildMultiPagePdfBlob(pages: ManualBlock[][], docFooterLabel: string): Blob {
  const encoder = new TextEncoder();
  const totalPages = pages.length;

  const pageStreams: string[] = pages.map((blocks, pageIdx) => {
    const cmds: string[] = ['BT'];
    let y = 748;

    // Subtle top running header on pages 2+
    if (pageIdx > 0) {
      cmds.push('/F1 8 Tf');
      cmds.push(`1 0 0 1 48 766 Tm`);
      cmds.push(`(${escapePdfText(docFooterLabel)}) Tj`);
      cmds.push(`1 0 0 1 516 766 Tm`);
      cmds.push(`(${escapePdfText(`Page ${pageIdx + 1} of ${totalPages}`)}) Tj`);
    }

    for (const block of blocks) {
      if (block.kind === 'divider') {
        y -= 10;
        if (y < 58) break;
        cmds.push('/F1 9 Tf');
        cmds.push(`1 0 0 1 48 ${y} Tm`);
        cmds.push(
          '(-----------------------------------------------------------------------------------------) Tj'
        );
        y -= 4;
        continue;
      }

      const spec =
        block.kind === 'title'
          ? { font: 'F2', size: 16, firstGap: 20, lineGap: 19, maxChars: 58, x: 48 }
          : block.kind === 'subtitle'
          ? { font: 'F1', size: 10, firstGap: 15, lineGap: 13, maxChars: 86, x: 48 }
          : block.kind === 'h1'
          ? { font: 'F2', size: 12, firstGap: 20, lineGap: 15, maxChars: 74, x: 48 }
          : block.kind === 'h2'
          ? { font: 'F2', size: 10.5, firstGap: 15, lineGap: 13.5, maxChars: 82, x: 48 }
          : block.kind === 'step'
          ? { font: 'F1', size: 9.8, firstGap: 13.5, lineGap: 12.8, maxChars: 82, x: 56 }
          : block.kind === 'note'
          ? { font: 'F1', size: 9.2, firstGap: 13, lineGap: 12, maxChars: 86, x: 54 }
          : { font: 'F1', size: 9.8, firstGap: 13.5, lineGap: 12.8, maxChars: 86, x: 48 };

      const wrapped = wrapLines(block.text, spec.maxChars);
      for (let i = 0; i < wrapped.length; i++) {
        y -= i === 0 ? spec.firstGap : spec.lineGap;
        if (y < 56) break;
        cmds.push(`/${spec.font} ${spec.size} Tf`);
        cmds.push(`1 0 0 1 ${spec.x} ${y} Tm`);
        cmds.push(`(${escapePdfText(wrapped[i])}) Tj`);
      }
    }

    // Bottom page footer
    cmds.push('/F1 8.5 Tf');
    cmds.push('1 0 0 1 48 34 Tm');
    cmds.push(`(${escapePdfText(docFooterLabel)}) Tj`);
    cmds.push('1 0 0 1 516 34 Tm');
    cmds.push(`(${escapePdfText(`Page ${pageIdx + 1} of ${totalPages}`)}) Tj`);

    cmds.push('ET');
    return cmds.join('\n');
  });

  // Object layout:
  // 1: Catalog
  // 2: Pages
  // 3: Font F1 (Helvetica)
  // 4: Font F2 (Helvetica-Bold)
  // 5..(5 + 2*N - 1): Pairs of [Page obj, Content stream obj]
  const pageObjNums: number[] = [];
  const dynamicObjs: string[] = [];

  for (let i = 0; i < totalPages; i++) {
    const pageObjNum = 5 + i * 2;
    const contentObjNum = pageObjNum + 1;
    pageObjNums.push(pageObjNum);

    const stream = pageStreams[i];
    const byteLen = encoder.encode(stream).length;

    dynamicObjs.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`
    );
    dynamicObjs.push(
      `${contentObjNum} 0 obj\n<< /Length ${byteLen} >>\nstream\n${stream}\nendstream\nendobj\n`
    );
  }

  const kidsRef = pageObjNums.map((n) => `${n} 0 R`).join(' ');
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${totalPages} >>\nendobj\n`,
    '3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    ...dynamicObjs,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += obj;
  }

  const xrefStart = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Comprehensive 4-Page Functional Operations & Step-by-Step How-To Manual PDF
 * Covers every interactive tool in Symphony Markets Academy:
 * - 6 Standalone Modules & Access Tiers (plus Vercel Firebase Auth domain setup)
 * - Syncing Your Own Android Xaman Wallet (Tablet Camera QR + r... Address + RLUSD TrustLine)
 * - Live Support & Resistance Market Radar + Tablet Chime & Free Android ntfy Push Alerts
 * - Step-by-Step 24/7 Limit Buy/Sell Execution in Android Xaman DEX & Sologenic DEX
 */
export function createFunctionalOperationsManualPdfBlob(): Blob {
  const pages: ManualBlock[][] = [
    // =========================================================================
    // PAGE 1: CAMPUS ARCHITECTURE, 6 STANDALONE MODULES & ACCESS SETUP
    // =========================================================================
    [
      { kind: 'title', text: 'SYMPHONY MARKETS ACADEMY' },
      {
        kind: 'title',
        text: 'FUNCTIONAL OPERATIONS & STEP-BY-STEP HOW-TO MANUAL',
      },
      {
        kind: 'subtitle',
        text: 'Practical Guide to Every Interactive Module, Android Xaman Wallet Sync, Market Alerts & 24/7 XRPL Limit Orders',
      },
      { kind: 'divider' },

      { kind: 'h1', text: '1. Navigating the 6-Module Campus & Standalone App Links' },
      {
        kind: 'body',
        text: 'To keep your workspace calm and focused, Symphony Markets Academy is organized into 6 clean modules. Each module can be opened from the Campus Hub OR shared directly as its own standalone web app link:',
      },
      {
        kind: 'step',
        text: '- Module 01 (?module=foundations) [Open]: $5 Beginner Roadmap, Market Cycles, Candlestick Rhythm & Safety Rules.',
      },
      {
        kind: 'step',
        text: '- Module 02 (?module=fibonacci) [Intermediate]: Fibonacci Symphony Geometry, Markers Studio & Musical Composer.',
      },
      {
        kind: 'step',
        text: '- Module 03 (?module=trade-desk) [Advanced]: Live Chart, 1-by-1 Checklist, Support/Resistance Radar & XRPL DEX.',
      },
      {
        kind: 'step',
        text: '- Module 04 (?module=library) [Open]: Free Media, Videos, Podcast & Document Library (zero password needed).',
      },
      {
        kind: 'step',
        text: '- Module 05 (?module=ksbc) [Open]: KSBC 999.9 Gold RWA Transparency Blueprint & Open AMM Liquidity Math.',
      },
      {
        kind: 'step',
        text: '- Module 06 (?module=forex) [Open]: Forex Foundations, Currency Pairs, Pips, Sessions & Visual Chart Patterns.',
      },

      { kind: 'h1', text: '2. Unlocking Student Tiers & Instructor Admin Console' },
      {
        kind: 'step',
        text: 'Step 1: Modules 01, 04, 05, and 06 are always open to the public with zero password.',
      },
      {
        kind: 'step',
        text: 'Step 2: For Module 02 (Intermediate) or Module 03 (Advanced), enter the cohort passcode shared by your instructor. Entering the Advanced passcode automatically unlocks both Intermediate and Advanced for your browser session.',
      },
      {
        kind: 'step',
        text: 'Step 3: Instructors sign in via "Admin Google Sign-In" to unlock all tiers at once, rotate student cohort passcodes, assign a secondary Admin Gmail, or attach a new Orientation Video.',
      },

      { kind: 'h1', text: '3. Deploying to Vercel / Custom Domains (Firebase Auth Checklist)' },
      {
        kind: 'body',
        text: 'If you deploy this app to Vercel or a custom domain and see "Firebase: Error (auth/unauthorized-domain)" when clicking Sign In as Admin with Google, complete this one-time 30-second allowlist step:',
      },
      {
        kind: 'step',
        text: '1. Open Firebase Console -> Authentication -> Settings -> Authorized domains.',
      },
      {
        kind: 'step',
        text: '2. Click "Add domain" and paste your exact Vercel hostname (example: your-app-name.vercel.app) without https://.',
      },
      {
        kind: 'step',
        text: '3. Click Add, refresh your Vercel page, and Google Admin Sign-In will work immediately.',
      },
      {
        kind: 'note',
        text: 'Tip: Even before adding a domain, Student Cohort Passcodes work immediately on every host because they verify locally using SHA-256.',
      },
    ],

    // =========================================================================
    // PAGE 2: SYNCING YOUR ANDROID XAMAN WALLET (ZERO API KEY, ZERO KYC)
    // =========================================================================
    [
      { kind: 'h1', text: '4. Syncing Your Own Android Xaman Wallet (Tablet + Phone Workflow)' },
      {
        kind: 'body',
        text: 'Many students view charts on a tablet or laptop while keeping their signing wallet (Xaman) safely on their Android phone. Our system supports a 100% API-key-free, zero-KYC workflow where your private keys NEVER leave your Android phone.',
      },

      { kind: 'h2', text: 'Method A: Instant Sync With Your Tablet Camera (Recommended)' },
      {
        kind: 'step',
        text: '1. Open Module 03 (?module=trade-desk). At the very top of the page, find "Sync Your Own Xaman Wallet Address".',
      },
      {
        kind: 'step',
        text: '2. Tap the green "Scan Android Receive QR" button and allow tablet camera access.',
      },
      {
        kind: 'step',
        text: '3. On your Android phone, open Xaman Wallet and tap "Receive" to show your public r... QR code.',
      },
      {
        kind: 'step',
        text: '4. Hold your Android phone screen in front of your tablet camera. Within 1-2 seconds, the app detects your public r... address and automatically syncs your live spendable XRP and RLUSD balances from the XRP Ledger.',
      },

      { kind: 'h2', text: 'Method B: Paste Your Public r... Address Manually' },
      {
        kind: 'step',
        text: '1. In Android Xaman, tap Receive -> Copy your public address (starts with the letter "r", 25 to 35 characters).',
      },
      {
        kind: 'step',
        text: '2. Paste it into the top wallet box (or Step 1 inside the Embedded XRPL DEX) and tap "Sync My Xaman Wallet".',
      },
      {
        kind: 'step',
        text: '3. To switch wallets or clear your saved address at any time, tap the "Clear" button right beside your synced address.',
      },
      {
        kind: 'note',
        text: 'Security Reminder: Your public r... address is read-only, like a bank routing/account number for viewing balances. Never type your 12/24-word secret numbers into any website.',
      },

      { kind: 'h1', text: '5. One-Time Setup: Enabling the RLUSD TrustLine (Step 1B)' },
      {
        kind: 'body',
        text: 'Before your XRPL wallet can hold RLUSD stablecoin dollars when you sell XRP on the XRPL DEX, the XRP Ledger requires a one-time RLUSD TrustLine (this locks a refundable 0.2 XRP reserve on your own account):',
      },
      {
        kind: 'step',
        text: '1. After syncing your r... address, look at Step 1 in the Embedded XRPL DEX panel.',
      },
      {
        kind: 'step',
        text: '2. If your wallet does not yet have the RLUSD TrustLine, an amber prompt ("One-Time Step 1B Needed") appears automatically.',
      },
      {
        kind: 'step',
        text: '3. Tap "Scan QR in Android Xaman", open the blue center Scan button in your Android Xaman app, scan the QR, and slide to confirm the RLUSD TrustLine.',
      },
      {
        kind: 'step',
        text: '4. Wait 5 seconds, then tap "Sync" on your tablet. Your RLUSD balance ($0.00 RLUSD or higher) is now active and ready for Spot XRP/RLUSD trades.',
      },
    ],

    // =========================================================================
    // PAGE 3: LIVE SUPPORT & RESISTANCE RADAR + MARKET NOTIFICATIONS
    // =========================================================================
    [
      { kind: 'h1', text: '6. Live Support & Resistance Market Radar (Module 03)' },
      {
        kind: 'body',
        text: 'You do not need to stare at candles all day waiting for an entry. Directly below the 1-by-1 Student Trade Checklist in Module 03, open "Market Radar: Support & Resistance Alerts + 24/7 Limit Order Guide".',
      },

      { kind: 'h2', text: 'Reading the 3 Live Zones (Tab 1)' },
      {
        kind: 'step',
        text: '- Resistance Ceiling (Optimal Limit Sell Zone): Calculated from recent swing highs and upper Fibonacci structure. Ideal area to place a 24/7 Limit Sell / Take-Profit order.',
      },
      {
        kind: 'step',
        text: '- Mid-Range Wait Zone: Price is between floor and ceiling. Avoid chasing! Place Limit Orders ahead of time and let the market come to you.',
      },
      {
        kind: 'step',
        text: '- Support Floor / 61.8% Golden Pocket (Optimal Limit Buy Zone): Calculated from the 61.8% retracement and swing floor. Ideal area to stage a disciplined Limit Buy order.',
      },

      { kind: 'h2', text: 'Activating Away-From-Screen Notifications (2 Working Channels)' },
      {
        kind: 'step',
        text: 'Channel 1 - Tablet Live Chime & Banner Alerts (Instant): Tap "Activate Live Alerts" and click "Test Chime Now". You will immediately hear the 432/528 Hz harp chord and see a live top alert banner. This works 100% even if Chrome or an embedded frame restricts OS browser pop-ups.',
      },
      {
        kind: 'step',
        text: 'Channel 2 - Free Android Phone Push via ntfy App (Works With Screen Off, Zero Account/KYC):',
      },
      {
        kind: 'step',
        text: '  a) Install the free "ntfy" app from the Google Play Store on your Android phone.',
      },
      {
        kind: 'step',
        text: '  b) In the Radar panel on your tablet, tap "Generate Channel" (example: symphony-xrp-4821) and copy that exact channel name.',
      },
      {
        kind: 'step',
        text: '  c) Open the ntfy app on Android -> tap "+" -> paste that exact channel name -> tap Subscribe.',
      },
      {
        kind: 'step',
        text: '  d) Back on your tablet, tap "Test Ping". Your Android phone will chime on the lock screen within 2 seconds!',
      },

      { kind: 'h1', text: '7. Using the 1-by-1 Student Trade Checklist & 10-Set Planner' },
      {
        kind: 'step',
        text: '- Open the collapsible "1-by-1 Student Trade Checklist (Set #01 -> #10)" at the top of Module 03.',
      },
      {
        kind: 'step',
        text: '- Complete the 3 Pre-Flight Safety Checks first (Self-Custody Confirmed, 1x Spot Only, 2% Risk Rule Verified).',
      },
      {
        kind: 'step',
        text: '- Focus on ONE set at a time (starting with Set #01). Tap "Load Set Into DEX" or use Tab 2 of the Market Radar to pick Live Support/Resistance or any of Set #01-#10 and push the exact numbers straight into the Embedded XRPL DEX.',
      },
    ],

    // =========================================================================
    // PAGE 4: STEP-BY-STEP 24/7 LIMIT ORDER EXECUTION (XAMAN & SOLOGENIC)
    // =========================================================================
    [
      { kind: 'h1', text: '8. Executing a Real 24/7 Limit Buy or Limit Sell Order Step-by-Step' },
      {
        kind: 'body',
        text: 'Instead of trusting an unsupervised AI bot with your private keys, the native XRP Ledger DEX lets you place real Limit Buy and Limit Sell orders that sit directly on the blockchain 24/7 and execute automatically while you sleep.',
      },

      { kind: 'h2', text: 'Important Note: Why the Free Xaman DEX QR Opens Blank' },
      {
        kind: 'note',
        text: 'By Xaman security design, a free static QR code (without a paid/KYC Xaman Developer API key) can open the XRP / RLUSD DEX screen on your Android phone, but will NOT auto-fill your price or coin amount. This protects users from unauthorized order injection. Simply type the 3 exact numbers shown right beneath the QR!',
      },

      { kind: 'h2', text: 'Path A: Direct Android Xaman DEX Execution (Zero API Keys)' },
      {
        kind: 'step',
        text: '1. In Module 03 -> Embedded XRPL DEX -> Step 2, choose your action (Sell XRP @ Profit Target OR Buy XRP @ Support Entry) and confirm your XRP quantity (example: 2 XRP for your first small test).',
      },
      {
        kind: 'step',
        text: '2. Scroll to Step 4 and tap "Open Xaman DEX QR". Scan the QR with the blue Scan button inside your Android Xaman app.',
      },
      {
        kind: 'step',
        text: '3. Inside Xaman DEX on Android, enter the exact 3 values shown in the Step 4 Entry Ticket on your tablet:',
      },
      {
        kind: 'step',
        text: '   - Pair & Mode: XRP / RLUSD -> Tap BUY XRP or SELL XRP -> Select LIMIT (not Market!).',
      },
      {
        kind: 'step',
        text: '   - Limit Price: Enter the exact $ price from the Step 4 ticket (example: $0.9130 Buy or $0.9824 Sell).',
      },
      {
        kind: 'step',
        text: '   - Amount: Enter the exact XRP coin quantity (example: 2 XRP).',
      },
      {
        kind: 'step',
        text: '4. Tap "Place Order" in Xaman and Slide to Sign. Your Limit order is now live 24/7 on the XRP Ledger.',
      },
      {
        kind: 'step',
        text: '5. On your tablet, tap "I Signed in Xaman - Verify My Live Order on XRPL". Your live open offer will appear immediately under "Your Live Open XRPL Offers" with its on-chain sequence number.',
      },

      { kind: 'h2', text: 'Path B: Pre-Filled 1-Swipe Signing via Sologenic DEX (Zero Cost)' },
      {
        kind: 'step',
        text: '1. In Step 4, tap "Or Trade XRP/RLUSD on Sologenic DEX (Pre-Filled Xaman Sign)".',
      },
      {
        kind: 'step',
        text: '2. Connect your Android Xaman wallet once via QR on Sologenic, pick Limit, type the same Price & XRP Amount from your Step 4 ticket, and Sologenic pushes a pre-filled 1-swipe signing request directly to your Android Xaman app.',
      },

      { kind: 'divider' },
      {
        kind: 'note',
        text: 'Educational use only. Not financial advice. Stay 1x Spot, protect capital with the 2% rule, and keep your recovery phrase offline.',
      },
    ],
  ];

  return buildMultiPagePdfBlob(
    pages,
    'Symphony Markets Academy - Functional Operations & How-To Manual'
  );
}

