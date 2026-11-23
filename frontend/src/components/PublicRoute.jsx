import { Navigate, Outlet } from "react-router-dom";

export default function PublicRoute() {
  const token = localStorage.getItem("ameToken");

  if (token) {
    return <Navigate to="/Home" replace />;
  }

  return <Outlet />;
}