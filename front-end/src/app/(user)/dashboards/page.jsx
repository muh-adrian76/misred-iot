import DashboardLayout from "./_layout";

export const metadata = {
  title: "Dashboards - MiSREd-IoT",
  description: "Halaman dashboard user MiSREd-IoT",
};

export default function DashboardsPage() {
  return (
    <div className="px-4 space-y-4 faded-bottom no-scrollbar max-lg:pb-18 pb-9">
      <DashboardLayout />
    </div>
  );
}
