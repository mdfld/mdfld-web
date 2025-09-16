import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

export const GameChangerCTA = () => {
	const router = useRouter();

	return (
		<>
			<div className="flex flex-col gap-8 px-4 md:px-20 lg:px-40">
				<div className="flex justify-center align-middle">
					<p className="text-4xl font-bold text-foreground uppercase tracking-wide">
						Game Changers
					</p>
				</div>
				<div className="flex justify-center align-middle">
					<p className="text-foreground text-center">
						Discover new kits, boots, gear, and exclusive releases—hot off the
						press and ready for action.
						<br /> Whether you’re on the pitch or in the stands, this is where
						the new era begins.{" "}
					</p>
				</div>
				<div className="flex justify-center align-middle">
					<Button
						variant="bordered"
						radius="full"
						className="uppercase px-12 border-foreground font-semibold"
						onPress={() => router.push("/shop")}
					>
						shop
					</Button>
				</div>
			</div>
		</>
	);
};
