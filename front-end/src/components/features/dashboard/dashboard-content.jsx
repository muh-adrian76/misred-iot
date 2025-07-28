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
    currentItems,
    currentLayouts,
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
    currentTimeRange,
    currentDataCount,
    filterType,
    // Staging functions
    stageWidgetRemoval,
    removeWidgetFromDatabase,
    handleEditWidget,
  } = props;

  // Debug logging untuk troubleshooting
  // console.log('DashboardContent render:', {
  //   dashboardsLength: dashboards?.length,
  //   isLoadingWidget,
  //   activeTab,
  //   widgetCount,
  //   isEditing,
  //   tabItemsKeys: Object.keys(tabItems || {}),
  //   tabLayoutsKeys: Object.keys(tabLayouts || {}),
  //   currentItemsLength: currentItems?.length,
  //   currentLayoutsKeys: currentLayouts ? Object.keys(currentLayouts) : [],
  //   currentItemsData: currentItems?.map(item => ({ id: item.id, description: item.description })),
  //   currentLayoutsSample: currentLayouts?.lg?.slice(0, 3) // Show first 3 layout items for lg breakpoint
  // });

  // Handler untuk menambah widget dari WidgetBox
  const handleAddWidgetFromBox = (chartType) => {
    // console.log('Adding widget from widget box:', chartType);
    // Panggil handleChartDrop untuk menampilkan form widget, bukan langsung tambah ke database
    if (handleChartDrop) {
      handleChartDrop(chartType, {
        x: 0,
        y: Infinity,
        w: 6, // Default width yang lebih besar
        h: 4, // Default height
      });
    }
  };

  // Fallback untuk props yang mungkin undefined
  const safeDashboards = dashboards || [];
  const safeTabItems = tabItems || {};
  const safeTabLayouts = tabLayouts || {};

  if (safeDashboards.length === 0) {
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

  // Jika tidak ada activeTab tapi ada dashboard, tampilkan pesan untuk memilih dashboard
  if (!activeTab && safeDashboards.length > 0) {
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
            alt="Select Dashboard"
            className="w-72 h-auto -mb-5 mt-[-50px]"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <h2 className="text-xl font-semibold">Pilih Dashboard</h2>
          <span className="text-muted-foreground text-balance">
            Pilih salah satu dashboard dari tab di atas untuk mulai memantau atau mengendalikan perangkat IoT Anda.
          </span>
        </div>
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
            items={currentItems}
            setItems={setItemsForTab}
            layouts={currentLayouts}
            setLayouts={setLayoutsForTab}
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={handleBreakpointChange}
            isEditing={false}
            currentTimeRange={currentTimeRange}
            currentDataCount={currentDataCount}
            filterType={filterType}
            stageWidgetRemoval={stageWidgetRemoval}
            removeWidgetFromDatabase={removeWidgetFromDatabase}
            handleEditWidget={handleEditWidget}
          />
        </motion.div>
      )}
      {activeTab && isEditing && (
        <div className="dashboard-editing-container flex flex-col lg:flex-row gap-4 w-full px-4 lg:pr-5.5">
          {/* Drag & Drop di kiri */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
              className="pb-4 lg:pb-0"
            >
              <GridLayout
                items={currentItems}
                setItems={setItemsForTab}
                layouts={currentLayouts}
                setLayouts={setLayoutsForTab}
                onChartDrop={handleChartDrop}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                isEditing={true}
                currentTimeRange={currentTimeRange}
                currentDataCount={currentDataCount}
                filterType={filterType}
                stageWidgetRemoval={stageWidgetRemoval}
                removeWidgetFromDatabase={removeWidgetFromDatabase}
                handleEditWidget={handleEditWidget}
              />
            </motion.div>
          </div>
          {/* WidgetBox hanya ditampilkan pada breakpoint mobile/tablet, 
              untuk desktop menggunakan fixed positioning di WidgetBox */}
          {(isMobile || isMedium || isTablet) && (
            <div className="lg:w-80 lg:flex-shrink-0">
              <WidgetBox 
                breakpoint={true} 
                onChartDrag={handleChartDrop}
                onAddWidget={handleAddWidgetFromBox}
              />
            </div>
          )}
          {/* Untuk desktop, WidgetBox menggunakan fixed positioning */}
          {!(isMobile || isMedium || isTablet) && (
            <WidgetBox 
              breakpoint={false} 
              onChartDrag={handleChartDrop}
              onAddWidget={handleAddWidgetFromBox}
            />
          )}
        </div>
      )}
    </>
  );
}