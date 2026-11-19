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
