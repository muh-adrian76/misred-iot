import UnauthorizedLayout from "./_layout";

export const metadata = {
  title: "401 - Unauthorized",
  description: "Halaman Otorisasi Gagal - MiSREd-IoT",
}

export default function Page() {
  return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-6">
        <UnauthorizedLayout />
      </div>
  );
}
