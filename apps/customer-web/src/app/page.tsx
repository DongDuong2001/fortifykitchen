import { MenuItem } from "@fortifykitchen/types";
import CustomerPortalClient from "@/features/home/CustomerPortalClient";

export const dynamic = 'force-dynamic';

async function getMenuItems(apiUrl: string): Promise<MenuItem[]> {
  try {
    const res = await fetch(`${apiUrl}/menu`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch (error) {
    console.error("Error fetching menu on server:", error);
    return [];
  }
}

async function getSubscriptionPlans(apiUrl: string): Promise<any[]> {
  try {
    const res = await fetch(`${apiUrl}/subscription-plans/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch (error) {
    console.error("Error fetching plans on server:", error);
    return [];
  }
}

async function getHomeFrames(apiUrl: string): Promise<any[]> {
  try {
    const res = await fetch(`${apiUrl}/home-frames`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data || []).filter((f: any) => f.isActive);
  } catch (error) {
    console.error("Error fetching home-frames on server:", error);
    return [];
  }
}

export default async function CustomerPortalPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch concurrently
  const [menuItems, subscriptionPlans, homeFrames] = await Promise.all([
    getMenuItems(apiUrl),
    getSubscriptionPlans(apiUrl),
    getHomeFrames(apiUrl),
  ]);

  return (
    <CustomerPortalClient
      initialMenuItems={menuItems}
      initialSubscriptionPlans={subscriptionPlans}
      initialHomeFrames={homeFrames}
    />
  );
}