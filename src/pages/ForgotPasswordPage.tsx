import { type FC, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LayoutDashboard, Loader2, AlertCircle, CheckCircle2, ArrowLeft, Moon, Sun, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, isSendingReset, resetPasswordSent, resetError, clearResetState, isAuthenticated } =
    useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const emailValue = watch("email");
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      clearResetState();
    };
  }, []);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    await forgotPassword(values.email.trim());
  };

  const handleBackToLogin = () => {
    clearResetState();
    navigate("/login", { replace: true });
  };

  const handleInputChange = () => {
    if (resetError) clearResetState();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#D32F2F]/5 blur-3xl dark:bg-[#D32F2F]/10" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#D32F2F]/5 blur-3xl dark:bg-[#D32F2F]/10" />
      </div>

      <button
        onClick={toggleTheme}
        className="fixed right-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2.5 text-gray-500 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#D32F2F] shadow-lg shadow-[#D32F2F]/25">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">CoreBank</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Reset your password</p>
          </div>

          {resetPasswordSent ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Check your inbox</h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                If an account exists for <span className="font-medium">{emailValue}</span>, we&apos;ve sent a password
                reset link.
              </p>
              <p className="mb-6 text-xs text-gray-400 dark:text-gray-500">
                Didn&apos;t receive it? Check your spam folder or try again.
              </p>
              <Button variant="outline" onClick={handleBackToLogin} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          ) : (
            <>
              {resetError && (
                <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </Label>
                  <div className="relative">
                    <Input
                      id="reset-email"
                      {...register("email")}
                      type="email"
                      placeholder="you@corebank.com"
                      autoComplete="email"
                      disabled={isSendingReset}
                      error={errors.email?.message}
                      className={cn(
                        "h-11 pl-10",
                        resetError && "border-red-300 focus-visible:ring-red-500 dark:border-red-700",
                      )}
                    />
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSendingReset}
                  className="h-11 w-full bg-[#D32F2F] text-white hover:bg-primary-600 dark:bg-[#D32F2F] dark:hover:bg-primary-600"
                >
                  {isSendingReset ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending reset link...
                    </span>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#D32F2F] hover:text-primary-700 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          &copy; {new Date().getFullYear()} CoreBank. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
