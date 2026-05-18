import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "../features/indicacao/AppContext";
import { Sidebar } from "../features/indicacao/components/Sidebar";
import { OnboardingPage } from "../features/indicacao/pages/OnboardingPage";
import { AnnouncementPopup } from "../features/indicacao/components/AnnouncementPopup";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, authLoading } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/" });
  }, [authLoading, user, navigate]);

  if (authLoading && !user) {
    return <div className="min-h-screen bg-[#0a0a0a]" />;
  }

  if (!user) return null;

  if (!user.onboardingCompleted) {
    return <OnboardingPage />;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#0a0a0a]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 min-w-0 max-w-full overflow-x-hidden p-3 sm:p-6 lg:p-8 max-lg:pt-16">
        <Outlet />
      </main>
      <AnnouncementPopup />
    </div>
  );
}
