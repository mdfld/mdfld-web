import React, { useEffect, useState } from "react";

export default function UserCount() {
	const [count, setCount] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchUserCount() {
			try {
				const response = await fetch("/api/meta/orgCount");
				if (!response.ok) throw new Error("Failed to fetch");
				const data = await response.json();
				setCount(data.userCount);
			} catch (err) {
				setError(`Error fetching user count: ${err}`);
			} finally {
				setLoading(false);
			}
		}

		fetchUserCount();
	}, []);

	if (loading) return <div>?</div>;
	if (error) return <div>{error}</div>;

	return <div>{count}</div>;
}
