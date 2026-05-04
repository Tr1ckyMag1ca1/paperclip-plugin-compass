import { Compass } from "lucide-react";

export function SidebarLink({ context }: { context: { companyPrefix?: string } }) {
  const href = context.companyPrefix ? `/${context.companyPrefix}/compass` : "#";
  const isActive =
    typeof window !== "undefined" && window.location.pathname.endsWith("/compass");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (href !== "#") window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-zinc-800 ${
        isActive ? "bg-zinc-800 text-white" : "text-zinc-400"
      }`}
    >
      <Compass size={16} />
      <span>Compass</span>
    </a>
  );
}
