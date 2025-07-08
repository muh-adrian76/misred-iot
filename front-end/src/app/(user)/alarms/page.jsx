import AlarmLayout from "./_layout";

export const metadata = {
  title: "Alarms - MiSREd-IoT",
  description:
    "Halaman alarm user MiSREd-IoT",
};

export default function Page() {
  return (
    <div className="px-8 py-2 no-scrollbar overflow-y-auto h-full">
      <AlarmLayout />
    </div>
  )
};