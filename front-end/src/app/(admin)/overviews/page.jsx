import AdminOverviewsLayout from "./_layout";

export const metadata = {
  title: "Overviews - MiSREd-IoT",
  description: "Halaman admin overviews MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-8 py-2 no-scrollbar overflow-x-hidden h-full">
      <AdminOverviewsLayout />
    </div>
  );
}
