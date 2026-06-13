import { useState, useCallback, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdraw",
  BET: "Bet",
  WIN: "Win",
};

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function Wallet() {
  const { user, refreshBalance } = useAuth();
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const loadTransactions = useCallback(async () => {
    try {
      const data = await api.wallet.transactions();
      setTransactions(data);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDeposit = async (amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const order = await api.payment.createOrder(amount);

      const options = {
        key: RAZORPAY_KEY || order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Jungly Satta",
        description: `Add ₹${amount} to wallet`,
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            await api.payment.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMessage({ type: "success", text: `Deposited ₹${amount.toFixed(2)}` });
            setDepositAmount("");
            await refreshBalance();
            await loadTransactions();
          } catch (err: unknown) {
            setMessage({ type: "error", text: err instanceof Error ? err.message : "Payment verification failed" });
          }
        },
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#FFD700" },
        modal: { ondismiss: () => setMessage({ type: "error", text: "Payment cancelled" }) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => setMessage({ type: "error", text: "Payment failed" }));
      rzp.open();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to initiate payment" });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.wallet.withdraw(amount);
      setMessage({ type: "success", text: `Withdrew ₹${amount.toFixed(2)}` });
      setWithdrawAmount("");
      await refreshBalance();
      await loadTransactions();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Withdraw failed" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-6">
      
      {message && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green/10 border-green/30 text-green' : 'bg-red/10 border-red/30 text-red'}`}>
          {message.text}
        </div>
      )}

      {/* Main Balance Card */}
      <div className="bg-surface border border-gold/20 rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="text-text-dim text-sm tracking-widest uppercase font-semibold mb-2 z-10">
          CURRENT BALANCE
        </div>
        <div className="text-5xl md:text-6xl font-extrabold text-gold drop-shadow-lg mb-8 z-10">
          ₹{user?.balance?.toFixed(2) || "0.00"}
        </div>

        <div className="flex gap-4 w-full max-w-[400px] z-10">
          <button 
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 py-3 rounded-lg font-bold border transition-all ${activeTab === 'deposit' ? 'bg-green/20 border-green text-green shadow-[0_0_15px_rgba(0,230,118,0.2)]' : 'bg-surface2 border-border text-text-dim hover:bg-surface'}`}
          >
            DEPOSIT
          </button>
          <button 
            onClick={() => setActiveTab("withdraw")}
            className={`flex-1 py-3 rounded-lg font-bold border transition-all ${activeTab === 'withdraw' ? 'bg-red/20 border-red text-red shadow-[0_0_15px_rgba(230,57,70,0.2)]' : 'bg-surface2 border-border text-text-dim hover:bg-surface'}`}
          >
            WITHDRAW
          </button>
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        {activeTab === "deposit" ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gold uppercase text-sm tracking-widest m-0">QUICK DEPOSIT</h3>
              <div className="text-text-dim text-xs flex items-center gap-2">
                Secure payments via <span className="font-bold text-white italic">Razorpay</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleDeposit(amt.toString())}
                  disabled={loading}
                  className="py-3 bg-surface2 border border-gold/30 rounded-lg text-gold font-bold hover:bg-gold/10 hover:shadow-[0_0_10px_rgba(255,215,0,0.2)] transition-all disabled:opacity-50"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Custom Amount (₹)"
                className="flex-1 bg-surface2 border border-border rounded-lg px-4 text-text outline-none focus:border-gold/50 transition-colors"
              />
              <button 
                onClick={() => handleDeposit(depositAmount)}
                disabled={loading || !depositAmount}
                className="btn-gold rounded-lg px-8 font-bold disabled:opacity-50"
              >
                PAY
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-red uppercase text-sm tracking-widest m-0 mb-4">WITHDRAW FUNDS</h3>
            <div className="flex gap-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount to withdraw (₹)"
                className="flex-1 bg-surface2 border border-border rounded-lg px-4 text-text outline-none focus:border-red/50 transition-colors"
              />
              <button 
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmount}
                className="bg-red/20 text-red border border-red hover:bg-red/30 rounded-lg px-8 font-bold disabled:opacity-50 transition-colors"
              >
                WITHDRAW
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-surface2/50">
          <h3 className="text-text-dim uppercase text-sm tracking-widest m-0">TRANSACTION HISTORY</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-text-dim">No transactions yet</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-text-dim bg-surface2/30">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface2/30 transition-colors">
                  <td className="px-6 py-4 text-text-dim">
                    {new Date(tx.createdAt).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 text-text">
                    {TYPE_LABELS[tx.type] || tx.type}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {tx.amount >= 0 ? "+" : "-"}₹{Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td className={`px-6 py-4 text-right ${tx.type === 'BET' || tx.type === 'WITHDRAW' ? (tx.type === 'WITHDRAW' ? 'text-gold' : 'text-text-dim') : 'text-green'}`}>
                    Success
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}