import { useEffect } from "react";
import { useRouter } from "next/router";
import { fetchFromBackend } from "@/lib/helper";
import { errorToast } from "@/components/custom/other/toaster";
import { useUser } from "@/providers/user-provider";

export default function Page() {
  const router = useRouter();
  const { setUser } = useUser();

  useEffect(async () => {
    const code = router.query.code;
    try {
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
  }, [router]);

  return <div>Memproses login Google...</div>;
}
