import AdminUsersLayout from "./_layout";

export const metadata = {
  title: "Users - MiSREd-IoT",
  description: "Halaman admin kelola users MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-8 py-2 no-scrollbar overflow-x-hidden h-full">
      <AdminUsersLayout />
    </div>
  );
}
