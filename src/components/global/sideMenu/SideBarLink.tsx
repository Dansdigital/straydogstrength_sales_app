import { Link, useLocation } from "react-router-dom";
import { IconType } from "react-icons";

interface SidebarLinkProps {
  title: string;
  link: string;
  icon: IconType;
  reload?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  title,
  link,
  icon: Icon,
  reload = false,
}: SidebarLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === link;

  return (
    <li>
      <Link
        to={link}
        reloadDocument={reload}
        className={`flex items-center text-[var(--color-text-primary)] rounded-lg px-4 py-2 cursor-pointer ${isActive ? "text-[var(--color-text-primary)]" : ""}`}
      >
        <Icon
          className={`w-6 h-6 ${isActive ? "opacity-100" : "opacity-75"}`}
        />
        <span className="font-medium ml-2 text-[var(--color-text-primary)]">{title}</span>
      </Link>
    </li>
  );
};

export default SidebarLink;
