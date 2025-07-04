import AddDashboardDialog from "@/components/custom/forms/dashboard/add-dashboard-form";
import AddWidgetDialog from "@/components/custom/forms/dashboard/add-widget-form";
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "@/components/custom/buttons/checkbox-button";

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
      {/* Hapus dashboard */}
      <ConfirmDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        title={
          dashboardToDelete ? (
            <>
              Hapus dashboard <i>"{dashboardToDelete.description}"</i> ?
            </>
          ) : (
            ""
          )
        }
        description="Semua widget di dalamnya juga akan terhapus."
        checkbox={
          <CheckboxButton
            id="deleteDashboardCheckbox"
            text="Saya mengerti konsekuensinya."
            checked={deleteChecked}
            onChange={(e) => setDeleteChecked(e.target.checked)}
          />
        }
        confirmHandle={handleDeleteDashboard}
        confirmText="Hapus"
        cancelText="Batal"
        confirmDisabled={!deleteChecked}
      />
    </>
  );
}
