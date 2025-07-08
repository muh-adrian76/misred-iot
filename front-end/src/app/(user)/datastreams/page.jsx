import DatastreamLayout from "./_layout";

export const metadata = {
  title: "Datastreams - MiSREd-IoT",
  description: "Halaman datastream user MiSREd-IoT",
};

export default async function Page() {
  return (
    <div className="px-8 py-2 no-scrollbar overflow-y-auto h-full">
      <DatastreamLayout />
    </div>
  );
}
