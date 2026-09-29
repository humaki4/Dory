import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./Breadcrumb";

interface PathBreadcrumbProps {
  path?: string;
}

const PathBreadcrumb = ({ path }: PathBreadcrumbProps) => {
  const pathSegments = path ? path.split("/").filter(Boolean) : [];

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink>
          <Link to="/">Home</Link>
        </BreadcrumbLink>
        <BreadcrumbSeparator />
      </BreadcrumbItem>
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;

        return (
          <BreadcrumbItem key={`${segment}-${index}`}>
            {isLast ? (
              <BreadcrumbPage>{segment}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink>
                  <Link
                    to="/documents/$"
                    params={{
                      _splat: pathSegments.slice(0, index + 1).join("/"),
                    }}
                  >
                    {segment}
                  </Link>
                </BreadcrumbLink>
                <BreadcrumbSeparator />
              </>
            )}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

export default PathBreadcrumb;
