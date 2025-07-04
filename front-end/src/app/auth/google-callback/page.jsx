"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/helper";
import { errorToast } from "@/components/custom/other/toaster";
import { useUser } from "@/providers/user-provider";

export default function Page() {
  const query = useSearchParams();
  const router = useRouter();
  const { setUser } = useUser();

  useEffect(() => {
    const fetchCode = async () => {
      const code = query.get("code");
      try {
        const res = await fetchFromBackend("/auth/google", {
          method: "POST",
          body: JSON.stringify({ code, mode: "redirect" }),
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
    };
    fetchCode();
  }, [router, query, setUser]);

  return <div className="flex justify-center items-center h-screen">Memproses login Google...</div>;
}
