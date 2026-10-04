import HarmonicDashboard from "@/app/page";

export default async function WorkspaceChannelPage(props: {
  params: Promise<{ slug: string; channelId: string }>;
}) {
  const { slug, channelId } = await props.params;
  return (
    <HarmonicDashboard
      initialWorkspaceSlug={slug}
      initialChannelId={channelId}
    />
  );
}
