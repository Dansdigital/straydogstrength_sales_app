import { useEffect, useState, useRef } from "react";
import { getCurrentUser, AuthUser, signOut } from "aws-amplify/auth";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { CheckTheme } from "../Theme/ThemeChanger";
import { NavLink } from "react-router-dom";

export default function Layout() {
  CheckTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const isAuthRoute = [
    "/login",
    "/signup",
    "/confirm-signup",
    "/forgot-password",
  ].includes(location.pathname);

  useEffect(() => {
    let mounted = true;

    async function checkUser() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          console.log('Current User Session:', {
            username: currentUser.username,
            userId: currentUser.userId,
            signInDetails: currentUser.signInDetails,
            groups: currentUser.signInDetails?.loginId?.split('@')[0] === 'admin' ? ['Admin'] : ['Customer']
          });
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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isAuthRoute) {
    return <Outlet />;
  }

  function LayoutDisplay() {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img
                src="/SD_red_header_LOGO.png"
                alt="Stray Dog Strength Logo"
                className="w-[300px]"
              />
            </div>

            {/* Navigation Menu */}
            <nav className="flex items-center gap-8">
              <NavLink to="/products" label="Products" />
              {user?.signInDetails?.loginId?.split('@')[0] === 'admin' && (
                <NavLink to="/user-management" label="User Management" />
              )}
            </nav>

            {/* Sign Out Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-[var(--color-bg-primary)] p-4">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // Navigation Link Component
  function NavLink({ to, label }: { to: string; label: string }) {
    const isActive = location.pathname === to;

    return (
      <div
        className={`
          relative cursor-pointer text-[var(--color-text-primary)] 
          hover:text-[var(--color-primary)] transition-colors duration-200
          ${isActive ? 'text-[var(--color-primary)]' : ''}
        `}
        onClick={() => navigate(to)}
      >
        {label}
      </div>
    );
  }

  return user ? <div ref={componentRef}>{LayoutDisplay()}</div> : null;
}
