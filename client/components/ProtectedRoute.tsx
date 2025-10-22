import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiresAuth?: boolean;
}

/**
 * Protects routes by requiring user authentication
 * Redirects to login if user is not authenticated
 * Optionally checks for specific roles
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  requiresAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-cyan-500" />
          <p className="text-sm text-cyan-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && user) {
    const userRole = user.role || "staff";
    if (!requiredRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-cyan-400">Access Denied</h1>
            <p className="text-sm text-cyan-200">
              You do not have permission to access this page.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
