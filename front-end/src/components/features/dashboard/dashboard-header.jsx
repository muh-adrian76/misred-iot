import DashboardSelect from "@/components/custom/forms/dashboard/dashboard-select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import DashboardToolbar from "@/components/custom/forms/dashboard/dashboard-toolbar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function DashboardHeader(props) {
  const {
    dashboards,
    activeTab,
    setActiveTab,
    isMobile,
    isTablet,
    isDesktop,
    isEditing,
    editDashboardValue,
    setEditDashboardValue,
    setOpenDashboardDialog,
    setDashboardToDelete,
    setOpenDeleteDialog,
    widgetCount,
    setIsEditing,
    setOpenChartSheet,
    handleSaveEditDashboard,
  } = props;

  return (
    <motion.div
      className={cn(
        "flex items-end sticky z-40 top-[64px] w-full rounded-2xl px-3.5 py-3 gap-3 bg-background",
        isMobile ? "justify-center" : "justify-between"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1.5, ease: "easeInOut" }}
    >
      <div className="flex items-center gap-3">
        <DashboardSelect
          options={dashboards.map((d) => ({
            value: d.description,
            label: d.description,
          }))}
          value={activeTab}
          onChange={setActiveTab}
          icon="Search"
          placeholder="Pilih dashboard"
          className={isMobile ? "w-[348px]" : "w-[430px]"}
          editState={isEditing}
          editValue={editDashboardValue}
          onEditValueChange={setEditDashboardValue}
          noDataText={
          !dashboards || dashboards.length === 0
            ? "Anda belum menambahkan dashboard."
            : "Tidak ada dashboard yang cocok."
        }
        />
        <Button
          size={isMobile ? "icon" : "sm"}
          className="flex items-center p-3"
          onClick={
            isEditing
              ? () => {
                  const current = dashboards.find(
                    (d) => d.description === activeTab
                  );
                  setDashboardToDelete(current);
                  setOpenDeleteDialog(true);
                }
              : () => setOpenDashboardDialog(true)
          }
        >
          {isEditing ? (
            <Trash2 className="h-5 w-5" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          {isMobile ? null : <span className="ml-1">Dashboard</span>}
        </Button>
      </div>
      {isTablet || isMobile ? (
        <div className="fixed left-1/2 bottom-3 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-md shadow-lg rounded-xl px-2 py-2 z-50 border max-w-full w-fit">
          <DashboardToolbar
            dashboardState={dashboards.length === 0}
            widgetState={widgetCount === 0}
            editState={isEditing}
            setEditState={setIsEditing}
            setOpenChartSheet={setOpenChartSheet}
            saveEdit={handleSaveEditDashboard}
          />
        </div>
      ) : (
        <div>
          <DashboardToolbar
            dashboardState={dashboards.length === 0}
            widgetState={widgetCount === 0}
            editState={isEditing}
            setEditState={setIsEditing}
            setOpenChartSheet={setOpenChartSheet}
            saveEdit={handleSaveEditDashboard}
          />
        </div>
      )}
    </motion.div>
  );
}
