import { useState, useCallback, useEffect, type FormEvent } from "react";
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
  BET: "Bet Placed",
  WIN: "Win",
};

function typeColor(type: string) {
  if (type === "WIN") return "text-green";
  if (type === "BET") return "text-red";
  return "text-text-dim";
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

export default function Wallet() {
  const { user, refreshBalance } = useAuth();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await api.wallet.transactions();
      setTransactions(data);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
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
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
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
            setMessage({
              type: "error",
              text: err instanceof Error ? err.message : "Payment verification failed",
            });
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#FFD700" },
        modal: {
          ondismiss: () => {
            setMessage({ type: "error", text: "Payment cancelled" });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setMessage({ type: "error", text: "Payment failed. Please try again." });
      });
      rzp.open();
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to initiate payment",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.wallet.withdraw(parseFloat(withdrawAmount));
      setMessage({ type: "success", text: `Withdrew ₹${parseFloat(withdrawAmount).toFixed(2)}` });
      setWithdrawAmount("");
      await refreshBalance();
      await loadTransactions();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Withdraw failed" });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-[700px] mx-auto px-4 py-8">
      <h1 className="mb-6">Wallet</h1>

      <div className="bg-surface rounded-xl p-6 border border-border mb-6">
        <div className="text-[0.85rem] text-text-dim mb-1">
          Available Balance
        </div>
        <div className="text-4xl font-bold text-gold">
          ₹{user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg mb-4 text-[0.9rem] ${
            message.type === "success"
              ? "bg-green/15 text-green"
              : "bg-red/15 text-red"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="wallet-grid grid grid-cols-2 gap-4 mb-8 max-[767px]:grid-cols-1">
        <form onSubmit={handleDeposit} className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="mb-4 text-green">Add Money</h3>
          <input
            type="number" min="1" step="0.01"
            value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="w-full p-[0.7rem] bg-surface2 border border-border rounded-lg text-text text-base outline-none mb-3"
            required
          />
          <button type="submit" disabled={loading}
            className="w-full p-[0.7rem] bg-green border-none rounded-lg text-white text-base font-semibold cursor-pointer"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>
          <div className="text-xs text-text-dim mt-2 text-center">
            Secure payment via Razorpay
          </div>
        </form>

        <form onSubmit={handleWithdraw} className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="mb-4 text-red">Withdraw</h3>
          <input
            type="number" min="1" step="0.01"
            value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="w-full p-[0.7rem] bg-surface2 border border-border rounded-lg text-text text-base outline-none mb-3"
            required
          />
          <button type="submit" disabled={loading}
            className="w-full p-[0.7rem] bg-red border-none rounded-lg text-white text-base font-semibold cursor-pointer"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            Withdraw
          </button>
        </form>
      </div>

      <h2 className="mb-4">Transaction History</h2>
      <div className="bg-surface rounded-xl overflow-hidden border border-border">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-text-dim">
            No transactions yet
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center py-3 px-4 border-b border-border">
              <div>
                <div className={`font-semibold ${typeColor(tx.type)}`}>
                  {TYPE_LABELS[tx.type] || tx.type}
                </div>
                <div className="text-[0.8rem] text-text-dim">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={`font-bold text-lg ${tx.amount >= 0 ? "text-green" : "text-red"}`}>
                {tx.amount >= 0 ? "+" : ""}₹{Math.abs(tx.amount).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}