import AddDashboardDialog from "@/components/custom/forms/dashboard/add-dashboard-form";
import DeleteDashboardDialog from "@/components/custom/forms/dashboard/delete-dashboard-form";
import AddWidgetDialog from "@/components/custom/forms/dashboard/add-widget-form";
export default function DashboardDialogs(props) {
  const {
    openDashboardDialog,
    setOpenDashboardDialog,
    createDashboard,
    openDeleteDialog,
    setOpenDeleteDialog,
    dashboardToDelete,
    handleDeleteDashboard,
    deleteChecked,
    setDeleteChecked,
    showWidgetForm,
    setShowWidgetForm,
    newWidgetData,
    handleWidgetFormSubmit,
    devices,
    datastreams,
  } = props;

  return (
    <>
      <AddDashboardDialog
        open={openDashboardDialog}
        setOpen={setOpenDashboardDialog}
        onCreateDashboard={createDashboard}
      />
      <AddWidgetDialog
        open={showWidgetForm}
        setOpen={setShowWidgetForm}
        initialData={newWidgetData}
        onSubmit={handleWidgetFormSubmit}
        devices={devices}
        datastreams={datastreams}
      />
      <DeleteDashboardDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        dashboardToDelete={dashboardToDelete}
        handle={handleDeleteDashboard}
        deleteChecked={deleteChecked}
        setDeleteChecked={setDeleteChecked}
      />
    </>
  );
}
