import { type FC, useState, useEffect, useRef, type Ref } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, Eye, EyeOff, Loader2, AlertCircle, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginFormValues, useLogin } from "@/features/authentication";

/** Merge a manual ref with a React Hook Form register ref. */
function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref && "current" in ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

const LoginPage: FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginError, clearLoginError } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const loginMutation = useLogin();

  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "mifos",
      password: "password",
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Focus password field on mount
  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleSubmit = form.handleSubmit((values) => {
    clearLoginError();
    loginMutation.mutate(values);
  });

  const usernameError = form.formState.errors.username?.message;
  const passwordError = form.formState.errors.password?.message;
  const displayError = loginError ?? (usernameError || passwordError || null);
  const isSubmitting = form.formState.isSubmitting || loginMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      {/* Background decorative elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#D32F2F]/5 blur-3xl dark:bg-[#D32F2F]/10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#D32F2F]/5 blur-3xl dark:bg-[#D32F2F]/10" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed right-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {/* Logo & branding */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#D32F2F] shadow-lg shadow-[#D32F2F]/25">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">CoreBank</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
          </div>

          {/* Error alert */}
          {displayError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                disabled={isSubmitting}
                className={cn("h-11", displayError && "border-red-300 focus-visible:ring-red-500 dark:border-red-700")}
                {...form.register("username")}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-medium text-[#D32F2F] hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                {(() => {
                  const passwordRegister = form.register("password");
                  return (
                    <Input
                      id="password"
                      {...passwordRegister}
                      ref={mergeRefs(passwordInputRef, passwordRegister.ref)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className={cn(
                        "h-11 pr-10",
                        displayError && "border-red-300 focus-visible:ring-red-500 dark:border-red-700",
                      )}
                    />
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full bg-[#D32F2F] text-white hover:bg-primary-600 dark:bg-[#D32F2F] dark:hover:bg-primary-600"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Demo credentials pre-filled. Use <span className="font-medium text-gray-500 dark:text-gray-400">mifos</span>
            {" / "}
            <span className="font-medium text-gray-500 dark:text-gray-400">password</span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} CoreBank. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
