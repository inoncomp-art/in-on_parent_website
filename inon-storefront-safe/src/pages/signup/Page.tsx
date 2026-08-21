"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PremiumHeader } from "../../components/Shell";
import { signup, storeSession } from "../../lib/api";

export default function Signup() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
      });
      storeSession({ token: result.access_token, email: result.user.email });
      navigate("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <PremiumHeader />
      <section className="auth-page signup">
        <div className="auth-art">
          <img src="/products/cucumber.jpg" alt="Cucumber face wash" />
          <div>
            <p>THE GOOD-SKIN CLUB</p>
            <h1>
              Your ritual,
              <br />
              <em>remembered.</em>
            </h1>
            <span>Save favourites, earn Glow Points and get care made personal.</span>
          </div>
        </div>
        <div className="auth-form">
          <p className="eyebrow red">CREATE ACCOUNT</p>
          <h2>Let&apos;s get glowing.</h2>
          <p>A few details and your skin space is ready.</p>
          <div className="two">
            <label>
              First name
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" />
            </label>
            <label>
              Last name
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" />
            </label>
          </div>
          <label>
            Email address
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" />
          </label>
          <label>
            Mobile number
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Create a password" />
          </label>
          <label className="check">
            <input type="checkbox" defaultChecked /> Send me skin notes, launch previews and member-only offers.
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary full" onClick={submit} disabled={busy}>
            {busy ? "Creating account..." : "Create my account →"}
          </button>
          <small>
            Already a member? <a href="/login">Sign in</a>
          </small>
        </div>
      </section>
    </main>
  );
}
