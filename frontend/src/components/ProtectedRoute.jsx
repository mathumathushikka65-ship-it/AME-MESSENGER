
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("ameToken");

  return token ? <Outlet /> : <Navigate to="/Login" replace />;
}
