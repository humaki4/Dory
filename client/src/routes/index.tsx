import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  getProviderLabel,
  startProviderLogin,
  useAuthProvider,
  useAuthSession,
} from "@/features/auth/hooks/useAuthSession";
import { fetchAuthSession } from "@/features/auth/hooks/useAuthSession";
import { Button } from "@/shared/components/Button";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await fetchAuthSession();

    if (session.authenticated) {
      throw redirect({ to: "/documents" });
    }
  },
  component: IndexPage,
});

function IndexPage() {
  const { isLoading } = useAuthSession();
  const { data: authProvider, isLoading: isProviderLoading } =
    useAuthProvider();

  const provider = authProvider?.provider || "github";
  const providerLabel = getProviderLabel(provider);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome to docAtlas</h1>
        <p className={styles.description}>
          Sign in with {providerLabel} to continue and use your provider
          permissions.
        </p>

        {isLoading ? <p className={styles.status}>Checking session...</p> : null}
        {isProviderLoading ? <p className={styles.status}>Loading authentication provider...</p> : null}

        <Button
          className={styles.login}
          variant="primary"
          onClick={() => startProviderLogin(provider)}
          disabled={isProviderLoading}
        >
          Login with {providerLabel}
        </Button>
      </div>
    </div>
  );
}
