import { Icon } from "@iconify/react";

export const EdgeSection = () => {
	const features = [
		{
			text: "Shipping Worldwide",
			icon: "dashicons:airplane",
		},
		{
			text: "Verification Guarenteed",
			icon: "streamline-ultimate:award-ribbon-star-1-bold",
		},
		{
			text: "On-Time Delivery",
			icon: "solar:box-bold",
		},
		{
			text: "Customer Satisfaction",
			icon: "streamline:like-1-solid",
		},
		{
			text: "Cost Saving",
			icon: "wpf:coins",
		},
	];

	return (
		<>
			<div className="relative w-screen bg-[url('https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqj18jQec3aM5FrSJv4sLkhdU9zcynogVRTpGm1')] bg-cover bg-center">
				<div className="absolute inset-0 backdrop-grayscale-25 backdrop-saturate-100 backdrop-brightness-10 backdrop-contrast-90"></div>
				<div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
				<div className="relative z-10 flex flex-col gap-8 pt-60 mt-30 -mb-20">
					<div className="flex justify-center align-middle">
						<p className="text-4xl font-bold text-foreground uppercase tracking-wide">
							The Edge
						</p>
					</div>
					<div className="flex justify-center align-middle">
						<p className="text-foreground text-center">
							From top-tier products to unmatched customer service, we bring you
							the best of football.
							<br />
							Discover why fans trust us for quality, authenticity, and fast
							delivery.
						</p>
					</div>
					<div className="flex items-center justify-center py-30 gap-20 align-middle">
						{features.map((item, index) => (
							<div
								key={index}
								className="flex items-center tracking-wider text-xs justify-center flex-col gap-8"
							>
								<Icon
									className="justify-center text-center"
									icon={`${item.icon}`}
									width={35}
									color="teal"
									key={index}
								></Icon>
								<p>{item.text}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
};
