import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    setError("");
    try {
      if (credentialResponse.credential) {
        await loginWithGoogle(credentialResponse.credential);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    }
  };

  const handleError = () => {
    setError("Google sign-in was cancelled or failed");
  };

  return (
    <div style={{
      display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", background: "var(--bg)"
    }}>
      <div style={{
        background: "var(--surface)", padding: "3rem", borderRadius: "12px",
        width: "400px", border: "1px solid var(--border)", textAlign: "center"
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          &#127922;
        </div>
        <h1 style={{ marginBottom: "0.5rem", fontSize: "1.8rem" }}>
          Jungly Satta
        </h1>
        <p style={{ color: "var(--text-dim)", marginBottom: "2rem" }}>
          Sign in with your Google account to start playing
        </p>

        {error && (
          <div style={{
            background: "rgba(231,76,60,0.15)", color: "var(--red)",
            padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.9rem"
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            text="signin_with"
            shape="rectangular"
            size="large"
            width="320"
          />
        </div>
      </div>
    </div>
  );
}