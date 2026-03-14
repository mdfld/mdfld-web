"use client";

// Features unchanged: trpc.admin.analytics.useQuery() — all data fetching identical
import { trpc } from "@/lib/trpc-client";
import { Loader2, Users, Building2, UserCheck, MessageCircle, Mail, TrendingUp, CalendarDays } from "lucide-react";

const ACCENT = "#00d4b6";
const BLUE = "#0066ff";
const GREEN = "#00c96e";
const AMBER = "#f59e0b";
const RED = "#ff6b6b";

export default function AnalyticsPage() {
	// ── Feature unchanged ─────────────────────────────────────
	const { data: analytics, isLoading } = trpc.admin.analytics.useQuery();

	if (isLoading) {
		return (
			<div style={{
				display: "flex", alignItems: "center", justifyContent: "center",
				minHeight: 300, gap: 12, color: ACCENT,
			}}>
				<style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
				<Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
				<span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 600, color: "#64748b" }}>
					Loading analytics…
				</span>
			</div>
		);
	}

	if (!analytics) {
		return (
			<div style={{
				background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
				padding: "48px 24px", textAlign: "center",
				fontFamily: "'Barlow', sans-serif", color: "#94a3b8", fontSize: 14,
			}}>
				Failed to load analytics data
			</div>
		);
	}

	// ── Feature unchanged: same stat cards data ───────────────
	const statCards = [
		{
			title: "Total Users",
			value: analytics.users.total,
			subtitle: `+${analytics.users.recent} in last 30 days`,
			icon: Users, color: ACCENT, bg: "rgba(0,212,182,0.1)", border: "rgba(0,212,182,0.2)",
		},
		{
			title: "Total Organizations",
			value: analytics.organizations.total,
			subtitle: `+${analytics.organizations.recent} in last 30 days`,
			icon: Building2, color: BLUE, bg: "rgba(0,102,255,0.1)", border: "rgba(0,102,255,0.2)",
		},
		{
			title: "Active Users",
			value: analytics.users.active,
			subtitle: "Active in last 7 days",
			icon: UserCheck, color: GREEN, bg: "rgba(0,201,110,0.1)", border: "rgba(0,201,110,0.2)",
		},
		{
			title: "Total Conversations",
			value: analytics.conversations.total,
			subtitle: "All-time conversations",
			icon: MessageCircle, color: AMBER, bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)",
		},
		{
			title: "Total Messages",
			value: analytics.messages.total,
			subtitle: "All-time messages",
			icon: Mail, color: RED, bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.2)",
		},
	];

	return (
		<div style={{ fontFamily: "'Barlow', sans-serif" }}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .adm-stat-card { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
        .adm-stat-card:hover { transform: translateY(-3px); }
        .adm-reg-row { transition: background 0.15s; }
        .adm-reg-row:hover { background: #f8fafc !important; }
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
						Platform Analytics
					</h1>
				</div>
				<p style={{ fontSize: 13, color: "#64748b", marginLeft: 14, fontWeight: 500 }}>
					Overview of platform usage and statistics
				</p>
			</div>

			{/* Stat cards grid */}
			<div style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
				gap: 16, marginBottom: 24,
				animation: "fadeIn 0.5s ease 0.1s backwards",
			}}>
				{statCards.map((stat) => {
					const StatIcon = stat.icon;
					return (
						<div
							key={stat.title}
							className="adm-stat-card"
							style={{
								background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
								padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
								position: "relative", overflow: "hidden",
							}}
							onMouseEnter={e => {
								(e.currentTarget as HTMLDivElement).style.borderColor = stat.color + "50";
								(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${stat.color}14`;
							}}
							onMouseLeave={e => {
								(e.currentTarget as HTMLDivElement).style.borderColor = "#e8e8e8";
								(e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
							}}
						>
							<div style={{
								width: 44, height: 44, borderRadius: 12, marginBottom: 14,
								background: stat.bg, border: `1px solid ${stat.border}`,
								display: "flex", alignItems: "center", justifyContent: "center",
							}}>
								<StatIcon size={20} color={stat.color} strokeWidth={2.5} />
							</div>
							<div style={{
								fontFamily: "'Barlow Condensed', sans-serif",
								fontSize: 32, fontWeight: 900, color: "#0f172a",
								letterSpacing: "-0.03em", lineHeight: 1,
							}}>
								{stat.value.toLocaleString()}
							</div>
							<div style={{
								fontFamily: "'Barlow', sans-serif", fontSize: 11, fontWeight: 600,
								color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase",
								marginTop: 6, marginBottom: 4,
							}}>
								{stat.title}
							</div>
							<div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
								{stat.subtitle}
							</div>
							<div style={{
								position: "absolute", top: 0, right: 0, width: 80, height: 80,
								background: `radial-gradient(circle at top right, ${stat.color}08, transparent)`,
								borderRadius: "0 16px 0 0",
							}} />
						</div>
					);
				})}
			</div>

			{/* Daily registrations — feature unchanged */}
			<div style={{
				background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16,
				padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
				animation: "fadeIn 0.5s ease 0.2s backwards",
			}}>
				<div style={{
					display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
					paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
				}}>
					<div style={{
						width: 38, height: 38, borderRadius: 10,
						background: `linear-gradient(135deg, ${ACCENT}15, ${BLUE}15)`,
						border: `1.5px solid ${ACCENT}30`,
						display: "flex", alignItems: "center", justifyContent: "center",
					}}>
						<CalendarDays size={18} color={ACCENT} strokeWidth={2.5} />
					</div>
					<h2 style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 20, fontWeight: 900, color: "#0f172a",
						letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase",
					}}>
						Daily User Registrations
					</h2>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
					{analytics.dailyRegistrations.map((day: any) => (
						<div
							key={day.date}
							className="adm-reg-row"
							style={{
								display: "flex", justifyContent: "space-between", alignItems: "center",
								padding: "10px 12px", borderRadius: 10, background: "transparent",
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
								<div style={{
									width: 7, height: 7, borderRadius: "50%", background: ACCENT,
									boxShadow: `0 0 6px ${ACCENT}80`,
								}} />
								<span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
									{day.date}
								</span>
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
								<TrendingUp size={13} color={ACCENT} strokeWidth={2.5} />
								<span style={{
									fontFamily: "'Barlow Condensed', sans-serif",
									fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em",
								}}>
									{day.count}
								</span>
								<span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>new users</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}