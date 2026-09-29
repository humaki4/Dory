import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  Separator,
} from "react-aria-components";
import { Check, LogIn, LogOut, Moon, Settings, Sun } from "lucide-react";
import {
  getProviderLabel,
  startProviderLogin,
  useAuthProvider,
  useAuthSession,
  useLogout,
} from "../hooks/useAuthSession";
import { useTheme } from "@/app/useTheme";
import styles from "./UserMenu.module.css";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserMenu() {
  const navigate = useNavigate();
  const { data: session } = useAuthSession();
  const { data: authProvider } = useAuthProvider();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { theme, setTheme } = useTheme();
  const provider = authProvider?.provider || "github";
  const userName = session?.user?.displayName || session?.user?.username || "Guest";
  const initials = useMemo(() => initialsFor(userName) || "D", [userName]);

  return (
    <MenuTrigger>
      <Button className={styles.trigger} aria-label={`Open account menu for ${userName}`}>
        <span className={styles.avatar} aria-hidden="true">{initials}</span>
        <span className={styles.userName}>{userName}</span>
        <Settings className={styles.triggerIcon} aria-hidden="true" />
      </Button>
      <Popover className={styles.popover} placement="top start" offset={6}>
        <Menu className={styles.menu} aria-label="Account and settings">
          <MenuItem className={styles.profile} isDisabled textValue={userName}>
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <span>{userName}</span>
          </MenuItem>
          <Separator className={styles.separator} />

          {session?.permissions.administration ? (
            <MenuItem
              className={styles.menuItem}
              onAction={() => navigate({ to: "/administration" })}
            >
              <Settings aria-hidden="true" />
              <span>Administration</span>
            </MenuItem>
          ) : null}

          <MenuItem className={styles.menuItem} onAction={() => setTheme("light")}>
            <Sun aria-hidden="true" />
            <span>Light theme</span>
            {theme === "light" ? <Check className={styles.check} aria-hidden="true" /> : null}
          </MenuItem>
          <MenuItem className={styles.menuItem} onAction={() => setTheme("dark")}>
            <Moon aria-hidden="true" />
            <span>Dark theme</span>
            {theme === "dark" ? <Check className={styles.check} aria-hidden="true" /> : null}
          </MenuItem>

          <Separator className={styles.separator} />
          {session?.authenticated ? (
            <MenuItem
              className={styles.menuItem}
              isDisabled={isLoggingOut}
              onAction={() => logout()}
            >
              <LogOut aria-hidden="true" />
              <span>{isLoggingOut ? "Logging out…" : "Logout"}</span>
            </MenuItem>
          ) : (
            <MenuItem
              className={styles.menuItem}
              onAction={() => startProviderLogin(provider)}
            >
              <LogIn aria-hidden="true" />
              <span>Login with {getProviderLabel(provider)}</span>
            </MenuItem>
          )}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
