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
    <div className="flex justify-center items-center min-h-screen bg-bg p-4">
      <div className="bg-surface p-8 rounded-xl w-full max-w-[400px] border border-border text-center">
        <div className="text-4xl mb-2">
          &#127922;
        </div>
        <h1 className="mb-2 text-2xl">
          Jungly Satta
        </h1>
        <p className="text-text-dim mb-8">
          Sign in with your Google account to start playing
        </p>

        {error && (
          <div className="bg-red/15 text-red p-3 rounded-lg mb-4 text-[0.9rem]">
            {error}
          </div>
        )}

        <div className="flex justify-center">
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