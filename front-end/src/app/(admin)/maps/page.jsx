import AdminMapsLayout from "./_layout";

export const metadata = {
  title: "Admin Maps - MiSREd-IoT",
  description: "Halaman admin peta lokasi device MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-8 py-2 no-scrollbar overflow-x-hidden h-full">
      <AdminMapsLayout />
    </div>
  );
}
