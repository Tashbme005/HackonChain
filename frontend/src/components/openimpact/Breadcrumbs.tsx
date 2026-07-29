import { Link } from "@tanstack/react-router";

interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
  className?: string;
}

export function Breadcrumbs({ crumbs, className }: BreadcrumbsProps) {
  return (
    <nav data-mono className={`text-[11px] uppercase tracking-widest text-muted-foreground ${className ?? ""}`}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i}>
            {i > 0 && <span> / </span>}
            {crumb.to && !isLast ? (
              <Link to={crumb.to} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : undefined}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
