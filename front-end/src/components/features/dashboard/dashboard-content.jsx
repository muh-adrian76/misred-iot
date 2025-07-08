import SwapyDragArea from "@/components/custom/widgets/swapy";
import WidgetBox from "@/components/custom/widgets/widget-box";
import { motion } from "framer-motion";
import { useBreakpoint } from "@/hooks/use-mobile";

export default function DashboardContent(props) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const {
    dashboards,
    isLoadingWidget,
    activeTab,
    widgetCount,
    tabItems,
    setItemsForTab,
    tabLayouts,
    setLayoutsForTab,
    isEditing,
    handleChartDrop,
  } = props;

  if (dashboards.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-100"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          <h2 className="text-xl font-semibold">Selamat Datang!</h2>
          <span className="text-muted-foreground text-balance">
            Buat atau pilih dashboard untuk memantau atau mengendalikan
            perangkat IoT mu.
          </span>
        </div>
      </motion.div>
    );
  }

  if (isLoadingWidget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
        className="flex items-center justify-center h-100"
      >
        <span className="text-muted-foreground">Memuat data widget...</span>
      </motion.div>
    );
  }

  return (
    <>
      {activeTab && !isEditing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
          className="flex items-center justify-center h-100"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <h3 className="text-lg font-semibold mx-10">Widget masih kosong</h3>
            <p>
              Aktifkan mode <i>Edit</i> terlebih dahulu.
            </p>
          </div>
        </motion.div>
      )}
      {activeTab && isEditing && (
        <div className="flex flex-col lg:flex-row h-full gap-4 w-full pl-4 pr-4 lg:pr-5.5">
          {/* Drag & Drop di kiri */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
            >
              <SwapyDragArea
                items={tabItems[activeTab] || []}
                setItems={setItemsForTab}
                layouts={{ lg: tabLayouts[activeTab] || [] }}
                setLayouts={(layouts) => setLayoutsForTab(layouts.lg || [])}
                onChartDrop={handleChartDrop}
              />
            </motion.div>
          </div>
          {/* WidgetBox di kanan */}
          <div className="w-full lg:w-[325px]">
            <WidgetBox isMobile={isMobile} />
          </div>
        </div>
      )}
    </>
  );
}
