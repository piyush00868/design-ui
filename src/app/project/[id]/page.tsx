import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { requireUser } from "@/lib/server/auth";
import { ownedProject } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Editor · DesignDNA`, robots: { index: false }, other: { id: (await params).id } };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/project/${id}`);
  const p = await ownedProject(id, user.id);
  if (!p) notFound();
  return <Editor projectId={id} user={user} />;
}
