import { useState, useEffect } from "react";
import { IoIosLogOut } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { signOut, fetchUserAttributes } from "aws-amplify/auth";
// import { TenantStorage } from "../../../utils/authStorage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Button } from "../../ui/button";

interface ProfileBadgeProps {
  isCollapsed?: boolean;
}

const ProfileBadge = ({ isCollapsed }: ProfileBadgeProps) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    tenantName: "",
    tenantId: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserData() {
      try {
        const attributes = await fetchUserAttributes();
        setUserData({
          firstName: attributes.given_name || "",
          lastName: attributes.family_name || "",
          tenantName: "",
          tenantId: "",
        });
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }

    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // TenantStorage.clearStoredData();
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex flex-col-reverse items-center text-[var(--primary)]">
      {!isCollapsed ? (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="profile" className="border-none">
            <AccordionContent className="w-full flex flex-col gap-2">
              <Button
                variant="ghost"
                className="justify-start w-full text-[var(--primary)] hover:bg-[var(--sidebar-link-hover)] cursor-pointer py-2"
                onClick={() => navigate("/profile")}
              >
                Profile
              </Button>
              <Button
                variant="ghost"
                className="justify-start w-full text-[var(--primary)] hover:bg-[var(--sidebar-link-hover)] cursor-pointer py-2"
                onClick={() =>
                  window.open(
                    "https://main.d1hf59qn1zcqrt.amplifyapp.com/",
                    "_blank",
                  )
                }
              >
                Help & Docs
              </Button>
              <Button
                variant="ghost"
                className="justify-start w-full text-red-600 hover:bg-[var(--sidebar-link-hover)] hover:text-red-600 cursor-pointer py-2"
                onClick={handleLogout}
              >
                <IoIosLogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </AccordionContent>
            <AccordionTrigger
              className={`flex items-center gap-2 text-[var(--primary)]focus:outline-none ${isCollapsed
                ? "justify-center px-2 py-2"
                : "px-4 py-2 justify-between"
                }`}
            >
              <div className="flex items-center gap-2">
                <img
                  src={`https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full bg-center object-cover shrink-0"
                />
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-xs font-light truncate">
                    {`${userData.firstName} ${userData.lastName}`.trim() ||
                      "User Name"}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {userData.tenantName}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
          </AccordionItem>
        </Accordion>
      ) : (
        <div className="flex items-center justify-center px-2 py-2">
          <img
            src={`https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}`}
            alt="Profile"
            className="h-8 w-8 rounded-full bg-center object-cover"
            style={{
              maxWidth: "none",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileBadge;
