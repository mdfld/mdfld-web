import { getOrganizationBySlug } from "@/lib/organization-utils";
import { notFound } from "next/navigation";
import { OrganizationProfileContent } from "./organization-profile-content";

interface OrganizationPageProps {
  params: Promise<{
    organization: string;
  }>;
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { organization: slug } = await params;

  if (!slug) {
    notFound();
  }

  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    notFound();
  }

  return <OrganizationProfileContent organization={organization} />;
}

export async function generateMetadata({ params }: OrganizationPageProps) {
  const { organization: slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) {
    return {
      title: "Store Not Found",
    };
  }

  return {
    title: `${organization.name} - Midfield Co`,
    description:
      organization.description ||
      `Shop from ${organization.name} on Midfield Co`,
  };
}
