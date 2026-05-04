import { Compass } from "lucide-react";

export function SidebarLink({ context }: { context: { companyPrefix?: string } }) {
  const href = context.companyPrefix ? `/${context.companyPrefix}/plugins/compass` : "#";
  const isActive =
    typeof window !== "undefined" && window.location.pathname.endsWith("/plugins/compass");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (href !== "#") window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-none text-sm ${
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "bg-sidebar text-sidebar-foreground hover:opacity-80"
      }`}
    >
      <Compass size={16} />
      <span>Compass</span>
    </a>
  );
}
