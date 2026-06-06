import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

export default function Wallet() {
  const { user, refreshBalance } = useAuth();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await api.wallet.transactions();
      setTransactions(data);
    } catch {}
  };

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.wallet.deposit(parseFloat(depositAmount));
      setMessage({ type: "success", text: `Deposited $${parseFloat(depositAmount).toFixed(2)}` });
      setDepositAmount("");
      await refreshBalance();
      await loadTransactions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
    setLoading(false);
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.wallet.withdraw(parseFloat(withdrawAmount));
      setMessage({ type: "success", text: `Withdrew $${parseFloat(withdrawAmount).toFixed(2)}` });
      setWithdrawAmount("");
      await refreshBalance();
      await loadTransactions();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
    setLoading(false);
  };

  const formatType = (type: string) => {
    switch (type) {
      case "DEPOSIT": return "Deposit";
      case "WITHDRAW": return "Withdraw";
      case "BET": return "Bet Placed";
      case "WIN": return "Win";
      default: return type;
    }
  };

  const typeColor = (type: string) => {
    if (type === "WIN") return "var(--green)";
    if (type === "BET") return "var(--red)";
    return "var(--text-dim)";
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Wallet</h1>

      <div style={{
        background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
        border: "1px solid var(--border)", marginBottom: "1.5rem"
      }}>
        <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
          Available Balance
        </div>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--gold)" }}>
          ${user?.balance?.toFixed(2) || "0.00"}
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === "success" ? "rgba(46,204,113,0.15)" : "rgba(231,76,60,0.15)",
          color: message.type === "success" ? "var(--green)" : "var(--red)",
          padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem"
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <form onSubmit={handleDeposit} style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
          border: "1px solid var(--border)"
        }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--green)" }}>Deposit</h3>
          <input
            type="number" min="1" step="0.01"
            value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount"
            style={{
              width: "100%", padding: "0.7rem", background: "var(--surface2)",
              border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)",
              fontSize: "1rem", outline: "none", marginBottom: "0.75rem"
            }}
            required
          />
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.7rem", background: "var(--green)",
            border: "none", borderRadius: "8px", color: "#fff", fontSize: "1rem",
            fontWeight: 600, opacity: loading ? 0.6 : 1
          }}>
            Deposit
          </button>
        </form>

        <form onSubmit={handleWithdraw} style={{
          background: "var(--surface)", borderRadius: "12px", padding: "1.5rem",
          border: "1px solid var(--border)"
        }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--red)" }}>Withdraw</h3>
          <input
            type="number" min="1" step="0.01"
            value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="Amount"
            style={{
              width: "100%", padding: "0.7rem", background: "var(--surface2)",
              border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)",
              fontSize: "1rem", outline: "none", marginBottom: "0.75rem"
            }}
            required
          />
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "0.7rem", background: "var(--red)",
            border: "none", borderRadius: "8px", color: "#fff", fontSize: "1rem",
            fontWeight: 600, opacity: loading ? 0.6 : 1
          }}>
            Withdraw
          </button>
        </form>
      </div>

      <h2 style={{ marginBottom: "1rem" }}>Transaction History</h2>
      <div style={{
        background: "var(--surface)", borderRadius: "12px", overflow: "hidden",
        border: "1px solid var(--border)"
      }}>
        {transactions.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dim)" }}>
            No transactions yet
          </div>
        ) : (
          transactions.map((tx: any) => (
            <div key={tx.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)"
            }}>
              <div>
                <div style={{ fontWeight: 600, color: typeColor(tx.type) }}>
                  {formatType(tx.type)}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{
                fontWeight: 700, fontSize: "1.1rem",
                color: tx.amount >= 0 ? "var(--green)" : "var(--red)"
              }}>
                {tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}