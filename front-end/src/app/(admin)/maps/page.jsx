// Admin Maps page - halaman peta untuk monitoring lokasi dan distribusi device
// Features: geographic device visualization, location-based analytics, device mapping
import AdminMapsLayout from "./_layout";

export const metadata = {
  title: "Maps - MiSREd-IoT",
  description: "Halaman admin peta lokasi device MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-4 sm:px-8 py-2 no-scrollbar overflow-x-hidden h-full">
      <AdminMapsLayout />
    </div>
  );
}
