"use client";

import {
  AppLayout,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  Navbar,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@fortifykitchen/ui";
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut } from "lucide-react";

export default function DashboardPage() {
  return (
    <AppLayout
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className="text-lg font-bold text-primary">Fortify Admin</div>
          </SidebarHeader>
          <SidebarContent>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Users className="h-4 w-4" />
              Customers
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </SidebarContent>
          <SidebarFooter>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
      }
      navbar={
        <Navbar>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">admin@fortifykitchen.com</span>
          </div>
        </Navbar>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,450.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
