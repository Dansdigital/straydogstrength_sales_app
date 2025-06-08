import { MdSpaceDashboard } from "react-icons/md";
import SliderBar from "./FeedbackSlider.tsx";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarLink,
  SidebarProvider,
} from "../../../components/ui/sidebar";
import ProfileBadge from "./ProfileBadge.tsx";

interface MainSidebarProps {
  isCollapsed: boolean;
  onExpand: () => void;
  onContract?: () => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({
  isCollapsed,
  onExpand,
  onContract,
}) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  const closeSlider = () => setIsSliderOpen(false);

  return (
    <SidebarProvider>
      <Sidebar
        className="border-r border-[var(--border-color)] w-full lg:w-auto"
        isCollapsed={isCollapsed}
        onExpand={onExpand}
        onContract={onContract}
      >
        <SidebarHeader className="h-[65px] border-b border-[var(--border-color)]">
          {!isCollapsed && (
            <img src="public/SD_red_header_LOGO.png" alt="straydog" width={100} height={100} />
          )}
          {isCollapsed && (
            <img src="public/tab_logo.png" alt="straydog" width={30} height={30} />
          )}
        </SidebarHeader>

        <SidebarContent>
          <nav className="space-y-1">
            <SidebarLink
              title="Products"
              link="/"
              icon={MdSpaceDashboard}
              isCollapsed={isCollapsed}
              onContract={onContract}
            />
            <SidebarLink
              title="Test"
              link="/test"
              icon={MdSpaceDashboard}
              isCollapsed={isCollapsed}
              onContract={onContract}
            />
          </nav>
        </SidebarContent>

        <SidebarFooter className="border-t border-[var(--border-color)]">
          <nav className="space-y-1">
            <button
              onClick={() => isCollapsed ? onExpand() : onContract?.()}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>Collapse</span>
                </>
              )}
            </button>
            <ProfileBadge isCollapsed={isCollapsed} />
          </nav>
        </SidebarFooter>

        <SliderBar isOpen={isSliderOpen} onClose={closeSlider} />
      </Sidebar>
    </SidebarProvider>
  );
};

export default MainSidebar;
