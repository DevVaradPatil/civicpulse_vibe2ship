import { LayoutDashboard } from "lucide-react";
import { PageStub } from "@/components/page-stub";

export default function DashboardPage() {
  return (
    <PageStub icon={LayoutDashboard} title="Impact dashboard" phase="Phase 4">
      Resolution rates, hotspots, and AI-predicted recurring problem areas land
      here.
    </PageStub>
  );
}
