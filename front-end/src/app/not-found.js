import NotFoundLayout from "./404-layout";

export const metadata = {
  title: "404 - Not Found",
  description: "Halaman tidak ditemukan - MiSREd-IoT"
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center p-6">
      <NotFoundLayout />
    </div>
  );
}
