import React from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import { AreaChartWidget } from "@/components/custom/widgets/widget-component/charts/area";
import { BarChartWidget } from "@/components/custom/widgets/widget-component/charts/bar";
import { LineChartWidget } from "@/components/custom/widgets/widget-component/charts/line";
import { PieChartWidget } from "@/components/custom/widgets/widget-component/charts/pie";

import SwapyDragArea from "@/components/custom/widgets/swapy";
import WidgetBox from "@/components/custom/widgets/widget-box";
import { motion } from "framer-motion";

const ReactGridLayout = WidthProvider(RGL);

const widgetComponents = {
  area: AreaChartWidget,
  bar: BarChartWidget,
  line: LineChartWidget,
  pie: PieChartWidget,
};

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
    isTablet,
    isDesktop,
    handleChartDrop,
    handleLayoutSave,
  } = props;

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
        <span className="text-muted-foreground">Memuat data widget...</span>
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
      {activeTab && !isEditing && widgetCount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
          className="flex items-center justify-center h-screen"
        >
          <div className="w-full">
            <ReactGridLayout
              className="layout"
              rowHeight={100}
              cols={12}
              width={1200}
              isDraggable={false}
              isResizable={false}
            >
              {(tabItems[activeTab] || []).map((item, idx) => {
                // Ambil layout dari tabLayouts
                const layout = (tabLayouts[activeTab] || [])[idx] || {
                  x: (idx * 3) % 12,
                  y: Math.floor(idx / 4),
                  w: 3,
                  h: 2,
                };
                const WidgetComponent = widgetComponents[item.type];
                return (
                  <div
                    key={item.id}
                    data-grid={{
                      x: layout.x,
                      y: layout.y,
                      w: layout.w,
                      h: layout.h,
                      static: true,
                    }}
                    className="bg-background border rounded shadow flex items-center justify-center"
                  >
                    {WidgetComponent ? (
                      <WidgetComponent />
                    ) : (
                      <span>Tipe widget tidak ditemukan</span>
                    )}
                  </div>
                );
              })}
            </ReactGridLayout>
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
