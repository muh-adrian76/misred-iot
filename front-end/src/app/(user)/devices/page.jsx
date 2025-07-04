import DeviceLayout from "./_layout";

export const metadata = {
  title: "Devices - MiSREd-IoT",
  description: "Halaman dashboard user MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-8 py-2 no-scrollbar overflow-y-auto h-full">
      <DeviceLayout />
    </div>
  );
}
