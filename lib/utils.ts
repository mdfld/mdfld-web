import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getViewByPath(
	viewPaths: Record<string, string>,
	path?: string,
) {
	if (!path) return undefined;

	return Object.entries(viewPaths).find(([_, value]) => value === path)?.[0];
}

export async function fetchUserCount() {
	try {
		const response = await fetch("/api/meta/userCount");
		if (!response.ok) throw new Error("Failed to fetch");
		const data = await response.json();
		return data.userCount;
	} catch (err) {
		return `Error fetching user count: ${err}`;
	} finally {
	}
}

export async function fetchProductCount() {
	try {
		const response = await fetch("/api/meta/productCount");
		if (!response.ok) throw new Error("Failed to fetch");
		const data = await response.json();
		return data.productCount;
	} catch (err) {
		return `Error fetching user count: ${err}`;
	} finally {
	}
}

export async function fetchOrgCount() {
	try {
		const response = await fetch("/api/meta/orgCount");
		if (!response.ok) throw new Error("Failed to fetch");
		const data = await response.json();
		return data.orgCount;
	} catch (err) {
		return `Error fetching user count: ${err}`;
	} finally {
	}
}
