import { useState, useCallback } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, signUp, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [orgName, setOrgName] = useState("");

  // For module-level development, skip login and go directly to home
  // Authentication will be enforced at the full program level
  return <Navigate to="/" replace />;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        if (mode === "login") {
          if (!email || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
          }
          const success = await signIn(email, password);
          if (success) {
            const from = (location.state as any)?.from?.pathname || "/";
            navigate(from);
          } else {
            setError("Invalid credentials. Please try again.");
          }
        } else {
          if (!email || !password || !username || !orgName) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
          }
          if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            setLoading(false);
            return;
          }
          const success = await signUp(email, password, username, orgName);
          if (success) {
            const from = (location.state as any)?.from?.pathname || "/";
            navigate(from);
          } else {
            setError("Failed to create account. Please try again.");
          }
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [
      email,
      password,
      username,
      orgName,
      mode,
      signIn,
      signUp,
      navigate,
      location,
    ],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cyan-950 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-cyan-500/25 bg-slate-950/80 backdrop-blur-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-cyan-400">
            Echo Recipe Pro
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to your account"
              : "Create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || authLoading}
                className="border-cyan-500/30 bg-slate-900/70 text-cyan-100 placeholder-cyan-400/50"
              />
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading || authLoading}
                    className="border-cyan-500/30 bg-slate-900/70 text-cyan-100 placeholder-cyan-400/50"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="orgName" className="text-sm font-medium">
                    Organization Name
                  </label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="My Restaurant"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={loading || authLoading}
                    className="border-cyan-500/30 bg-slate-900/70 text-cyan-100 placeholder-cyan-400/50"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => navigate("/password-reset")}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || authLoading}
                className="border-cyan-500/30 bg-slate-900/70 text-cyan-100 placeholder-cyan-400/50"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {loading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-cyan-200/60">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
