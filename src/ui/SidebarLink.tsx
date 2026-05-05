import { Compass } from "lucide-react";

export function SidebarLink({ context }: { context: { companyPrefix?: string } }) {
  const href = context.companyPrefix ? `/${context.companyPrefix}/compass` : "#";
  const isActive =
    typeof window !== "undefined" && window.location.pathname.endsWith("/compass");

  return (
    <a
      href={href}
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
