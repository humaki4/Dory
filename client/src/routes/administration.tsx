import AdministrationView from "@/features/administration/AdministrationView";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchAuthSession } from "@/features/auth/hooks/useAuthSession";

export const Route = createFileRoute("/administration")({
  beforeLoad: async () => {
    const session = await fetchAuthSession();

    if (!session.authenticated) {
      throw redirect({
        to: "/",
      });
    }

    if (!session.permissions.administration) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <AdministrationView />;
}
