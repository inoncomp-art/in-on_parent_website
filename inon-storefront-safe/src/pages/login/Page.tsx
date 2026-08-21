"use client";

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PremiumHeader } from "../../components/Shell";
import { login, storeSession } from "../../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await login(email, password);
      storeSession({ token: result.access_token, email: result.user.email });
      navigate(searchParams.get("next") || "/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <PremiumHeader />
      <section className="auth-page">
        <div className="auth-art">
          <img src="/products/serum.jpg" alt="In&On serum" />
          <div>
            <p>YOUR SKIN SPACE</p>
            <h1>
              Welcome back
              <br />
              to your <em>ritual.</em>
            </h1>
            <span>Orders, rewards and routines all in one beautiful place.</span>
          </div>
        </div>
        <div className="auth-form">
          <a href="/" className="wordmark">
            <img src="/logo-header.png" alt="In&On" />
          </a>
          <p className="eyebrow red">MY IN&ON</p>
          <h2>Good to see you.</h2>
          <p>Sign in to unlock your connected dashboard.</p>
          <label>
            Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary full" onClick={submit} disabled={busy}>
            {busy ? "Signing in..." : "Continue with email →"}
          </button>
          <div className="or">
            <span>OR</span>
          </div>
          <button className="social-login" disabled>
            G&nbsp; Continue with Google
          </button>
          <small>
            New to In&On? <a href="/signup">Create your account</a>
          </small>
        </div>
      </section>
    </main>
  );
}
