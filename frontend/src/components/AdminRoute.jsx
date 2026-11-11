
import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  let adminUser = null;
  const adminToken = localStorage.getItem("ameAdminToken");

  try {
    adminUser = JSON.parse(
      localStorage.getItem("ameAdminUser")
    );
  } catch (error) {
    adminUser = null;
  }

  // Admin login illai endral Admin Login page-ku anuppum
  if (
    !adminToken ||
    !adminUser ||
    adminUser.role !== "admin"
  ) {
    return <Navigate to="/AdminLogin" replace />;
  }

  return <Outlet />;
}
