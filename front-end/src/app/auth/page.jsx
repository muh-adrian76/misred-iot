import AuthLayout from "./_layout";

export const metadata = {
  title: "Login - MiSREd-IoT",
  description: "Halaman login MiSREd-IoT",
};

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <AuthLayout />
    </div>
  );
}
