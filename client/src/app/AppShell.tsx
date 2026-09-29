import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import {
  getProviderLabel,
  startProviderLogin,
  useAuthProvider,
  useAuthSession,
  useLogout,
} from "@/features/auth/hooks/useAuthSession";
import styles from "./AppShell.module.css";
import { Button, IconButton } from "@/shared/components/Button";
import { useTheme } from "./useTheme";

export function AppShell() {
  const { data: session } = useAuthSession();
  const { data: authProvider } = useAuthProvider();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const provider = authProvider?.provider || "github";
  const providerLabel = getProviderLabel(provider);
  const { theme, toggleTheme } = useTheme();
  const isWorkspace = useRouterState({
    select: (state) => state.location.pathname.startsWith("/documents"),
  });

  return (
    <div className={styles.app} data-workspace={isWorkspace || undefined}>
      <header className={styles.header}>
        <nav className={styles.navigation} aria-label="Primary navigation">
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">🐠</span>
            <span className={styles.brandText}>Dory</span>
          </Link>
          <Link to="/documents" className={styles.navLink}>Documents</Link>
          {session?.permissions.administration ? (
            <Link to="/administration" className={styles.navLink}>
              Administration
            </Link>
          ) : null}
        </nav>

        <div className={styles.account}>
          <IconButton
            aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Use ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>
          {session?.authenticated ? (
            <>
              <span className={styles.accountName}>
                {session.user?.displayName || session.user?.username}
              </span>
              <Button
                variant="ghost"
                size="small"
                onClick={() => logout()}
                disabled={isLoggingOut}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="small"
              onClick={() => startProviderLogin(provider)}
            >
              Login with {providerLabel}
            </Button>
          )}
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
