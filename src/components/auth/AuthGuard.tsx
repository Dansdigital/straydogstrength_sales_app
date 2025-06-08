import { useEffect, useState, useRef, ReactNode } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const session = await fetchAuthSession();
        if (!session.tokens) {
          if (isMounted.current) {
            setIsAuthenticated(false);
            navigate("/login");
          }
          return;
        }

        if (isMounted.current) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth error:", error);
        if (isMounted.current) {
          setIsAuthenticated(false);
          navigate("/login");
        }
      }
    }

    void checkSession();
  }, [navigate]);

  // Return children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
