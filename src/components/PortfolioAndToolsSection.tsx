import React, { useState } from 'react';
import { fetchPublicWalletBalance } from '../services/marketData';
import {
  AssetSymbol,
  BotStrategyConfig,
  Candle,
  PaperPosition,
  PriceAlert,
  WatchedWallet,
} from '../types/market';

interface PortfolioAndToolsSectionProps {
  activeSectionTab: 'portfolio' | 'wallets' | 'bot_sandbox' | 'alerts';
  onSectionTabChange: (tab: 'portfolio' | 'wallets' | 'bot_sandbox' | 'alerts') => void;
  positions: PaperPosition[];
  onClosePosition: (id: string, exitPrice: number) => void;
  btcPrice?: number;
  xrpPrice: number;
  xlmPrice: number;
  candles: Candle[];
  watchedWallets: WatchedWallet[];
  onAddWallet: (w: WatchedWallet) => void;
  onRemoveWallet: (id: string) => void;
  botStrategies: BotStrategyConfig[];
  onToggleBot: (id: string) => void;
  onRunBotBacktest: (id: string) => void;
  alerts: PriceAlert[];
  onAddAlert: (a: Omit<PriceAlert, 'id' | 'triggered'>) => void;
  onDeleteAlert: (id: string) => void;
}

export const PortfolioAndToolsSection: React.FC<PortfolioAndToolsSectionProps> = ({
  activeSectionTab,
  onSectionTabChange,
  positions,
  onClosePosition,
  btcPrice = 91450,
  xrpPrice,
  xlmPrice,
  watchedWallets,
  onAddWallet,
  onRemoveWallet,
  botStrategies,
  onToggleBot,
  onRunBotBacktest,
  alerts,
  onAddAlert,
  onDeleteAlert,
}) => {
  // Wallet Form State
  const [walletLabel, setWalletLabel] = useState('My Android Xaman Wallet');
  const [walletNetwork, setWalletNetwork] = useState<
    'Bitcoin' | 'Xaman Wallet (XRPL)' | 'XRPL' | 'Stellar' | 'TrustWallet Multi-Chain'
  >('Xaman Wallet (XRPL)');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSyncingWallet, setIsSyncingWallet] = useState(false);

  // Alert Form State
  const [alertSymbol, setAlertSymbol] = useState<AssetSymbol>('XRPUSDT');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('2.5500');
  const [alertNote, setAlertNote] = useState<string>('Breakout above local resistance');

  // 2FA Simulation State for Strategy Sandbox
  const [totpCode, setTotpCode] = useState('482910');
  const [totpVerifiedMsg, setTotpVerifiedMsg] = useState<string | null>(null);

  const getLivePriceForSymbol = (sym: AssetSymbol) =>
    sym === 'BTCUSDT' ? btcPrice : sym === 'XRPUSDT' ? xrpPrice : xlmPrice;

  const openPositions = positions.filter((p) => p.status === 'open');
  const closedPositions = positions.filter((p) => p.status === 'closed');

  const totalUnrealizedPnl = openPositions.reduce((acc, p) => {
    const mark = getLivePriceForSymbol(p.symbol);
    const diff = p.side === 'long' ? mark - p.entryPrice : p.entryPrice - mark;
    return acc + diff * p.quantity;
  }, 0);

  const totalRealizedPnl = closedPositions.reduce(
    (acc, p) => acc + (p.realizedPnlUsd ?? 0),
    0
  );

  const winningClosed = closedPositions.filter((p) => (p.realizedPnlUsd ?? 0) > 0).length;
  const winRatePct =
    closedPositions.length > 0
      ? (winningClosed / closedPositions.length) * 100
      : 66.7;

  const handleAddWatchedWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr =
      walletAddress.trim() ||
      (walletNetwork === 'Bitcoin'
        ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
        : walletNetwork === 'XRPL' || walletNetwork === 'Xaman Wallet (XRPL)'
        ? 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh'
        : 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ');
    setIsSyncingWallet(true);
    const balances = await fetchPublicWalletBalance(walletNetwork, addr);
    setIsSyncingWallet(false);

    onAddWallet({
      id: `wal_${Date.now()}`,
      label: walletLabel.trim() || 'Public Read-Only Watch',
      network: walletNetwork,
      address: addr,
      btcBalance: balances.btcBalance ?? 0,
      xrpBalance: balances.xrpBalance,
      xlmBalance: balances.xlmBalance,
      usdtBalance: balances.usdtBalance,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLiveChain: balances.isLiveChain,
    });
    setWalletAddress('');
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(alertTargetPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;
    onAddAlert({
      symbol: alertSymbol,
      condition: alertCondition,
      targetPrice: priceNum,
      note: alertNote.trim() || 'Custom threshold trigger',
    });
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-5 space-y-5">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onSectionTabChange('portfolio')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSectionTab === 'portfolio'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Paper Portfolio ({openPositions.length} Open)
          </button>
          <button
            type="button"
            onClick={() => onSectionTabChange('wallets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSectionTab === 'wallets'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Read-Only Wallet Watch ({watchedWallets.length})
          </button>
          <button
            type="button"
            onClick={() => onSectionTabChange('bot_sandbox')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSectionTab === 'bot_sandbox'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Strategy Bot Sandbox
          </button>
          <button
            type="button"
            onClick={() => onSectionTabChange('alerts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeSectionTab === 'alerts'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Price Alerts ({alerts.length})
          </button>
        </div>

        {/* Summary Telemetry */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums">
          <span className="text-slate-500 dark:text-slate-400">
            Open PnL:{' '}
            <strong
              className={
                totalUnrealizedPnl >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }
            >
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Realized PnL:{' '}
            <strong
              className={
                totalRealizedPnl >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }
            >
              {totalRealizedPnl >= 0 ? '+' : ''}${totalRealizedPnl.toFixed(2)}
            </strong>
          </span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            ·
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            Win Rate: <strong className="text-slate-900 dark:text-white">{winRatePct.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: PAPER PORTFOLIO & RISK METRICS */}
      {activeSectionTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Asset & Type</th>
                  <th className="py-2.5 px-3 font-medium">Side</th>
                  <th className="py-2.5 px-3 font-medium text-right">Size</th>
                  <th className="py-2.5 px-3 font-medium text-right">Entry Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">2% Stop / 1:2 Target</th>
                  <th className="py-2.5 px-3 font-medium text-right">Mark Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">Live PnL</th>
                  <th className="py-2.5 px-3 font-medium text-right">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center font-sans text-slate-500 dark:text-slate-400">
                      No simulated positions logged yet. Use the Risk Manager panel to size and log a 2% risk paper trade.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => {
                    const mark =
                      pos.status === 'closed'
                        ? pos.exitPrice ?? pos.entryPrice
                        : getLivePriceForSymbol(pos.symbol);
                    const pnl =
                      pos.status === 'closed'
                        ? pos.realizedPnlUsd ?? 0
                        : (pos.side === 'long' ? mark - pos.entryPrice : pos.entryPrice - mark) *
                          pos.quantity;

                    return (
                      <tr
                        key={pos.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white whitespace-nowrap">
                          {pos.symbol} ·{' '}
                          <span className="capitalize text-slate-500 dark:text-slate-400">
                            {pos.instrument} ({pos.leverage}x)
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 font-sans font-semibold uppercase whitespace-nowrap ${
                            pos.side === 'long'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {pos.side}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {pos.symbol === 'BTCUSDT'
                            ? pos.quantity.toFixed(6)
                            : pos.quantity.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          ${pos.entryPrice.toFixed(pos.symbol === 'BTCUSDT' ? 2 : 4)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="text-rose-500">
                            ${pos.stopLoss.toFixed(pos.symbol === 'BTCUSDT' ? 2 : 4)}
                          </span>{' '}
                          /{' '}
                          <span className="text-emerald-500">
                            ${pos.takeProfit.toFixed(pos.symbol === 'BTCUSDT' ? 2 : 4)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          ${mark.toFixed(pos.symbol === 'BTCUSDT' ? 2 : 4)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                            pnl >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-sans whitespace-nowrap">
                          {pos.status === 'open' ? (
                            <button
                              type="button"
                              onClick={() => onClosePosition(pos.id, mark)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
                            >
                              Close at Market
                            </button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">
                              Closed ({pos.closeReason || 'Manual'})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: READ-ONLY EXTERNAL WALLET MONITOR (TRUST WALLET / XRPL / STELLAR) */}
      {activeSectionTab === 'wallets' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAddWatchedWallet} className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Add Read-Only Public Wallet (Xaman Android / Trust Wallet / XRPL / Stellar)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitor your live 5 XRP test or external holdings safely using only your public <span className="font-mono">r...</span> or <span className="font-mono">G...</span> address. Never enter seed phrases or Xaman Secret Numbers.
            </p>

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Wallet Label
              </label>
              <input
                type="text"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="e.g., My Android Xaman Wallet"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Wallet / Ledger Network
                </label>
                <select
                  value={walletNetwork}
                  onChange={(e) =>
                    setWalletNetwork(
                      e.target.value as
                        | 'Bitcoin'
                        | 'Xaman Wallet (XRPL)'
                        | 'XRPL'
                        | 'Stellar'
                        | 'TrustWallet Multi-Chain'
                    )
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Bitcoin">Bitcoin Network (BTC / bc1...)</option>
                  <option value="Xaman Wallet (XRPL)">Xaman Wallet (Android / XRPL)</option>
                  <option value="XRPL">XRP Ledger (Trust Wallet / Native)</option>
                  <option value="Stellar">Stellar Network (XLM / Lobstr)</option>
                  <option value="TrustWallet Multi-Chain">Trust Wallet Multi-Chain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Public Receive Address (`bc1...` / `r...` / `G...`)
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder={
                    walletNetwork === 'Bitcoin'
                      ? 'bc1...'
                      : walletNetwork === 'Stellar'
                      ? 'G...'
                      : 'r...'
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSyncingWallet}
              className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isSyncingWallet ? 'Querying Public Ledger...' : 'Connect Read-Only Public Address'}
            </button>
          </form>

          <div className="lg:col-span-7 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Wallet & Network</th>
                  <th className="py-2.5 px-3 font-medium text-right">BTC Holdings</th>
                  <th className="py-2.5 px-3 font-medium text-right">XRP Holdings</th>
                  <th className="py-2.5 px-3 font-medium text-right">XLM Holdings</th>
                  <th className="py-2.5 px-3 font-medium text-right">Est. Portfolio Value</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                {watchedWallets.map((w) => {
                  const btcBal = w.btcBalance ?? 0;
                  const totalUsd =
                    btcBal * btcPrice +
                    w.xrpBalance * xrpPrice +
                    w.xlmBalance * xlmPrice +
                    w.usdtBalance;
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {w.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {w.network} · {w.address.slice(0, 8)}...{w.address.slice(-6)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {btcBal > 0 ? `${btcBal.toFixed(6)} BTC` : '0 BTC'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {w.xrpBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })} XRP
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {w.xlmBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })} XLM
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onRemoveWallet(w.id)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STRATEGY BOT SANDBOX & 2FA EXCHANGE SIMULATOR */}
      {activeSectionTab === 'bot_sandbox' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Exchange Paper Sandbox & 2FA Protection (Educational Mode Only)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulates automated indicator rules (similar to Apollo/Binance paper bots) against historical XRP & XLM candles without real capital risk.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                aria-label="Simulated 2FA Code"
                className="w-24 px-2.5 py-1.5 text-xs font-mono text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={() =>
                  setTotpVerifiedMsg(`2FA Session Verified (${new Date().toLocaleTimeString()})`)
                }
                className="px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Verify 2FA Session
              </button>
              {totpVerifiedMsg && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {totpVerifiedMsg}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {botStrategies.map((bot) => (
              <div
                key={bot.id}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {bot.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {bot.symbol} · {bot.exchangeSandbox} · Risk Cap: {bot.riskPerTradePct}% (1:{bot.rrTarget} R:R)
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      bot.active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {bot.active ? '● Paper Active' : 'Paused'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs font-mono tabular-nums">
                  <div>
                    <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                      Simulated Trades
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {bot.simulatedTradesCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                      Historical Win Rate
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {bot.winRatePct.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                      Net Paper Return
                    </div>
                    <div
                      className={`font-semibold ${
                        bot.netPnlUsd >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {bot.netPnlUsd >= 0 ? '+' : ''}${bot.netPnlUsd.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onToggleBot(bot.id)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    {bot.active ? 'Pause Paper Rule' : 'Enable Paper Rule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRunBotBacktest(bot.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-600/10 text-sky-600 dark:text-sky-400 hover:bg-sky-600/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Run Candle Backtest (+10 Bars)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PRICE & VOLATILITY ALERTS */}
      {activeSectionTab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateAlert} className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">
              Create Real-Time Price Threshold Alert
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Asset Pair
                </label>
                <select
                  value={alertSymbol}
                  onChange={(e) => {
                    const sym = e.target.value as AssetSymbol;
                    setAlertSymbol(sym);
                    setAlertTargetPrice(
                      sym === 'BTCUSDT'
                        ? (btcPrice * 1.02).toFixed(2)
                        : sym === 'XRPUSDT'
                        ? (xrpPrice * 1.02).toFixed(4)
                        : (xlmPrice * 1.02).toFixed(4)
                    );
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="XRPUSDT">XRP/USDT</option>
                  <option value="XLMUSDT">XLM/USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Trigger Condition
                </label>
                <select
                  value={alertCondition}
                  onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="above">Crosses Above (≥)</option>
                  <option value="below">Crosses Below (≤)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Target Price ($)
                </label>
                <input
                  type="number"
                  step={alertSymbol === 'BTCUSDT' ? '0.01' : '0.0001'}
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Alert Note
                </label>
                <input
                  type="text"
                  value={alertNote}
                  onChange={(e) => setAlertNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Add Threshold Alert
            </button>
          </form>

          <div className="lg:col-span-7 overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Asset</th>
                  <th className="py-2.5 px-3 font-medium">Condition</th>
                  <th className="py-2.5 px-3 font-medium">Note</th>
                  <th className="py-2.5 px-3 font-medium">State</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {alerts.map((al) => (
                  <tr key={al.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {al.symbol}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums">
                      {al.condition === 'above' ? '≥' : '≤'} $
                      {al.targetPrice.toFixed(al.symbol === 'BTCUSDT' ? 2 : 4)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{al.note}</td>
                    <td className="py-2.5 px-3">
                      {al.triggered ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          ▲ Triggered ({al.triggeredAt})
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">● Monitoring</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteAlert(al.id)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
