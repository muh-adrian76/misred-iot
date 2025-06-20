import { Button } from "../ui/button";
import { useGoogleLogin } from "@react-oauth/google";
import { GoogleIcon } from "../icons/google";
import { fetchFromBackend } from "@/lib/helper";
import { showToast } from "../features/toaster";

export default function GoogleButton({router, action, isLoading, setIsLoading, setUser}) {
  // Google login handler
  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      try {
        setIsLoading(true);
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        !res.ok
          ? showToast("error", "Google login gagal!", `${data.message}`)
          : setTimeout(() => {
              setUser(data.user);
              router.push("/dashboards");
            }, 500);
      } catch {
        showToast("error", "Google login gagal!");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error("Google login gagal!"),
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
