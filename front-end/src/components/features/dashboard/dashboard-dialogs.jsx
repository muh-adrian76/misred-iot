// ===== IMPORTS =====
// Import komponen form dialog untuk berbagai operasi dashboard
import AddDashboardDialog from "@/components/custom/forms/dashboard/add-dashboard-form";
import DeleteDashboardDialog from "@/components/custom/forms/dashboard/delete-dashboard-form";
import AddWidgetDialog from "@/components/custom/forms/dashboard/add-widget-form";
import EditWidgetDialog from "@/components/custom/forms/dashboard/edit-widget-form";

// ===== DASHBOARD DIALOGS COMPONENT =====
// Komponen utama yang mengelola semua dialog dashboard
// Komponen ini menjadi container untuk semua modal/dialog yang digunakan dalam dashboard
export default function DashboardDialogs(props) {
  // ===== DESTRUCTURE PROPS =====
  // Ekstrak semua props yang diperlukan untuk berbagai dialog
  const {
    // ===== ADD DASHBOARD DIALOG PROPS =====
    openDashboardDialog, // Status open/close dialog tambah dashboard
    setOpenDashboardDialog, // Setter untuk dialog tambah dashboard
    handleAddDashboard, // Handler untuk menambah dashboard baru
    
    // ===== DELETE DASHBOARD DIALOG PROPS =====
    openDeleteDialog, // Status open/close dialog hapus dashboard
    setOpenDeleteDialog, // Setter untuk dialog hapus dashboard
    dashboardToDelete, // Data dashboard yang akan dihapus
    handleDeleteDashboard, // Handler untuk menghapus dashboard
    deleteChecked, // Status checkbox konfirmasi hapus
    setDeleteChecked, // Setter untuk checkbox konfirmasi
    
    // ===== ADD WIDGET DIALOG PROPS =====
    showWidgetForm, // Status show/hide form tambah widget
    setShowWidgetForm, // Setter untuk form tambah widget
    newWidgetData, // Data widget baru yang akan ditambahkan
    handleWidgetFormSubmit, // Handler submit form widget baru
    
    // ===== EDIT WIDGET DIALOG PROPS =====
    showEditWidgetForm, // Status show/hide form edit widget
    setShowEditWidgetForm, // Setter untuk form edit widget
    editWidgetData, // Data widget yang sedang diedit
    handleEditWidgetFormSubmit, // Handler submit form edit widget
    
    // ===== SHARED DATA PROPS =====
    devices, // Data semua device untuk dropdown/selection
    datastreams, // Data semua datastream untuk dropdown/selection
  } = props;

  // ===== RENDER COMPONENT =====
  return (
    <>
      {/* ===== DIALOG TAMBAH DASHBOARD ===== */}
      {/* Dialog untuk membuat dashboard baru */}
      <AddDashboardDialog
        open={openDashboardDialog} // Status dialog terbuka/tertutup
        setOpen={setOpenDashboardDialog} // Fungsi untuk mengubah status dialog
        onCreateDashboard={handleAddDashboard} // Callback ketika dashboard berhasil dibuat
      />
      
      {/* ===== DIALOG TAMBAH WIDGET ===== */}
      {/* Dialog untuk menambahkan widget baru ke dashboard */}
      <AddWidgetDialog
        open={showWidgetForm} // Status form widget terbuka/tertutup
        setOpen={setShowWidgetForm} // Fungsi untuk mengubah status form
        initialData={newWidgetData} // Data awal widget (chart type, layout, dll)
        onSubmit={handleWidgetFormSubmit} // Callback ketika form widget disubmit
        devices={devices} // Daftar device untuk pilihan input
        datastreams={datastreams} // Daftar datastream untuk pilihan input
      />
      
      {/* ===== DIALOG EDIT WIDGET ===== */}
      {/* Dialog untuk mengedit widget yang sudah ada */}
      <EditWidgetDialog
        open={showEditWidgetForm} // Status form edit widget terbuka/tertutup
        setOpen={setShowEditWidgetForm} // Fungsi untuk mengubah status form edit
        widgetData={editWidgetData} // Data widget yang sedang diedit
        onSubmit={handleEditWidgetFormSubmit} // Callback ketika form edit disubmit
        devices={devices} // Daftar device untuk pilihan input
        datastreams={datastreams} // Daftar datastream untuk pilihan input
      />
      
      {/* ===== DIALOG HAPUS DASHBOARD ===== */}
      {/* Dialog konfirmasi untuk menghapus dashboard */}
      <DeleteDashboardDialog
        open={openDeleteDialog} // Status dialog hapus terbuka/tertutup
        setOpen={setOpenDeleteDialog} // Fungsi untuk mengubah status dialog hapus
        dashboardToDelete={dashboardToDelete} // Data dashboard yang akan dihapus
        handle={handleDeleteDashboard} // Handler untuk eksekusi penghapusan
        deleteChecked={deleteChecked} // Status checkbox konfirmasi penghapusan
        setDeleteChecked={setDeleteChecked} // Fungsi untuk mengubah status checkbox
      />
    </>
  );
}
