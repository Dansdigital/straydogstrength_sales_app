import { MdSpaceDashboard } from "react-icons/md";
import SliderBar from "./FeedbackSlider.tsx";
import { useState } from "react";
import { Box, UserCog } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarLink,
  SidebarProvider,
} from "../../../components/ui/sidebar";
import ProfileBadge from "./ProfileBadge.tsx";

const MainSidebar: React.FC = () => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  const closeSlider = () => setIsSliderOpen(false);

  return (
    <SidebarProvider>
      <Sidebar
        className="border-r border-white bg-black"
      >
        <SidebarHeader className="h-[65px] border-b border-[var(--color-border)]">
          <img src="public/SD_red_header_LOGO.png" alt="straydog" width={100} height={100} />
        </SidebarHeader>

        <SidebarContent>
          <nav className="space-y-1">
            <SidebarLink
              title="Products"
              link="/products"
              icon={Box}
            />
            <SidebarLink
              title="Test"
              link="/test"
              icon={MdSpaceDashboard}
            />
            <SidebarLink
              title="User Management"
              link="/user-management"
              icon={UserCog}
            />
          </nav>
        </SidebarContent>

        <SidebarFooter className="border-t border-[var(--color-border)]">
          <nav className="space-y-1">
            <ProfileBadge />
          </nav>
        </SidebarFooter>

        <SliderBar isOpen={isSliderOpen} onClose={closeSlider} />
      </Sidebar>
    </SidebarProvider>
  );
};

export default MainSidebar;
