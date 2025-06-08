import { Link, useLocation } from "react-router-dom";
import { IconType } from "react-icons";

interface SidebarLinkProps {
  title: string;
  link: string;
  icon: IconType;
  reload?: boolean;
  isCollapsed?: boolean;
  onContract?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  title,
  link,
  icon: Icon,
  reload = false,
  isCollapsed = false,
  onContract,
}: SidebarLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === link;

  return (
    <li>
      <Link
        to={link}
        reloadDocument={reload}
        onClick={onContract}
        className={`flex items-center text-base rounded-lg ${
          isCollapsed ? "px-2" : "px-4"
        } py-2 text-[var(--primary)] hover:bg-[var(--hover)] cursor-pointer ${
          isActive ? "text-[var(--primary-active)]" : ""
        }`}
      >
        <Icon
          className={`w-6 h-6 ${isActive ? "opacity-100" : "opacity-75"}`}
        />
        {!isCollapsed && <span className="font-medium ml-2">{title}</span>}
      </Link>
    </li>
  );
};

export default SidebarLink;
