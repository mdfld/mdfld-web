import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#020606", minHeight: "100vh" }}>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
