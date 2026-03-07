"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { useNotificationSubscription } from "@/hooks/useNotifications";
import {
	Badge,
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import NotificationsTray from "@/components/dashboard/notifications-tray";
import {
	LayoutDashboard,
	BarChart3,
	Shield,
	Settings,
	LogOut,
	ChevronLeft,
	ChevronRight,
	ShieldCheck,
	Bell,
} from "lucide-react";

const ACCENT = "#00d4b6";
const BG_SIDE = "#080e0e";

const menuItems = [
	{ icon: LayoutDashboard, label: "Dashboard",  path: "/admin",            group: "main" },
	{ icon: BarChart3,       label: "Analytics",  path: "/admin/analytics",  group: "main" },
	{ icon: Shield,          label: "Moderation", path: "/admin/moderation", group: "main" },
	{ icon: Settings,        label: "Settings",   path: "/admin/settings",   group: "system" },
];

const groups: Record<string, string> = {
	main:   "Manage",
	system: "System",
};

// ─── Logo ─────────────────────────────────────────────────────
function LogoMark({ collapsed }: { collapsed: boolean }) {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 4px" }}>
			<div style={{
				width: 36, height: 36, flexShrink: 0,
				background: `linear-gradient(135deg, ${ACCENT} 0%, #007a6e 100%)`,
				borderRadius: 10,
				display: "flex", alignItems: "center", justifyContent: "center",
				boxShadow: `0 0 0 1px rgba(0,212,182,0.3), 0 4px 16px rgba(0,212,182,0.2)`,
				position: "relative", overflow: "hidden",
			}}>
				<div style={{
					position: "absolute", top: 0, left: 0, right: 0, height: "50%",
					background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)",
					borderRadius: "10px 10px 0 0",
				}} />
				<span style={{
					fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 900,
					color: "#020a0a", letterSpacing: "-0.05em", position: "relative", lineHeight: 1,
				}}>M</span>
			</div>
			{!collapsed && (
				<div style={{ overflow: "hidden" }}>
					<div style={{
						fontFamily: "'Outfit', sans-serif",
						fontSize: 17, fontWeight: 800,
						color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1, whiteSpace: "nowrap",
					}}>
						mdfld<span style={{ color: ACCENT }}>.</span>
					</div>
					<div style={{
						fontFamily: "'DM Mono', monospace",
						fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase",
						color: "rgba(255,255,255,0.28)", marginTop: 2, whiteSpace: "nowrap",
					}}>
						Admin
					</div>
				</div>
			)}
		</div>
	);
}

// ─── Nav Items ────────────────────────────────────────────────
function NavItems({
	onNavigate, collapsed, isMobile, pathname,
}: {
	onNavigate: (path: string) => void;
	collapsed: boolean;
	isMobile: boolean;
	pathname: string;
}) {
	const show = !collapsed || isMobile;
	const rendered: React.ReactNode[] = [];
	let lastGroup = "";

	menuItems.forEach((item, i) => {
		const ItemIcon = item.icon;
		const isActive =
			item.path === "/admin"
				? pathname === "/admin"
				: pathname.startsWith(item.path);

		if (show && item.group !== lastGroup) {
			if (lastGroup !== "") rendered.push(
				<div key={`div-${item.group}`} style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
			);
			rendered.push(
				<div key={`lbl-${item.group}`} style={{
					fontFamily: "'DM Mono', monospace", fontSize: 8,
					letterSpacing: "0.24em", textTransform: "uppercase",
					color: "rgba(255,255,255,0.2)", padding: "4px 12px 8px",
				}}>
					{groups[item.group]}
				</div>
			);
			lastGroup = item.group;
		}
		if (!show && item.group !== lastGroup) {
			if (lastGroup !== "") rendered.push(
				<div key={`div-${item.group}`} style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 4px" }} />
			);
			lastGroup = item.group;
		}

		rendered.push(
			<a
				key={i}
				href={item.path}
				onClick={e => { e.preventDefault(); onNavigate(item.path); }}
				title={collapsed && !isMobile ? item.label : ""}
				style={{
					display: "flex", alignItems: "center",
					gap: show ? 11 : 0,
					padding: show ? "10px 12px" : "11px",
					marginBottom: 2, borderRadius: 9,
					background: isActive ? "rgba(0,212,182,0.12)" : "transparent",
					border: `1px solid ${isActive ? "rgba(0,212,182,0.25)" : "transparent"}`,
					color: isActive ? ACCENT : "rgba(255,255,255,0.52)",
					textDecoration: "none",
					fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500,
					transition: "all 0.18s", cursor: "pointer",
					justifyContent: show ? "flex-start" : "center",
					position: "relative",
				}}
				onMouseEnter={e => {
					if (!isActive) {
						e.currentTarget.style.background = "rgba(255,255,255,0.06)";
						e.currentTarget.style.color = "#fff";
					}
				}}
				onMouseLeave={e => {
					if (!isActive) {
						e.currentTarget.style.background = "transparent";
						e.currentTarget.style.color = "rgba(255,255,255,0.52)";
					}
				}}
			>
				{isActive && (
					<div style={{
						position: "absolute", left: 0, top: "20%", bottom: "20%",
						width: 3, borderRadius: "0 3px 3px 0",
						background: ACCENT, boxShadow: `0 0 8px ${ACCENT}`,
					}} />
				)}
				<ItemIcon size={16} style={{ opacity: isActive ? 1 : 0.75, flexShrink: 0 }} />
				{show && <span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>}
			</a>
		);
	});

	return <>{rendered}</>;
}

// ─── User Footer ──────────────────────────────────────────────
function UserFooter({
	compact, user, handleLogout,
}: {
	compact: boolean;
	user: { name?: string | null; email?: string | null } | null;
	handleLogout: () => void;
}) {
	return (
		<div style={{ padding: compact ? "16px 10px" : "16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
			{!compact ? (
				<div style={{
					background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
					borderRadius: 10, padding: "12px 14px", marginBottom: 10,
				}}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
						<div style={{
							width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
							background: `linear-gradient(135deg, ${ACCENT}, #005a52)`,
							display: "flex", alignItems: "center", justifyContent: "center",
							fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: "#020a0a",
						}}>
							{user?.name?.charAt(0).toUpperCase() ?? "A"}
						</div>
						<div style={{ minWidth: 0 }}>
							<div style={{
								fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
								color: "#fff", letterSpacing: "-0.01em",
								whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
							}}>
								{user?.name ?? "Admin"}
							</div>
							<div style={{
								fontFamily: "'DM Mono', monospace", fontSize: 9,
								color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em",
								whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
							}}>
								{user?.email ?? ""}
							</div>
						</div>
					</div>
					<div style={{
						display: "inline-flex", alignItems: "center", gap: 5,
						background: "rgba(0,212,182,0.1)", border: "1px solid rgba(0,212,182,0.2)",
						borderRadius: 5, padding: "3px 8px",
					}}>
						<ShieldCheck size={10} color={ACCENT} />
						<span style={{
							fontFamily: "'DM Mono', monospace", fontSize: 8,
							letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT,
						}}>Super Admin</span>
					</div>
				</div>
			) : (
				<div style={{
					width: 32, height: 32, borderRadius: "50%",
					background: `linear-gradient(135deg, ${ACCENT}, #005a52)`,
					display: "flex", alignItems: "center", justifyContent: "center",
					fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: "#020a0a",
					margin: "0 auto 10px",
				}}>
					{user?.name?.charAt(0).toUpperCase() ?? "A"}
				</div>
			)}

			<button
				onClick={handleLogout}
				title={compact ? "Logout" : ""}
				style={{
					width: "100%", display: "flex", alignItems: "center",
					justifyContent: compact ? "center" : "flex-start",
					gap: 8, padding: compact ? "10px" : "10px 12px",
					background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
					borderRadius: 8, color: "rgba(239,100,100,0.8)",
					fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
					letterSpacing: "0.04em", cursor: "pointer", transition: "all 0.2s",
				}}
				onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; e.currentTarget.style.color = "#fc8181"; }}
				onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "rgba(239,100,100,0.8)"; }}
			>
				<LogOut size={15} />
				{!compact && <span>Sign Out</span>}
			</button>
		</div>
	);
}

// ─── Main Wrapper ─────────────────────────────────────────────
export default function AdminSidebarWrapper({ children }: { children: React.ReactNode }) {
	const [collapsed, setCollapsed] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	const router = useRouter();
	const pathname = usePathname();
	const { data: session } = useSession();
	const user = session?.user ?? null;

	// ── Keep existing: real-time notifications ───────────────
	const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
		refetchInterval: 30000,
	});
	useNotificationSubscription();

	const activeLabel = menuItems.find(item =>
		item.path === "/admin" ? pathname === "/admin" : pathname.startsWith(item.path)
	)?.label ?? "Admin";

	useEffect(() => {
		const check = () => setIsMobile(window.innerWidth < 1024);
		check();
		window.addEventListener("resize", check);
		return () => window.removeEventListener("resize", check);
	}, []);

	useEffect(() => {
		const h = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
		window.addEventListener("keydown", h);
		return () => window.removeEventListener("keydown", h);
	}, []);

	const handleLogout = async () => {
		await authClient.signOut();
		router.push("/auth/login");
	};

	const navigate = (path: string) => { router.push(path); setDrawerOpen(false); };

	return (
		<div style={{ fontFamily: "'Outfit', sans-serif", background: "#f7f9f9", minHeight: "100vh", display: "flex" }}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@300;400;500&family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        .adm-nav::-webkit-scrollbar { width: 3px; }
        .adm-nav::-webkit-scrollbar-track { background: transparent; }
        .adm-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        .adm-drawer::-webkit-scrollbar { display: none; }
        .adm-main {
          background-color: #f7f9f9;
          background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0);
          background-size: 28px 28px;
        }
        .adm-topbar { box-shadow: 0 1px 0 rgba(0,0,0,0.07), 0 2px 12px rgba(0,0,0,0.04); }
        .adm-content { animation: admFadeUp 0.3s ease; }
        @keyframes admFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .adm-sidebar { transition: width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

			{/* ── Desktop Sidebar ── */}
			{!isMobile && (
				<aside className="adm-sidebar" style={{
					width: collapsed ? 70 : 256, minWidth: collapsed ? 70 : 256,
					background: BG_SIDE, borderRight: "1px solid rgba(255,255,255,0.07)",
					display: "flex", flexDirection: "column",
					position: "sticky", top: 0, height: "100vh", flexShrink: 0, overflow: "hidden",
				}}>
					{/* Logo row */}
					<div style={{
						padding: collapsed ? "20px 17px" : "20px 18px",
						borderBottom: "1px solid rgba(255,255,255,0.07)",
						display: "flex", alignItems: "center",
						justifyContent: collapsed ? "center" : "space-between",
					}}>
						<LogoMark collapsed={collapsed} />
						{!collapsed && (
							<button onClick={() => setCollapsed(true)} title="Collapse sidebar" style={{
								width: 32, height: 32, borderRadius: 8,
								background: "rgba(0,212,182,0.12)", border: "1px solid rgba(0,212,182,0.3)",
								display: "flex", alignItems: "center", justifyContent: "center",
								cursor: "pointer", color: ACCENT, transition: "all 0.2s", flexShrink: 0,
								boxShadow: "0 0 10px rgba(0,212,182,0.1)",
							}}
								onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,182,0.22)"; e.currentTarget.style.transform = "scale(1.05)"; }}
								onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,182,0.12)"; e.currentTarget.style.transform = "scale(1)"; }}
							>
								<ChevronLeft size={15} />
							</button>
						)}
					</div>

					{collapsed && (
						<button onClick={() => setCollapsed(false)} title="Expand sidebar" style={{
							margin: "8px auto 0", width: 36, height: 28, borderRadius: 7,
							background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
							display: "flex", alignItems: "center", justifyContent: "center",
							cursor: "pointer", color: "rgba(255,255,255,0.25)", transition: "all 0.2s",
						}}
							onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = "rgba(0,212,182,0.3)"; }}
							onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
						>
							<ChevronRight size={13} />
						</button>
					)}

					<nav className="adm-nav" style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
						<NavItems onNavigate={navigate} collapsed={collapsed} isMobile={false} pathname={pathname} />
					</nav>

					<UserFooter compact={collapsed} user={user} handleLogout={handleLogout} />
				</aside>
			)}

			{/* ── Main area ── */}
			<div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

				{/* Topbar */}
				<header className="adm-topbar" style={{
					height: 60, background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)",
					display: "flex", alignItems: "center", justifyContent: "space-between",
					padding: "0 28px", flexShrink: 0,
				}}>
					<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
						{isMobile && (
							<>
								<div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 6 }}>
									<div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${ACCENT}, #007a6e)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
										<span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 900, color: "#020a0a" }}>M</span>
									</div>
									<span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 800, color: "#0f1a1a", letterSpacing: "-0.03em" }}>
										mdfld<span style={{ color: ACCENT }}>.</span>
									</span>
								</div>
								<span style={{ color: "#ccc", fontSize: 14 }}>›</span>
							</>
						)}
						<div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
							<span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, color: "#0f1a1a", letterSpacing: "-0.02em" }}>
								{activeLabel}
							</span>
							{!isMobile && (
								<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)" }}>
									mdfld.admin
								</span>
							)}
						</div>
					</div>

					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						{/* Live indicator */}
						<div style={{ display: "flex", alignItems: "center", gap: 6 }}>
							<div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.15)" }} />
							<span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(0,0,0,0.3)" }}>Live</span>
						</div>

						{/* Keep existing: Notifications bell */}
						<Popover placement="bottom-end">
							<PopoverTrigger>
								<button style={{
									width: 36, height: 36, borderRadius: 9, cursor: "pointer",
									background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)",
									display: "flex", alignItems: "center", justifyContent: "center",
									color: "#64748b", transition: "all 0.2s", position: "relative",
								}}
									onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,182,0.1)"; e.currentTarget.style.borderColor = "rgba(0,212,182,0.3)"; e.currentTarget.style.color = ACCENT; }}
									onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "#64748b"; }}
								>
									{unreadCount && unreadCount > 0 ? (
										<>
											<Bell size={16} />
											<span style={{
												position: "absolute", top: -4, right: -4,
												minWidth: 16, height: 16, borderRadius: 8,
												background: "#ef4444", color: "#fff",
												fontFamily: "'DM Mono', monospace", fontSize: 8, fontWeight: 700,
												display: "flex", alignItems: "center", justifyContent: "center",
												padding: "0 3px", boxShadow: "0 0 0 2px #fff",
											}}>
												{unreadCount > 9 ? "9+" : unreadCount}
											</span>
										</>
									) : (
										<Bell size={16} />
									)}
								</button>
							</PopoverTrigger>
							<PopoverContent className="p-0">
								<NotificationsTray />
							</PopoverContent>
						</Popover>

						{/* Mobile hamburger */}
						{isMobile && (
							<button
								onClick={() => setDrawerOpen(o => !o)}
								style={{
									width: 36, height: 36, borderRadius: 9, cursor: "pointer",
									background: `linear-gradient(135deg, ${ACCENT}, #007a6e)`,
									border: "none",
									display: "flex", alignItems: "center", justifyContent: "center",
									boxShadow: "0 0 12px rgba(0,212,182,0.3)", transition: "box-shadow 0.2s",
								}}
								onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(0,212,182,0.5)"}
								onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 12px rgba(0,212,182,0.3)"}
							>
								<ShieldCheck size={17} color="#020a0a" />
							</button>
						)}

						{/* Avatar */}
						{!isMobile && (
							<div style={{
								width: 32, height: 32, borderRadius: "50%",
								background: `linear-gradient(135deg, ${ACCENT}, #005a52)`,
								display: "flex", alignItems: "center", justifyContent: "center",
								fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 700, color: "#020a0a",
								boxShadow: "0 0 0 2px rgba(0,212,182,0.2)",
							}}>
								{user?.name?.charAt(0).toUpperCase() ?? "A"}
							</div>
						)}
					</div>
				</header>

				{/* Page content */}
				<main className="adm-main" style={{ flex: 1, padding: "28px 32px", overflowY: "auto", height: 0 }}>
					<div className="adm-content" style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
						{children}
					</div>
				</main>
			</div>

			{/* ── Mobile bottom drawer ── */}
			{isMobile && (
				<>
					{drawerOpen && (
						<div onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 200 }} />
					)}
					<div className="adm-drawer" style={{
						position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
						background: BG_SIDE, borderTop: "1px solid rgba(255,255,255,0.1)",
						borderTopLeftRadius: 22, borderTopRightRadius: 22,
						transform: drawerOpen ? "translateY(0)" : "translateY(100%)",
						transition: "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
						paddingBottom: "env(safe-area-inset-bottom)",
						maxHeight: "82vh", overflowY: "auto",
						boxShadow: "0 -20px 60px rgba(0,0,0,0.5)",
					}}>
						<div style={{ display: "flex", justifyContent: "center", padding: "14px 0 6px" }}>
							<div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
						</div>
						<div style={{ padding: "10px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
							<LogoMark collapsed={false} />
						</div>
						<nav style={{ padding: "12px 14px" }}>
							<NavItems onNavigate={navigate} collapsed={false} isMobile={true} pathname={pathname} />
						</nav>
						<UserFooter compact={false} user={user} handleLogout={handleLogout} />
					</div>
				</>
			)}
		</div>
	);
}	