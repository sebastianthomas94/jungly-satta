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
    <div className="flex justify-center items-center min-h-screen bg-bg">
      <div className="bg-surface p-8 rounded-xl border border-border text-center max-w-[400px]">
        {error ? (
          <>
            <div className="text-4xl mb-2">&#10060;</div>
            <h2 className="text-xl mb-2">Connection Failed</h2>
            <p className="text-text-dim text-[0.85rem] mb-4">{error}</p>
            <a href="/" className="text-blue text-[0.9rem]">Go back to game</a>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">&#127916;</div>
            <h2 className="text-xl mb-2">Connecting YouTube...</h2>
            <p className="text-text-dim text-[0.85rem]">Please wait while we link your account.</p>
          </>
        )}
      </div>
    </div>
  );
}