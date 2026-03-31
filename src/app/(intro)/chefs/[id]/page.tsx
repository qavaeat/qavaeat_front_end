import type { Metadata } from "next";
import ChefProfilePage from "@/components/chef-profile-page";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const chefName = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${chefName} — QavaEat`,
    description: `Explore meals and plans by ${chefName} on QavaEat.`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ChefProfilePage chefId={id} />;
}