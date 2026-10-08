import { MenuItem } from "@fortifykitchen/types";
import CustomerPortalClient from "@/features/home/CustomerPortalClient";

export const dynamic = 'force-dynamic';

// Check if we're in a build environment
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.NEXT_PHASE === 'phase-production-server' ||
                    !process.env.NEXT_PUBLIC_API_URL;

async function getMenuItems(apiUrl: string): Promise<MenuItem[]> {
  // Skip fetch during build time
  if (isBuildTime) return [];
  
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
  // Skip fetch during build time
  if (isBuildTime) return [];
  
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
  // Skip fetch during build time
  if (isBuildTime) return [];
  
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

  // Skip data fetching during build
  let menuItems: MenuItem[] = [];
  let subscriptionPlans: any[] = [];
  let homeFrames: any[] = [];

  if (!isBuildTime) {
    // Fetch concurrently
    const [menuItemsData, subscriptionPlansData, homeFramesData] = await Promise.all([
      getMenuItems(apiUrl),
      getSubscriptionPlans(apiUrl),
      getHomeFrames(apiUrl),
    ]);
    
    menuItems = menuItemsData;
    subscriptionPlans = subscriptionPlansData;
    homeFrames = homeFramesData;
  }

  return (
    <CustomerPortalClient
      initialMenuItems={menuItems}
      initialSubscriptionPlans={subscriptionPlans}
      initialHomeFrames={homeFrames}
    />
  );
}