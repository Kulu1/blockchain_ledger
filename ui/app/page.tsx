"use client";

import React, { useMemo, useState } from "react";
import { Blocks, Pickaxe, Wallet, ShieldCheck, Clock3, PlusCircle, RefreshCw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BLOCKCHAIN_API_URL || "http://localhost:3000";

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

function StatCard({ icon: Icon, title, value, hint }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</h3>
          {hint ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
      />
    </label>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
      {children}
    </span>
  );
}

export default function Page() {
  const [chainData, setChainData] = useState({ length: 0, chain: [] });
  const [pending, setPending] = useState([]);
  const [validation, setValidation] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceAddress, setBalanceAddress] = useState("");
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [minerAddress, setMinerAddress] = useState("");
  const [minedBlock, setMinedBlock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const latestBlock = useMemo(() => {
    if (!chainData.chain?.length) return null;
    return chainData.chain[chainData.chain.length - 1];
  }, [chainData]);

  const resetStatus = () => {
    setMessage("");
    setError("");
  };

  const loadChain = async () => {
    resetStatus();
    setLoading(true);
    try {
      const data = await api("/chain");
      setChainData(data);
      setMessage("Blockchain loaded successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPending = async () => {
    resetStatus();
    setLoading(true);
    try {
      const data = await api("/pending");
      setPending(data.pendingTransactions || []);
      setMessage("Pending transactions loaded.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const validateChain = async () => {
    resetStatus();
    setLoading(true);
    try {
      const data = await api("/validate");
      setValidation(data);
      setMessage("Validation completed.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);
    try {
      await api("/transactions", {
        method: "POST",
        body: JSON.stringify({
          sender,
          receiver,
          amount: Number(amount),
        }),
      });
      setSender("");
      setReceiver("");
      setAmount("");
      setMessage("Transaction added successfully.");
      await Promise.all([loadPending(), loadChain()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const mineBlock = async (e) => {
    e.preventDefault();
    resetStatus();
    setLoading(true);
    try {
      const data = await api("/mine", {
        method: "POST",
        body: JSON.stringify({ minerAddress }),
      });
      setMinedBlock(data.block);
      setMessage(data.message || "Block mined successfully.");
      await Promise.all([loadPending(), loadChain(), validateChain()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async (e) => {
    e.preventDefault();
    if (!balanceAddress) return;
    resetStatus();
    setLoading(true);
    try {
      const data = await api(`/balance/${encodeURIComponent(balanceAddress)}`);
      setBalance(data);
      setMessage("Balance fetched.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    resetStatus();
    setLoading(true);
    try {
      const [chainRes, pendingRes, validateRes] = await Promise.all([
        api("/chain"),
        api("/pending"),
        api("/validate"),
      ]);
      setChainData(chainRes);
      setPending(pendingRes.pendingTransactions || []);
      setValidation(validateRes);
      setMessage("Dashboard refreshed.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
              <Blocks className="h-4 w-4" /> Simple Blockchain Ledger
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Next.js Blockchain Dashboard</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-3xl">
              A Next.js frontend for your educational blockchain API. Add transactions, mine blocks,
              inspect the chain, validate integrity, and check balances from one interface.
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              API base: <span className="font-mono">{API_BASE}</span>
            </p>
          </div>
          <button
            onClick={loadAll}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm hover:opacity-95 dark:bg-slate-100 dark:text-slate-900"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Dashboard
          </button>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"}`}>
            {error || message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Blocks} title="Chain Length" value={chainData.length || 0} hint="Total number of blocks" />
          <StatCard icon={PlusCircle} title="Pending Transactions" value={pending.length} hint="Awaiting mining" />
          <StatCard
            icon={ShieldCheck}
            title="Chain Status"
            value={validation ? (validation.valid ? "Valid" : "Invalid") : "Unknown"}
            hint={validation?.message || "Run validation to verify integrity"}
          />
          <StatCard
            icon={Clock3}
            title="Latest Block"
            value={latestBlock ? `#${latestBlock.index}` : "None"}
            hint={latestBlock ? `Nonce: ${latestBlock.nonce}` : "Load the chain to inspect blocks"}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <SectionCard title="Add Transaction" subtitle="Create a new pending transaction for the next block.">
              <form onSubmit={addTransaction} className="space-y-4">
                <Input label="Sender" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Alice" />
                <Input label="Receiver" value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Bob" />
                <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50" />
                <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:opacity-95 dark:bg-slate-100 dark:text-slate-900">
                  Submit Transaction
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Mine Block" subtitle="Mine all pending transactions into a new block.">
              <form onSubmit={mineBlock} className="space-y-4">
                <Input
                  label="Miner Address"
                  value={minerAddress}
                  onChange={(e) => setMinerAddress(e.target.value)}
                  placeholder="Miner1"
                />
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:opacity-95 dark:bg-slate-100 dark:text-slate-900">
                  <Pickaxe className="h-4 w-4" /> Mine Pending Transactions
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Check Balance" subtitle="Compute total confirmed balance for an address.">
              <form onSubmit={checkBalance} className="space-y-4">
                <Input
                  label="Wallet / Address"
                  value={balanceAddress}
                  onChange={(e) => setBalanceAddress(e.target.value)}
                  placeholder="Alice"
                />
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-300 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900">
                  <Wallet className="h-4 w-4" /> Check Balance
                </button>
              </form>

              {balance && (
                <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-4 dark:bg-slate-950 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                  <p className="font-medium break-all">{balance.address}</p>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Balance</p>
                  <p className="text-2xl font-semibold">{balance.balance}</p>
                </div>
              )}
            </SectionCard>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <SectionCard
              title="Blockchain Explorer"
              subtitle="Inspect every block in the ledger."
              action={
                <button onClick={loadChain} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Load Chain
                </button>
              }
            >
              <div className="space-y-4 max-h-[560px] overflow-auto pr-1">
                {chainData.chain?.length ? (
                  chainData.chain.map((block) => (
                    <div key={block.index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge>Block #{block.index}</Badge>
                        <Badge>{new Date(block.timestamp).toLocaleString()}</Badge>
                        <Badge>Nonce: {block.nonce}</Badge>
                        <Badge>{block.transactions?.length || 0} txns</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 mb-1">Hash</p>
                          <p className="break-all font-mono text-xs text-slate-800 dark:text-slate-200">{block.hash}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 mb-1">Previous Hash</p>
                          <p className="break-all font-mono text-xs text-slate-800 dark:text-slate-200">{block.previousHash}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 mb-2">Transactions</p>
                          {block.transactions?.length ? (
                            <div className="space-y-2">
                              {block.transactions.map((tx, i) => (
                                <div key={i} className="rounded-xl bg-white border border-slate-200 p-3 dark:bg-slate-900 dark:border-slate-800">
                                  <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                                    <Badge>{tx.sender}</Badge>
                                    <span className="text-slate-400">→</span>
                                    <Badge>{tx.receiver}</Badge>
                                  </div>
                                  <p className="font-medium">Amount: {tx.amount}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 dark:text-slate-400">No transactions in this block.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No blocks loaded yet.
                  </div>
                )}
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard
                title="Pending Transactions"
                subtitle="Transactions waiting to be mined."
                action={
                  <button onClick={loadPending} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    Load Pending
                  </button>
                }
              >
                <div className="space-y-3 min-h-[180px]">
                  {pending.length ? (
                    pending.map((tx, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                        <p className="font-medium">{tx.sender} → {tx.receiver}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Amount: {tx.amount}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No pending transactions.
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                title="Validation + Mining Result"
                subtitle="Verify integrity and inspect the most recently mined block."
                action={
                  <button onClick={validateChain} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                    Validate
                  </button>
                }
              >
                <div className="space-y-4 min-h-[180px]">
                  <div className={`rounded-xl border p-4 ${validation?.valid ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`}>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Validation Status</p>
                    <p className="mt-1 text-lg font-semibold">{validation ? (validation.valid ? "Blockchain is valid" : "Blockchain is invalid") : "Not checked yet"}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{validation?.message || "Run validation to check hash links and proof-of-work."}</p>
                  </div>

                  {minedBlock ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Last Mined Block</p>
                      <p className="mt-1 font-semibold">Block #{minedBlock.index}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Nonce: {minedBlock.nonce}</p>
                      <p className="mt-2 break-all font-mono text-xs text-slate-700 dark:text-slate-300">{minedBlock.hash}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No mined block in this session yet.
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>

        {loading && (
          <div className="fixed bottom-5 right-5 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
            Working...
          </div>
        )}
      </div>
    </div>
  );
}
