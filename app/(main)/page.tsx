"use client";

import { GameChangerCTA } from "@/components/game-changers-cta/page";
import { LineupProductShowcase } from "@/components/lineup-product-showcase/page";
import { EdgeSection } from "@/components/edge-features/page";
import { LatestPosts } from "@/components/blog-cta/page";

export default function Home() {
	return (
		<section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
			<div>
				<LineupProductShowcase></LineupProductShowcase>
			</div>
			<div>
				<GameChangerCTA />
			</div>
			<div>
				<EdgeSection />
			</div>
			<div>
				<LatestPosts />
			</div>
		</section>
	);
}
