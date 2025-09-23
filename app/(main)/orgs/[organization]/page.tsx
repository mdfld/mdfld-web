export default function OrganizationPage({
  params,
}: {
  params: { organization: string };
}) {
  return (
    <div>
      <h1>Organization: {params.organization}</h1>
    </div>
  );
}
