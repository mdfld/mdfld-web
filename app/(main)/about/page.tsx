"use client";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";

function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target, duration]);
  return count;
}

function useLiveStats() {
  const [stats, setStats] = useState({ salesCount: 0, userCount: 0, productCount: 0 });
  useEffect(() => {
    Promise.all([
      fetch('/api/meta/salesCount').then(r => r.json()),
      fetch('/api/meta/userCount').then(r => r.json()),
      fetch('/api/meta/productCount').then(r => r.json()),
    ]).then(([sales, users, products]) => {
      setStats({
        salesCount: sales.salesCount ?? 0,
        userCount: users.userCount ?? 0,
        productCount: products.productCount ?? 0,
      });
    }).catch(() => {});
  }, []);
  return stats;
}

const VALUES = [
  {
    icon: "solar:shield-check-bold-duotone",
    title: "Authenticity First",
  },
  {
    icon: "solar:users-group-rounded-bold-duotone",
    title: "Built for the Culture",
  },
  {
    icon: "solar:bolt-bold-duotone",
    title: "Fast. Seamless. Global.",
  },
  {
    icon: "solar:hand-shake-bold-duotone",
    title: "Fair for EVERYONE",
  },
];

const TEAM = [
  { initials: "AM", name: "Ayoola Morakinyo", role: "Founder & CEO" },
  { initials: "KB", name: "Kayla Bloom", role: "Co-Founder & CMO" },
  { initials: "RW", name: "Ryan Walden", role: "Board Advisor" },
];

export default function AboutPage() {
  const live = useLiveStats();
  const caps = useCountUp(live.salesCount);
  const players = useCountUp(live.userCount);
  const products = useCountUp(live.productCount);

  const STATS = [
    { value: players > 0 ? players.toLocaleString() : "—", label: "Active Players" },
    { value: "—", label: "Countries Served" },
    { value: products > 0 ? products.toLocaleString() : "—", label: "Verified Products" },
    { value: caps > 0 ? caps.toLocaleString() : "—", label: "Caps" },
  ];

  return (
    <div
      className="w-full min-h-screen"
      style={{
        fontFamily: "'Barlow', sans-serif",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap');
        .ab-condensed { font-family: 'Barlow Condensed', sans-serif; }
        .ab-accent { color: #00d4b6; }
        .ab-grid-bg {
          background-image:
            linear-gradient(rgba(0,212,182,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,182,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .ab-stat-card:hover { border-color: rgba(0,212,182,0.4); transform: translateY(-2px); transition: all 0.25s; }
        .ab-value-card:hover { border-color: rgba(0,212,182,0.3); background: rgba(0,212,182,0.04); transition: all 0.25s; }
        .ab-team-card:hover .ab-avatar { border-color: #00d4b6; background: rgba(0,212,182,0.15); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="ab-grid-bg relative overflow-hidden"
        style={{
          padding: "120px clamp(20px,6vw,80px) 80px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #00d4b6, transparent)",
            opacity: 0.4,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "-60px",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(0,212,182,0.06)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            className="ab-condensed ab-accent"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            About MDFLD
          </p>
          <h1
            className="ab-condensed"
            style={{
              fontSize: "clamp(52px,9vw,96px)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              marginBottom: 32,
              color: "#fff",
            }}
          >
            THE APEX OF
            <br />
            <span className="ab-accent">FOOTBALL</span> CULTURE
          </h1>
          <p
            style={{
              fontSize: "clamp(14px,1.5vw,17px)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.55)",
              maxWidth: 600,
              fontWeight: 300,
            }}
          >
            MDFLD is the global marketplace for premium football gear —
            connecting serious players, verified sellers, and collectors across
            150+ countries. Every product. Authenticated.
          </p>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section
        style={{
          padding: "60px clamp(20px,6vw,80px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 20,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="ab-stat-card"
              style={{
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                cursor: "default",
              }}
            >
              <p
                className="ab-condensed ab-accent"
                style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 8,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────── */}
      <section
        style={{
          padding: "80px clamp(20px,6vw,80px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 60,
            alignItems: "center",
          }}
        >
          <div>
            <p
              className="ab-condensed ab-accent"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 16 }}
            >
              Our Mission
            </p>
            <h2
              className="ab-condensed"
              style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 24 }}
            >
              FOOTBALL GEAR,
              <br />WITHOUT COMPROMISE
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>
              We built MDFLD because football culture deserves better. Better
              access, better authentication, better prices — without sacrificing
              the premium feel that serious players demand.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.5)", fontWeight: 300, marginTop: 16 }}>
              Every listing is seller-verified and buyer-protected. From match
              boots to training kits, if it&apos;s on MDFLD, it&apos;s real.
            </p>
          </div>

          {/* Visual accent block */}
          <div
            style={{
              position: "relative",
              height: 280,
              border: "1px solid rgba(0,212,182,0.2)",
              background: "rgba(0,212,182,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "linear-gradient(rgba(0,212,182,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,182,0.04) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <p
              className="ab-condensed"
              style={{
                fontSize: 100,
                fontWeight: 900,
                color: "rgba(0,212,182,0.08)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                userSelect: "none",
                position: "relative",
                zIndex: 1,
              }}
            >
              MDFLD
            </p>
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#00d4b6",
                boxShadow: "0 0 16px rgba(0,212,182,0.8)",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section
        style={{
          padding: "80px clamp(20px,6vw,80px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            className="ab-condensed ab-accent"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}
          >
            What We Stand For
          </p>
          <h2
            className="ab-condensed"
            style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 40 }}
          >
            OUR VALUES
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: 16,
            }}
          >
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="ab-value-card"
                style={{
                  padding: "24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "default",
                }}
              >
                <Icon
                  icon={v.icon}
                  width={28}
                  style={{ color: "#00d4b6", marginBottom: 14, display: "block" }}
                />
                <h3
                  className="ab-condensed"
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#fff",
                    marginBottom: 0,
                  }}
                >
                  {v.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section style={{ padding: "80px clamp(20px,6vw,80px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            className="ab-condensed ab-accent"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}
          >
            Behind MDFLD
          </p>
          <h2
            className="ab-condensed"
            style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 40 }}
          >
            THE TEAM
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 20,
            }}
          >
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="ab-team-card"
                style={{ padding: "24px 20px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", cursor: "default" }}
              >
                <div
                  className="ab-avatar"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(0,212,182,0.08)",
                    border: "1px solid rgba(0,212,182,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 16,
                    fontWeight: 900,
                    color: "#00d4b6",
                    transition: "all 0.25s",
                  }}
                >
                  {member.initials}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
                  {member.name}
                </p>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "60px clamp(20px,6vw,80px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          textAlign: "center",
        }}
      >
        <h2
          className="ab-condensed"
          style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 20 }}
        >
          READY TO JOIN?
        </h2>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/shop"
            style={{
              fontFamily: "'Barlow',sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: "#00d4b6",
              color: "#020606",
              padding: "14px 28px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Browse Products
          </Link>
          <Link
            href="/contact"
            style={{
              fontFamily: "'Barlow',sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              background: "transparent",
              color: "rgba(255,255,255,0.6)",
              padding: "14px 28px",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              display: "inline-block",
            }}
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
