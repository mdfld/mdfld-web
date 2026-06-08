"use client";

import { Switch, Button } from "@heroui/react";
import { Users, Building2, MessageSquare, DollarSign, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc-client";

const ACCENT = "#00d4b6";
const BLUE = "#0066ff";

export default function AdminSettingsPage() {
	const { data: platformSettings } = trpc.admin.getPlatformSettings.useQuery();
	const updateSettings = trpc.admin.updatePlatformSettings.useMutation();

	const [weights, setWeights] = useState({
		recencyWeight: 0.35,
		relevanceWeight: 0.30,
		trustWeight: 0.20,
		priceWeight: 0.15,
	});
	const [weightsSaved, setWeightsSaved] = useState(false);
	const [weightsSaving, setWeightsSaving] = useState(false);
	const weightsSum = +(
		weights.recencyWeight +
		weights.relevanceWeight +
		weights.trustWeight +
		weights.priceWeight
	).toFixed(2);
	const weightsSumValid = Math.abs(weightsSum - 1.0) < 0.001;

	useEffect(() => {
		fetch("/api/admin/scoring-weights")
			.then((r) => r.json())
			.then((data) => {
				if (data.recencyWeight !== undefined) setWeights(data);
			})
			.catch(() => {});
	}, []);

	const handleSaveWeights = async () => {
		if (!weightsSumValid) return;
		setWeightsSaving(true);
		try {
			const res = await fetch("/api/admin/scoring-weights", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(weights),
			});
			if (res.ok) {
				setWeightsSaved(true);
				setTimeout(() => setWeightsSaved(false), 2000);
			}
		} finally {
			setWeightsSaving(false);
		}
	};

	const [commissionPct, setCommissionPct] = useState<string>("");
	const [marketplaceFee, setMarketplaceFee] = useState<string>("");
	const [shippingMarkup, setShippingMarkup] = useState<string>("");
	const [shippingFlat,   setShippingFlat]   = useState<string>("");
	const [feesSaved, setFeesSaved] = useState(false);

	// Sync fetched values into inputs on first load
	const commissionValue = commissionPct !== "" ? commissionPct : platformSettings ? String(Math.round(platformSettings.sellerCommissionPct * 100)) : "";
	const marketplaceValue = marketplaceFee !== "" ? marketplaceFee : platformSettings ? String(Math.round(platformSettings.buyerMarketplaceFee * 100)) : "";
	const shippingMarkupValue = shippingMarkup !== "" ? shippingMarkup
		: platformSettings ? String(Math.round((platformSettings.shippingMarkupPct ?? 0.15) * 100)) : "";
	const shippingFlatValue = shippingFlat !== "" ? shippingFlat
		: platformSettings ? String(platformSettings.shippingFlatRateCents ?? 899) : "";

	const handleSaveFees = () => {
		const commission = parseFloat(commissionValue) / 100;
		const fee        = parseFloat(marketplaceValue) / 100;
		const markup     = parseFloat(shippingMarkupValue) / 100;
		const flatRate   = parseInt(shippingFlatValue, 10);
		if (isNaN(commission) || isNaN(fee) || isNaN(markup) || isNaN(flatRate)) return;
		updateSettings.mutate(
			{ sellerCommissionPct: commission, buyerMarketplaceFee: fee, shippingMarkupPct: markup, shippingFlatRateCents: flatRate },
			{ onSuccess: () => { setFeesSaved(true); setTimeout(() => setFeesSaved(false), 2000); } }
		);
	};

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

			{/* Fee Configuration */}
			<div style={{
				background: "#fff", border: "1px solid #e8e8e8",
				borderRadius: 16, padding: 24, marginTop: 16,
				boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
				animation: "fadeIn 0.5s ease 0.15s backwards",
			}}>
				<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #f1f5f9" }}>
					<div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0,212,182,0.1)", border: `1.5px solid ${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
						<DollarSign size={18} color={ACCENT} strokeWidth={2.5} />
					</div>
					<h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>
						Fee Configuration
					</h3>
				</div>
				<div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
					<div style={{ flex: 1, minWidth: 200 }}>
						<label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
							Seller Commission (%)
						</label>
						<p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Platform cut taken from each seller payout</p>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<input
								type="number" min="0" max="100" step="0.5"
								value={commissionValue}
								onChange={(e) => setCommissionPct(e.target.value)}
								style={{ width: 80, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center" }}
							/>
							<span style={{ fontSize: 14, color: "#64748b" }}>%</span>
						</div>
					</div>
					<div style={{ flex: 1, minWidth: 200 }}>
						<label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
							Buyer Marketplace Fee (%)
						</label>
						<p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Fee added to buyer checkout total</p>
						<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
							<input
								type="number" min="0" max="100" step="0.5"
								value={marketplaceValue}
								onChange={(e) => setMarketplaceFee(e.target.value)}
								style={{ width: 80, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center" }}
							/>
							<span style={{ fontSize: 14, color: "#64748b" }}>%</span>
						</div>
					</div>
					<div style={{ flex: "0 0 100%", marginTop: 16 }}>
						<div style={{ display: "flex", gap: 24 }}>
							<div style={{ flex: 1, minWidth: 200 }}>
								<label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
									Shipping Markup (%)
								</label>
								<p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>% added on top of EasyPost carrier rate</p>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<input
										type="number" min="0" max="200" step="1"
										value={shippingMarkupValue}
										onChange={(e) => setShippingMarkup(e.target.value)}
										style={{ width: 80, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center" }}
										placeholder="15"
									/>
									<span style={{ fontSize: 14, color: "#64748b" }}>%</span>
								</div>
							</div>
							<div style={{ flex: 1, minWidth: 200 }}>
								<label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
									Shipping Fallback Rate (cents)
								</label>
								<p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Used when seller address or EasyPost is unavailable</p>
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<input
										type="number" min="0" step="1"
										value={shippingFlatValue}
										onChange={(e) => setShippingFlat(e.target.value)}
										style={{ width: 100, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600, textAlign: "center" }}
										placeholder="899"
									/>
									<span style={{ fontSize: 14, color: "#64748b" }}>¢</span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
					<Button
						color="primary"
						onPress={handleSaveFees}
						isLoading={updateSettings.isPending}
						style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, background: feesSaved ? "#22c55e" : ACCENT, color: "#020a0a", border: "none" }}
					>
						{feesSaved ? "Saved!" : "Save Fees"}
					</Button>
				</div>
			</div>

			{/* Listing Scoring Weights */}
			<div style={{
				background: "#fff", border: "1px solid #e8e8e8",
				borderRadius: 16, padding: 24, marginTop: 16,
				boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
				animation: "fadeIn 0.5s ease 0.2s backwards",
			}}>
				<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "2px solid #f1f5f9" }}>
					<div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(139,92,246,0.1)", border: "1.5px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
						<SlidersHorizontal size={18} color="#8b5cf6" strokeWidth={2.5} />
					</div>
					<h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, textTransform: "uppercase" }}>
						Listing Scoring Weights
					</h3>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
					{(
						[
							{ key: "recencyWeight", label: "Recency Weight", description: "How much to favor newer listings" },
							{ key: "relevanceWeight", label: "Relevance Weight", description: "How much to favor category-matching listings" },
							{ key: "trustWeight", label: "Trust Weight", description: "How much to favor verified sellers" },
							{ key: "priceWeight", label: "Price Weight", description: "How much to favor competitively priced listings" },
						] as const
					).map(({ key, label, description }) => (
						<div key={key}>
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
								<div>
									<div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</div>
									<div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{description}</div>
								</div>
								<span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", minWidth: 36, textAlign: "right" }}>
									{weights[key].toFixed(2)}
								</span>
							</div>
							<input
								type="range"
								min={0}
								max={1}
								step={0.05}
								value={weights[key]}
								onChange={(e) => setWeights((w) => ({ ...w, [key]: parseFloat(e.target.value) }))}
								style={{ width: "100%", accentColor: "#8b5cf6" }}
							/>
						</div>
					))}
				</div>

				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Total:</span>
						<span style={{
							fontSize: 14, fontWeight: 700,
							color: weightsSumValid ? "#22c55e" : "#ef4444",
						}}>
							{weightsSum.toFixed(2)}
						</span>
						{!weightsSumValid && (
							<span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
								Must equal 1.00
							</span>
						)}
					</div>
					<Button
						color="primary"
						onPress={handleSaveWeights}
						isLoading={weightsSaving}
						isDisabled={!weightsSumValid}
						style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, background: weightsSaved ? "#22c55e" : "#8b5cf6", color: "#fff", border: "none" }}
					>
						{weightsSaved ? "Saved!" : "Save Weights"}
					</Button>
				</div>
			</div>
		</div>
	);
}
