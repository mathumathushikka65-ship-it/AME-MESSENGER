import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  let adminUser = null;
  const adminToken = localStorage.getItem("ameAdminToken");

  try {
    adminUser = JSON.parse(localStorage.getItem("ameAdminUser") || "null");
  } catch {
    adminUser = null;
  }

  if (!adminToken || adminUser?.role !== "admin") {
    return <Navigate to="/Login" replace />;
  }

  return <Outlet />;
}
