import MainNavbar from "@/components/main-navbar/page";
import MainFooter from "@/components/footer/page";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative w-full flex flex-col h-screen">
			<main className="container mx-auto max-w-full pt-0 px-0 flex-grow overflow-x-hidden">
				<MainNavbar />
				{children}
				<MainFooter />
			</main>
			<footer className="w-full flex items-center justify-center py-3" />
		</div>
	);
}
