import { Button } from "../../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "../icons/google";
import { fetchFromBackend } from "@/lib/helper";
import { errorToast } from "../other/toaster";
import { useBreakpoint } from "@/hooks/use-mobile";

export default function GoogleButton({
  router,
  action,
  isLoading,
  setIsLoading,
  setUser,
}) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      try {
        setIsLoading(true);
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          body: JSON.stringify({ code, mode: "popup" }),
        });

        const data = await res.json();
        !res.ok
          ? errorToast("Google login gagal!", `${data.message}`)
          : setTimeout(() => {
              setUser(data.user);
              router.push("/dashboards");
            }, 500);
      } catch {
        errorToast("Google login gagal!");
      } finally {
        setIsLoading(false);
      }
    },
    flow: "auth-code",
    onError: () => errorToast("Google login gagal!"),
    ux_mode: isMobile ? "redirect" : "popup",
    redirect_uri: isMobile
      ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/google-callback`
      : undefined,
  });

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full cursor-pointer"
      onClick={() => {
        googleLogin();
      }}
      disabled={isLoading}
    >
      <GoogleIcon className="h-5 w-5 mr-2" />
      {isLoading ? "Memproses..." : `${action} dengan Gmail`}
    </Button>
  );
}
