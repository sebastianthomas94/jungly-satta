import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code received from YouTube.");
      return;
    }

    api.youtube
      .connect(code)
      .then(() => {
        if (window.opener) {
          window.opener.postMessage({ type: "youtube-connected" }, "*");
          window.close();
        } else {
          navigate("/", { replace: true });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to connect YouTube account");
      });
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", background: "var(--bg)",
    }}>
      <div style={{
        background: "var(--surface)", padding: "2rem", borderRadius: "12px",
        border: "1px solid var(--border)", textAlign: "center", maxWidth: "400px",
      }}>
        {error ? (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#10060;</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Connection Failed</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>
            <a href="/" style={{ color: "var(--blue)", fontSize: "0.9rem" }}>Go back to game</a>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>&#127916;</div>
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Connecting YouTube...</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>Please wait while we link your account.</p>
          </>
        )}
      </div>
    </div>
  );
}