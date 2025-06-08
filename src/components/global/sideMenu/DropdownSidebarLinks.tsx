import { Link, useLocation } from "react-router-dom";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IconType } from "react-icons";
import { useState } from "react";

// interface SidebarLink {
//   path: string;
//   title: string;
//   icon?: IconType;
// }

interface DropdownSidebarLinksProps {
  mainTitle: string;
  mainIcon: IconType;
  links: Array<{
    title: string;
    path: string;
    icon: IconType;
  }>;
  reload?: boolean;
  isCollapsed?: boolean;
  onSubLinksClick?: () => void;
  onExpandSidebar?: () => void;
}

const DropdownSidebarLinks: React.FC<DropdownSidebarLinksProps> = ({
  mainTitle,
  mainIcon: MainIcon,
  links,
  reload,
  isCollapsed,
  onSubLinksClick,
  onExpandSidebar,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleClick = () => {
    if (isCollapsed && onExpandSidebar) {
      onExpandSidebar();
      setIsOpen(true);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <li className="relative">
      <button
        onClick={handleClick}
        className={`flex items-center text-base rounded-lg ${
          isCollapsed ? "px-2" : "px-4"
        } py-2 text-[var(--primary)] hover:bg-[var(--hover)]`}
      >
        <MainIcon className="w-6 h-6 opacity-75" />
        {!isCollapsed && (
          <>
            <span className="font-medium flex-1 text-left ml-2">
              {mainTitle}
            </span>
            <span
              className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
            >
              <HiOutlineChevronDown className="w-6 h-6" />
            </span>
          </>
        )}
      </button>

      {!isCollapsed && isOpen && (
        <div className="mt-2 ml-4 space-y-1">
          {links.map((link, index) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={index}
                to={link.path}
                reloadDocument={reload}
                onClick={onSubLinksClick}
                className={`flex items-center text-sm rounded-lg ${
                  isCollapsed ? "px-2" : "px-4"
                } py-2 text-[var(--primary)] hover:bg-[var(--hover)] cursor-pointer ${
                  isActive ? "text-[var(--primary-active)]" : ""
                }`}
              >
                <link.icon
                  className={`w-6 h-6 ${isActive ? "opacity-100" : "opacity-75"}`}
                />
                <span className="font-medium ml-2">{link.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </li>
  );
};

export default DropdownSidebarLinks;
