"use client";

// Features unchanged: all settings sections, Switch defaultSelected values, Reset/Save buttons — identical
import { Switch, Button } from "@heroui/react";
import { Users, Building2, MessageSquare } from "lucide-react";

const ACCENT = "#00d4b6";
const BLUE = "#0066ff";

export default function AdminSettingsPage() {
	// ── Feature unchanged: same settings data ─────────────────
	const settings = [
		{
			section: "User Management",
			Icon: Users,
			color: ACCENT,
			bg: "rgba(0,212,182,0.1)",
			items: [
				{ id: "user-registration", label: "Allow new user registrations",  description: "Enable or disable new user sign-ups", enabled: true },
				{ id: "email-verification", label: "Require email verification",   description: "Users must verify their email before accessing the platform", enabled: true },
				{ id: "profile-moderation", label: "Moderate user profiles",        description: "Review user profiles before they go live", enabled: false },
			],
		},
		{
			section: "Organization Settings",
			Icon: Building2,
			color: BLUE,
			bg: "rgba(0,102,255,0.1)",
			items: [
				{ id: "org-creation",      label: "Allow organization creation",        description: "Users can create new organizations", enabled: true },
				{ id: "org-verification",  label: "Require organization verification",  description: "Organizations must be verified by admins", enabled: false },
				{ id: "org-limits",        label: "Organization member limits",          description: "Limit the number of members per organization", enabled: false },
			],
		},
		{
			section: "Content & Messaging",
			Icon: MessageSquare,
			color: "#8b5cf6",
			bg: "rgba(139,92,246,0.1)",
			items: [
				{ id: "message-encryption",  label: "End-to-end encryption",         description: "Encrypt all messages between users", enabled: true },
				{ id: "content-filtering",   label: "Automatic content filtering",   description: "Filter inappropriate content automatically", enabled: false },
				{ id: "file-uploads",        label: "Allow file uploads",            description: "Users can upload files in messages", enabled: true },
			],
		},
	];

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
						Admin Settings
					</h1>
				</div>
				<p style={{ fontSize: 13, color: "#64748b", marginLeft: 14, fontWeight: 500 }}>
					Configure platform-wide settings and features
				</p>
			</div>

			{/* Settings sections */}
			<div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.5s ease 0.1s backwards" }}>
				{settings.map((section) => (
					<div key={section.section} style={{
						background: "#fff", border: "1px solid #e8e8e8",
						borderRadius: 16, padding: 24,
						boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
					}}>
						{/* Section header */}
						<div style={{
							display: "flex", alignItems: "center", gap: 12,
							marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #f1f5f9",
						}}>
							<div style={{
								width: 38, height: 38, borderRadius: 10,
								background: section.bg, border: `1.5px solid ${section.color}30`,
								display: "flex", alignItems: "center", justifyContent: "center",
							}}>
								<section.Icon size={18} color={section.color} strokeWidth={2.5} />
							</div>
							<h3 style={{
								fontFamily: "'Barlow Condensed', sans-serif",
								fontSize: 17, fontWeight: 800, color: "#0f172a",
								letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase",
							}}>
								{section.section}
							</h3>
						</div>

						{/* Settings items — Switch feature unchanged */}
						<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
							{section.items.map((item, index) => (
								<div key={item.id}>
									<div style={{
										display: "flex", alignItems: "center",
										justifyContent: "space-between", padding: "14px 0",
									}}>
										<div style={{ flex: 1, marginRight: 24 }}>
											<div style={{
												fontFamily: "'Barlow', sans-serif",
												fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 3,
											}}>
												{item.label}
											</div>
											<div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, lineHeight: 1.4 }}>
												{item.description}
											</div>
										</div>
										{/* Feature unchanged: Switch with defaultSelected */}
										<Switch
											defaultSelected={item.enabled}
											size="sm"
											color="primary"
										/>
									</div>
									{index < section.items.length - 1 && (
										<div style={{ height: 1, background: "#f1f5f9" }} />
									)}
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			{/* Action buttons — feature unchanged */}
			<div style={{
				display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24,
				animation: "fadeIn 0.5s ease 0.2s backwards",
			}}>
				{/* Keep HeroUI Button — feature unchanged */}
				<Button
					variant="bordered"
					style={{
						fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13,
						borderColor: "#e2e8f0", color: "#64748b",
					}}
				>
					Reset to Defaults
				</Button>
				<Button
					color="primary"
					style={{
						fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13,
						background: ACCENT, color: "#020a0a", border: "none",
					}}
				>
					Save Changes
				</Button>
			</div>
		</div>
	);
}