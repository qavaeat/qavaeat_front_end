import type { Metadata } from "next";
import KitchenPage from "@/components/user/KitchenPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Kitchen — QavaEat`,
    description: `Browse menu items and meal plans on QavaEat.`,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <KitchenPage businessId={id} />;
}