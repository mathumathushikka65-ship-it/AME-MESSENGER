
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("ameToken"))
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(
        Boolean(localStorage.getItem("ameToken"))
      );
    };

    checkAuth();

    window.addEventListener("pageshow", checkAuth);
    window.addEventListener("popstate", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("pageshow", checkAuth);
      window.removeEventListener("popstate", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, [location.pathname, location.key]);

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/Login" replace />;
}


