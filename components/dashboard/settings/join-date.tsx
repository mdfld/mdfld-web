"use client";

import React from "react";

interface JoinDateProps {
	createdAt: string | Date;
	className?: string;
}

export const JoinDate: React.FC<JoinDateProps> = ({ createdAt, className }) => {
	const formatJoinDate = (date: string | Date) => {
		const joinDate = new Date(date);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - joinDate.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		const options: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
		};

		const formattedDate = joinDate.toLocaleDateString(undefined, options);

		if (diffDays < 30) {
			return `Joined ${formattedDate} (${diffDays} days ago)`;
		} else {
			return `Joined ${formattedDate}`;
		}
	};

	return (
		<div className={className}>
			<p className="text-sm font-normal">{formatJoinDate(createdAt)}</p>
		</div>
	);
};
