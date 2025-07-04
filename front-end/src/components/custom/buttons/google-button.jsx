import { Button } from "../../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "../icons/google";
import { fetchFromBackend } from "@/lib/helper";
import { errorToast } from "../other/toaster";

export default function GoogleButton({
  router,
  action,
  isLoading,
  setIsLoading,
  setUser,
}) {
  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      try {
        setIsLoading(true);
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          body: JSON.stringify({ code }),
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
        setIsLoading(false);
      }
    },
    flow: "auth-code",
    onError: () => errorToast("Google login gagal!"),
    ux_mode: isMobile ? "redirect" : "popup",
    redirect_uri: isMobile
      ? `${window.location.origin}/google-callback`
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
