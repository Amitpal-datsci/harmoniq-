import HarmonicDashboard from "@/app/page";

export default async function WorkspacePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  return <HarmonicDashboard initialWorkspaceSlug={slug} />;
}
