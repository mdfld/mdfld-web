"use client";

// Features unchanged: AdminBannerCards (fetchUserCount, fetchOrgCount, fetchProductCount + recharts)
import AdminBannerCards from "@/components/admin/admin-meta-cards/page";
import Link from "next/link";

const ACCENT = "#00d4b6";
const BLUE = "#0066ff";

const adminSections = [
	{
		title: "Platform Analytics",
		description: "View user counts, organization metrics, and platform statistics",
		icon: "📊",
		href: "/admin/analytics",
		accent: ACCENT,
	},
	{
		title: "Content Moderation",
		description: "Review and moderate user-generated content and reports",
		icon: "🛡️",
		href: "/admin/moderation",
		accent: "#f59e0b",
	},
	{
		title: "Admin Settings",
		description: "Configure platform-wide settings and features",
		icon: "⚙️",
		href: "/admin/settings",
		accent: BLUE,
	},
];

export default function AdminDashboard() {
	return (
		<div style={{ fontFamily: "'Barlow', sans-serif" }}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .adm-section-card { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
        .adm-section-card:hover { transform: translateY(-3px); }
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
						Dashboard
					</h1>
				</div>
				<p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: "#64748b", marginLeft: 14, fontWeight: 500 }}>
					Platform overview and quick access
				</p>
			</div>

			{/* Banner cards — feature unchanged */}
			<div style={{
				background: "#fff", border: "1px solid #e8e8e8",
				borderRadius: 16, padding: 24, marginBottom: 24,
				boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
				animation: "fadeIn 0.5s ease 0.1s backwards",
			}}>
				<div style={{
					fontFamily: "'Barlow Condensed', sans-serif",
					fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
					textTransform: "uppercase", color: "#94a3b8", marginBottom: 16,
				}}>
					Platform Stats
				</div>
				<AdminBannerCards />
			</div>

			{/* Quick nav cards */}
			<div style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
				gap: 16,
				animation: "fadeIn 0.5s ease 0.2s backwards",
			}}>
				{adminSections.map((section) => (
					<Link key={section.href} href={section.href} style={{ textDecoration: "none" }}>
						<div
							className="adm-section-card"
							style={{
								background: "#fff", border: "1px solid #e8e8e8",
								borderRadius: 16, padding: "20px 22px",
								boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
								cursor: "pointer",
							}}
							onMouseEnter={e => {
								(e.currentTarget as HTMLDivElement).style.borderColor = section.accent + "60";
								(e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${section.accent}14`;
							}}
							onMouseLeave={e => {
								(e.currentTarget as HTMLDivElement).style.borderColor = "#e8e8e8";
								(e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
							}}
						>
							<div style={{
								width: 44, height: 44, borderRadius: 12, marginBottom: 14,
								background: section.accent + "18",
								border: `1px solid ${section.accent}30`,
								display: "flex", alignItems: "center", justifyContent: "center",
								fontSize: 20,
							}}>
								{section.icon}
							</div>
							<div style={{
								fontFamily: "'Barlow Condensed', sans-serif",
								fontSize: 17, fontWeight: 800, color: "#0f172a",
								letterSpacing: "-0.01em", marginBottom: 6, textTransform: "uppercase",
							}}>
								{section.title}
							</div>
							<div style={{
								fontFamily: "'Barlow', sans-serif",
								fontSize: 13, color: "#64748b", lineHeight: 1.5, fontWeight: 500,
							}}>
								{section.description}
							</div>
							<div style={{
								marginTop: 14, display: "flex", alignItems: "center", gap: 4,
								fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 700,
								color: section.accent, letterSpacing: "0.03em",
							}}>
								Open <span style={{ fontSize: 14 }}>→</span>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}