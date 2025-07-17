import React from "react";
import GridLayout from "@/components/custom/widgets/grid-layout";
import WidgetBox from "@/components/custom/widgets/widget-box";
import { motion } from "framer-motion";
import { TextShimmer } from "@/components/ui/text-shimmer";

export default function DashboardContent(props) {
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
    isMobile,
    isMedium,
    isTablet,
    isDesktop,
    handleChartDrop,
    handleLayoutChange,
    handleBreakpointChange,
    handleAddChart,
    currentBreakpoint,
    layoutKey,
    // Staging functions
    stageWidgetRemoval,
    removeWidgetFromDatabase,
    handleEditWidget,
  } = props;

  // Handler untuk menambah widget dari WidgetBox
  const handleAddWidgetFromBox = (chartType) => {
    // Panggil handleChartDrop untuk menampilkan form widget, bukan langsung tambah ke database
    handleChartDrop(chartType, {
      x: 0,
      y: Infinity,
      w: 3, // Default width
      h: 4, // Default height
    });
  };

  if (dashboards.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-screen"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
          <motion.img
            key="dashboard-image"
            src="/widget.svg"
            alt="No Dashoards"
            className="w-72 h-auto -mb-5 mt-[-50px]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
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
        className="flex items-center justify-center h-screen"
      >
        <TextShimmer className='text-sm' duration={1}>
          Memuat data widget...
        </TextShimmer>
      </motion.div>
    );
  }

  return (
    <>
      {activeTab && !isEditing && widgetCount === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
          className="flex items-center justify-center h-screen"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <motion.img
              key="widget-image"
              src="/widget.svg"
              alt="No Widgets"
              className="w-72 h-auto -mb-5 mt-[-50px]"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <h3 className="text-lg font-semibold mx-10">Widget masih kosong</h3>
            <p>
              Aktifkan mode <i>Edit</i> terlebih dahulu.
            </p>
          </div>
        </motion.div>
      )}

      {/* Tampilkan isi widget jika ada dan tidak sedang edit */}
      {activeTab && !isEditing && widgetCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
          className="p-4"
        >
          <GridLayout
            items={tabItems[activeTab] || []}
            setItems={setItemsForTab}
            layouts={tabLayouts[activeTab] || {}}
            setLayouts={setLayoutsForTab}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            isEditing={false}
            stageWidgetRemoval={stageWidgetRemoval}
            removeWidgetFromDatabase={removeWidgetFromDatabase}
            handleEditWidget={handleEditWidget}
          />
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
              <GridLayout
                items={tabItems[activeTab] || []}
                setItems={setItemsForTab}
                layouts={tabLayouts[activeTab] || {}}
                setLayouts={setLayoutsForTab}
                onChartDrop={handleChartDrop}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                isEditing={true}
                stageWidgetRemoval={stageWidgetRemoval}
                removeWidgetFromDatabase={removeWidgetFromDatabase}
                handleEditWidget={handleEditWidget}
              />
            </motion.div>
          </div>
          <WidgetBox 
            breakpoint={isMobile || isMedium || isTablet} 
            onChartDrag={handleChartDrop}
            onAddWidget={handleAddWidgetFromBox}
          />
        </div>
      )}
    </>
  );
}