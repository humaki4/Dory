import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { fetchAuthSession } from "@/features/auth/hooks/useAuthSession";

export const Route = createFileRoute("/documents")({
  beforeLoad: async () => {
    const session = await fetchAuthSession();

    if (!session.authenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: DocumentsLayout,
});

function DocumentsLayout() {
  return <Outlet />;
}
