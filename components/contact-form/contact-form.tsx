"use client";

import { useState } from "react";

const ACCENT = "#00d4b6";

const SUBJECTS = [
  { key: "general", label: "General Inquiry" },
  { key: "order", label: "Order Issue" },
  { key: "account", label: "Account Help" },
  { key: "seller", label: "Seller Support" },
  { key: "other", label: "Other" },
];

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const set = (k: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: formData.subject }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontFamily: "'Barlow', sans-serif",
    fontSize: 13,
    padding: "14px 16px",
    outline: "none",
    transition: "border-color 0.2s",
    appearance: "none",
    WebkitAppearance: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 8,
    fontFamily: "'Barlow', sans-serif",
  };

  return (
    <div style={{ width: "100%" }}>
      {/* Status banners */}
      {status === "success" && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(0,212,182,0.1)",
            border: "1px solid rgba(0,212,182,0.3)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ color: ACCENT, fontSize: 18 }}>✓</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, fontFamily: "'Barlow',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Message Sent
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "'Barlow',sans-serif", marginTop: 2 }}>
              We'll get back to you within 24 hours.
            </p>
          </div>
        </div>
      )}
      {status === "error" && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(255,60,60,0.08)",
            border: "1px solid rgba(255,60,60,0.25)",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,100,100,0.9)", fontFamily: "'Barlow',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Failed to send — please try again.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name + Email */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              required
              placeholder="Your name"
              value={formData.name}
              onChange={set("name")}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,182,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input
              required
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={set("email")}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,182,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            />
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <label style={labelStyle}>Subject *</label>
          <div style={{ position: "relative" }}>
            <select
              required
              value={formData.subject}
              onChange={set("subject")}
              style={{
                ...inputStyle,
                cursor: "pointer",
                color: formData.subject ? "#fff" : "rgba(255,255,255,0.3)",
                paddingRight: 40,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,182,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            >
              <option value="" disabled style={{ background: "#0a0f0f", color: "rgba(255,255,255,0.4)" }}>
                Select a subject
              </option>
              {SUBJECTS.map((s) => (
                <option key={s.key} value={s.key} style={{ background: "#0a0f0f", color: "#fff" }}>
                  {s.label}
                </option>
              ))}
            </select>
            {/* Custom arrow */}
            <div
              style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                width: 0, height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "5px solid rgba(255,255,255,0.3)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Message */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Message *</label>
          <textarea
            required
            placeholder="How can we help you?"
            value={formData.message}
            onChange={set("message")}
            rows={6}
            style={{
              ...inputStyle,
              resize: "vertical",
              minHeight: 140,
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,212,182,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            width: "100%",
            padding: "16px",
            background: status === "loading" ? "rgba(0,212,182,0.6)" : ACCENT,
            border: "none",
            color: "#020606",
            fontFamily: "'Barlow', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = "#00c4a8";
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
          }}
        >
          {status === "loading" ? (
            <>
              <span
                style={{
                  width: 14, height: 14,
                  border: "2px solid rgba(2,6,6,0.3)",
                  borderTopColor: "#020606",
                  borderRadius: "50%",
                  animation: "cf-spin 0.7s linear infinite",
                  display: "inline-block",
                }}
              />
              Sending…
            </>
          ) : (
            "Send Message →"
          )}
          <style>{`@keyframes cf-spin { to { transform: rotate(360deg); } }`}</style>
        </button>
      </form>
    </div>
  );
}