"use client";

// Features unchanged: all moderationCategories content, guidelines, recent actions — identical

import { CheckCircle, FileText, UserX, MessageSquare, Building2, Shield } from "lucide-react";
import { useState } from "react";

const ACCENT = "#00d4b6";
const BLUE = "#0066ff";

const moderationCategories = [
	{ id: "content",       label: "Content Review",      icon: FileText,        count: 0, color: BLUE,   bg: "rgba(0,102,255,0.1)"  },
	{ id: "users",         label: "User Reports",         icon: UserX,           count: 0, color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
	{ id: "messages",      label: "Message Flags",        icon: MessageSquare,   count: 0, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
	{ id: "organizations", label: "Organization Review",  icon: Building2,       count: 0, color: ACCENT, bg: "rgba(0,212,182,0.1)"  },
];

const guidelines = [
	"Review flagged content within 24 hours",
	"Document all moderation actions",
	"Apply community guidelines consistently",
	"Escalate serious violations to admin team",
];

export default function ModerationPage() {
	const [activeTab, setActiveTab] = useState("content");
	const activeCategory = moderationCategories.find(c => c.id === activeTab)!;

	return (
		<div style={{ fontFamily: "'Barlow', sans-serif" }}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

			{/* Header */}
			<div style={{ marginBottom: 28, animation: "fadeIn 0.5s ease" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
					<div style={{
						width: 4, height: 32,
						background: `linear-gradient(180deg, ${ACCENT} 0%, ${BLUE} 100%)`,
						borderRadius: 2,
					}} />
					<h1 style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 36, fontWeight: 900, margin: 0,
						letterSpacing: "-0.03em", textTransform: "uppercase",
						background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
						WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
					}}>
						Content Moderation
					</h1>
				</div>
				<p style={{ fontSize: 13, color: "#64748b", marginLeft: 14, fontWeight: 500 }}>
					Review and moderate user-generated content and reports
				</p>
			</div>

			{/* Tabs — feature unchanged */}
			<div style={{
				display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap",
				animation: "fadeIn 0.5s ease 0.1s backwards",
			}}>
				{moderationCategories.map((cat) => {
					const CatIcon = cat.icon;
					const isActive = activeTab === cat.id;
					return (
						<button
							key={cat.id}
							onClick={() => setActiveTab(cat.id)}
							style={{
								display: "flex", alignItems: "center", gap: 8,
								padding: "10px 16px", borderRadius: 10, cursor: "pointer",
								fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 600,
								transition: "all 0.18s",
								background: isActive ? "#fff" : "rgba(255,255,255,0.6)",
								border: `1px solid ${isActive ? cat.color + "40" : "#e8e8e8"}`,
								color: isActive ? cat.color : "#64748b",
								boxShadow: isActive ? `0 2px 12px ${cat.color}14` : "none",
							}}
						>
							<CatIcon size={15} strokeWidth={2.5} />
							{cat.label}
							{cat.count > 0 && (
								<span style={{
									minWidth: 18, height: 18, borderRadius: 6,
									background: "#ef4444", color: "#fff",
									fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
									display: "inline-flex", alignItems: "center", justifyContent: "center",
									padding: "0 4px",
								}}>
									{cat.count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Tab content card */}
			<div style={{
				background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
				padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 24,
				animation: "fadeIn 0.3s ease",
			}}>
				<div style={{
					display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
					paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
				}}>
					<div style={{
						width: 38, height: 38, borderRadius: 10,
						background: activeCategory.bg,
						border: `1.5px solid ${activeCategory.color}30`,
						display: "flex", alignItems: "center", justifyContent: "center",
					}}>
						<activeCategory.icon size={18} color={activeCategory.color} strokeWidth={2.5} />
					</div>
					<h2 style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 20, fontWeight: 900, color: "#0f172a",
						letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase",
					}}>
						{activeCategory.label}
					</h2>
				</div>

				<div style={{
					display: "flex", flexDirection: "column", alignItems: "center",
					justifyContent: "center", padding: "48px 0", textAlign: "center",
				}}>
					<div style={{
						width: 64, height: 64, borderRadius: 18, marginBottom: 16,
						background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.2)",
						display: "flex", alignItems: "center", justifyContent: "center",
					}}>
						<CheckCircle size={32} color="#22c55e" strokeWidth={2} />
					</div>
					<div style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 20, fontWeight: 800, color: "#0f172a",
						letterSpacing: "-0.02em", marginBottom: 6,
					}}>
						All Clear!
					</div>
					<p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, maxWidth: 300 }}>
						No {activeCategory.label.toLowerCase()} require moderation at this time.
					</p>
				</div>
			</div>

			{/* Bottom row: Recent Actions + Guidelines */}
			<div style={{
				display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
				animation: "fadeIn 0.5s ease 0.2s backwards",
			}}>
				{/* Recent Actions */}
				<div style={{
					background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
					padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
				}}>
					<h3 style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 17, fontWeight: 800, color: "#0f172a",
						letterSpacing: "-0.02em", margin: "0 0 16px", textTransform: "uppercase",
					}}>
						Recent Actions
					</h3>
					<div style={{
						display: "flex", flexDirection: "column", alignItems: "center",
						justifyContent: "center", padding: "24px 0", textAlign: "center",
					}}>
						<Shield size={28} color="#cbd5e1" strokeWidth={1.5} style={{ marginBottom: 8 }} />
						<p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
							No recent moderation actions
						</p>
					</div>
				</div>

				{/* Guidelines */}
				<div style={{
					background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
					padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
				}}>
					<h3 style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 17, fontWeight: 800, color: "#0f172a",
						letterSpacing: "-0.02em", margin: "0 0 16px", textTransform: "uppercase",
					}}>
						Moderation Guidelines
					</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
						{guidelines.map((item, i) => (
							<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
								<div style={{
									width: 20, height: 20, borderRadius: 6, flexShrink: 0,
									background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
									display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
								}}>
									<CheckCircle size={12} color="#22c55e" strokeWidth={2.5} />
								</div>
								<span style={{ fontSize: 13, color: "#475569", fontWeight: 500, lineHeight: 1.5 }}>
									{item}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}