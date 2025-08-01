// Admin OTAA page - halaman untuk kelola firmware management
// Features: firmware list, firmware upload, delete firmware, download firmware
import AdminOTAALayout from "./_layout";

export const metadata = {
  title: "OTAA - MiSREd-IoT",
  description: "Halaman admin kelola firmware OTAA MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-4 sm:px-8 py-2 no-scrollbar overflow-x-hidden h-full">
      <AdminOTAALayout />
    </div>
  );
}
