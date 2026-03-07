import { Icon } from "@iconify/react";
import { ContactForm } from "@/components/contact-form/contact-form";

const PROMISES = [
  {
    icon: "solar:shield-check-bold-duotone",
    title: "Secure & Protected",
    description: "Your data is encrypted and never shared with third parties.",
  },
  {
    icon: "solar:clock-circle-bold-duotone",
    title: "Fast Response",
    description: "Our team responds to every message within 24 hours.",
  },
  {
    icon: "solar:chat-line-bold-duotone",
    title: "Expert Support",
    description: "Dedicated specialists for orders, accounts, and sellers.",
  },
];

const FAQS = [
  {
    question: "What's your authentication process?",
    answer:
      "Every item goes through our multi-point verification system to ensure 100% authenticity. No fakes, no exceptions.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Standard: 3–5 days. Express: 1–2 days available at checkout for an additional fee.",
  },
  {
    question: "How do I become a seller?",
    answer:
      'Click "Start Selling" in your dashboard. Approval typically takes 1–2 business days.',
  },
  {
    question: "Is my payment secure?",
    answer:
      "Yes. We use Stripe for payment processing with industry-standard encryption on every transaction.",
  },
];

export default function ContactPage() {
  return (
    <div
      style={{
        fontFamily: "'Barlow', sans-serif",
        background: "var(--background)",
        color: "var(--foreground)",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@300;400;500;600;700&display=swap');
        .ct-condensed { font-family: 'Barlow Condensed', sans-serif; }
        .ct-accent { color: #00d4b6; }
        .ct-grid-bg {
          background-image:
            linear-gradient(rgba(0,212,182,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,182,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .ct-faq:hover {
          border-color: rgba(0,212,182,0.3) !important;
          background: rgba(0,212,182,0.03) !important;
        }
        .ct-promise:hover {
          border-color: rgba(0,212,182,0.25) !important;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="ct-grid-bg"
        style={{
          padding: "120px clamp(20px,6vw,80px) 80px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 1,
            background: "linear-gradient(90deg, transparent, #00d4b6, transparent)",
            opacity: 0.35,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80, left: "50%",
            transform: "translateX(-50%)",
            width: 400, height: 200,
            background: "rgba(0,212,182,0.05)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p
            className="ct-condensed ct-accent"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 20 }}
          >
            Get in Touch
          </p>
          <h1
            className="ct-condensed"
            style={{
              fontSize: "clamp(52px,9vw,96px)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: "#fff",
              marginBottom: 24,
            }}
          >
            CONTACT
          </h1>
          <p
            style={{
              fontSize: "clamp(13px,1.4vw,16px)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 520,
              margin: "0 auto",
              fontWeight: 300,
            }}
          >
            Need help? We're here for you. Send us a message and our team will
            respond within 24 hours.
          </p>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ───────────────────────────────── */}
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
            gridTemplateColumns: "1fr 300px",
            gap: 60,
            alignItems: "start",
          }}
        >
          {/* Form */}
          <div>
            <p
              className="ct-condensed ct-accent"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}
            >
              Send a Message
            </p>
            <h2
              className="ct-condensed"
              style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", marginBottom: 32 }}
            >
              WE'RE LISTENING
            </h2>
            <ContactForm />
          </div>

          {/* Sidebar info */}
          <div style={{ paddingTop: 52 }}>
            <div
              style={{
                padding: "28px",
                border: "1px solid rgba(0,212,182,0.2)",
                background: "rgba(0,212,182,0.03)",
                marginBottom: 20,
              }}
            >
              <Icon icon="solar:letter-bold-duotone" width={24} style={{ color: "#00d4b6", marginBottom: 14, display: "block" }} />
              <p className="ct-condensed" style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", marginBottom: 6 }}>Email</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>support@mdfld.co</p>
            </div>
            <div
              style={{
                padding: "28px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                marginBottom: 20,
              }}
            >
              <Icon icon="solar:clock-circle-bold-duotone" width={24} style={{ color: "#00d4b6", marginBottom: 14, display: "block" }} />
              <p className="ct-condensed" style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", marginBottom: 6 }}>Response Time</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>Within 24 hours,<br />Mon–Fri 9am–6pm GMT</p>
            </div>
            <div
              style={{
                padding: "28px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <Icon icon="solar:map-point-bold-duotone" width={24} style={{ color: "#00d4b6", marginBottom: 14, display: "block" }} />
              <p className="ct-condensed" style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", marginBottom: 6 }}>Location</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 300 }}>London, UK<br />Serving 150+ Countries</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── OUR PROMISE ──────────────────────────────────── */}
      <section
        style={{
          padding: "80px clamp(20px,6vw,80px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            className="ct-condensed ct-accent"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}
          >
            Our Commitment
          </p>
          <h2
            className="ct-condensed"
            style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 40 }}
          >
            OUR PROMISE
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {PROMISES.map((p) => (
              <div
                key={p.title}
                className="ct-promise"
                style={{
                  padding: "28px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.25s",
                  cursor: "default",
                }}
              >
                <Icon icon={p.icon} width={28} style={{ color: "#00d4b6", marginBottom: 16, display: "block" }} />
                <h3
                  className="ct-condensed"
                  style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", marginBottom: 10 }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section style={{ padding: "80px clamp(20px,6vw,80px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            className="ct-condensed ct-accent"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 8 }}
          >
            Quick Answers
          </p>
          <h2
            className="ct-condensed"
            style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 40 }}
          >
            FAQ
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 14 }}>
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="ct-faq"
                style={{
                  padding: "24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.01)",
                  transition: "all 0.25s",
                  cursor: "default",
                }}
              >
                <h3
                  className="ct-condensed"
                  style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.03em", color: "#fff", marginBottom: 10 }}
                >
                  {faq.question}
                </h3>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.4)", fontWeight: 300 }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}