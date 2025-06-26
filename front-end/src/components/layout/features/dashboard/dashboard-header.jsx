import DashboardSelect from "@/components/custom/forms/dashboard/dashboard-select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import DashboardToolbar from "@/components/custom/forms/dashboard/dashboard-toolbar";
import { cn } from "@/lib/utils";

export default function DashboardHeader(props) {
  const {
    dashboards,
    activeTab,
    setActiveTab,
    isMobile,
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
    <div
      className={cn(
        "flex items-end w-full rounded-2xl px-3.5 py-3 gap-3 min-lg:sticky min-lg:top-[0px]",
        isMobile ? "justify-center" : "justify-between"
      )}
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
          className={isMobile ? "w-[348px]" : "w-[434px]"}
          editState={isEditing}
          editValue={editDashboardValue}
          onEditValueChange={setEditDashboardValue}
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
      {isMobile ? (
        <div
          className="fixed left-1/2 bottom-4 -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-md shadow-lg rounded-xl px-2 py-2 z-50 border max-w-full w-fit">
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
        <DashboardToolbar
          dashboardState={dashboards.length === 0}
          widgetState={widgetCount === 0}
          editState={isEditing}
          setEditState={setIsEditing}
          setOpenChartSheet={setOpenChartSheet}
          saveEdit={handleSaveEditDashboard}
        />
      )}
    </div>
  );
}
