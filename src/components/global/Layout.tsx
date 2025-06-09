import { useEffect, useState, useRef } from "react";
import { getCurrentUser, AuthUser } from "aws-amplify/auth";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CheckTheme } from "../Theme/ThemeChanger";
import { CgMenuGridO } from "react-icons/cg";
import MainSidebar from "../global/sideMenu/SideMenu";

export default function Layout() {
  CheckTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const isAuthRoute = [
    "/login",
    "/signup",
    "/confirm-signup",
    "/forgot-password",
  ].includes(location.pathname);

  // Add effect to handle sidebar state based on route
  useEffect(() => {
    if (isMobile) {
      // On mobile, keep the sidebar closed by default
      setIsSidebarOpen(false);
    } else {
      // On desktop, collapse only on search page, expand on other pages
      setIsSidebarOpen(location.pathname !== "/search");
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (mounted) {
          navigate("/login");
        }
      }
    }

    checkUser();

    return () => {
      mounted = false;
    };
  }, [navigate, isAuthRoute]);

  const componentRef = useRef(null);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isAuthRoute) {
    return <Outlet />;
  }

  function LayoutDisplay() {
    return (
      <div className="h-screen flex">
        <div
          className={`h-full m-2 text-2xl text-center ${isSidebarOpen ? "hidden" : "lg:hidden"}`}
        >
          <button
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
            }}
          >
            <CgMenuGridO />
          </button>
        </div>
        {/* Sidebar */}
        <div
          className={`${!isSidebarOpen ? "w-screen lg:w-auto lg:block" : "hidden lg:block"} relative bg-[var(--color-bg-primary)]`}
        >
          <MainSidebar />
        </div>

        {/* Main content */}
        <div
          className={`${!isSidebarOpen ? "hidden lg:block" : "block"} flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]`}
        >
          {/* Outlet content */}
          <main className="flex-1 overflow-auto bg-[var(--color-bg-primary)]">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return user ? <div ref={componentRef}>{LayoutDisplay()}</div> : null;
}
