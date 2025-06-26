import SwapyDragArea from "@/components/custom/widgets/swapy";
import WidgetBox from "@/components/custom/widgets/widget-box";

export default function DashboardContent(props) {
  const {
    noDashboard,
    isLoadingWidget,
    activeTab,
    widgetCount,
    setIsEditing,
    tabItems,
    setItemsForTab,
    tabLayouts,
    setLayoutsForTab,
    isEditing,
    handleChartDrop,
  } = props;

  if (noDashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          <h2 className="text-xl font-semibold">
            Kamu belum menambahkan dashboard
          </h2>
          <span className="text-muted-foreground">
            Buat dashboard untuk memantau atau mengendalikan perangkat IoT mu.
          </span>
        </div>
      </div>
    );
  }

  if (isLoadingWidget) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground">Memuat data widget...</span>
      </div>
    );
  }

  return (
    <>
      {activeTab && !isEditing && (
        <div className="flex flex-1 h-full items-center justify-center">
          <div className="flex flex-col items-center text-center gap-4">
            <h3 className="text-lg font-semibold mx-10">
              Tidak ada widget
            </h3>
            <p>Aktifkan mode <i>Edit</i> terlebih dahulu.</p>
          </div>
        </div>
      )}
      {isEditing && (
        <WidgetBox />
      )}
      {activeTab && isEditing && (
        <SwapyDragArea
          items={tabItems[activeTab] || []}
          setItems={setItemsForTab}
          layouts={{ lg: tabLayouts[activeTab] || [] }}
          setLayouts={(layouts) => setLayoutsForTab(layouts.lg || [])}
          onChartDrop={handleChartDrop}
        />
      )}
    </>
  );
}
