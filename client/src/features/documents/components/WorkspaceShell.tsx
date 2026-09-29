import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ListTree, PanelLeft, PanelRight, X } from "lucide-react";
import styles from "./WorkspaceShell.module.css";
import { IconButton } from "@/shared/components/Button";
import UserMenu from "@/features/auth/components/UserMenu";

interface WorkspaceShellProps {
  navigation: ReactNode;
  breadcrumb?: ReactNode;
  search?: ReactNode;
  children: ReactNode;
  inspector?: ReactNode;
  inspectorAvailable?: boolean;
}

const panesOpenByDefault = () =>
  typeof window === "undefined" || window.innerWidth > 960;

export default function WorkspaceShell({
  navigation,
  breadcrumb,
  search,
  children,
  inspector,
  inspectorAvailable = false,
}: WorkspaceShellProps) {
  const [navigationOpen, setNavigationOpen] = useState(panesOpenByDefault);
  const [inspectorOpen, setInspectorOpen] = useState(panesOpenByDefault);
  const showInspector = inspectorAvailable && inspectorOpen;

  return (
    <section
      className={styles.workspace}
      data-navigation-open={navigationOpen}
      data-inspector-open={showInspector}
    >
      <aside className={styles.navigation} aria-label="Dory navigation">
        <div className={styles.paneHeader}>
          <Link to="/documents" className={styles.brand} aria-label="Dory documents">
            <span className={styles.brandMark} aria-hidden="true">🐠</span>
            <span className={styles.brandName}>Dory</span>
          </Link>
          <IconButton
            onClick={() => setNavigationOpen(false)}
            aria-label="Hide repository navigation"
            title="Hide repository navigation"
          >
            <X size={15} />
          </IconButton>
        </div>
        <div className={styles.navigationContent}>{navigation}</div>
        <div className={styles.accountMenu}>
          <UserMenu />
        </div>
      </aside>

      <div className={styles.centerPane}>
        <header className={styles.toolbar}>
          <IconButton
            onClick={() => setNavigationOpen((open) => !open)}
            aria-pressed={navigationOpen}
            aria-label="Toggle repository navigation"
            title="Toggle repository navigation"
          >
            <PanelLeft size={17} />
          </IconButton>
          <div className={styles.breadcrumb}>{breadcrumb}</div>
          <div className={styles.toolbarSearch}>{search}</div>
          <IconButton
            onClick={() => setInspectorOpen((open) => !open)}
            disabled={!inspectorAvailable}
            aria-pressed={showInspector}
            aria-label="Toggle properties"
            title="Toggle properties"
          >
            <PanelRight size={17} />
          </IconButton>
        </header>
        <div className={styles.content}>{children}</div>
      </div>

      <aside className={styles.inspector} aria-label="Document inspector">
        <div className={styles.paneHeader}>
          <div className={styles.inspectorTabs} role="tablist" aria-label="Inspector panels">
            <IconButton
              role="tab"
              aria-selected="true"
              aria-label="Properties"
              title="Properties"
            >
              <ListTree size={16} />
            </IconButton>
          </div>
          <IconButton
            onClick={() => setInspectorOpen(false)}
            aria-label="Hide properties"
            title="Hide properties"
          >
            <X size={15} />
          </IconButton>
        </div>
        <div className={styles.inspectorContent}>{inspector}</div>
      </aside>
    </section>
  );
}
