// Import React hooks untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import komponen dialog responsif untuk form
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
// Import toaster untuk notifications
import { errorToast } from "@/components/custom/other/toaster"; // successToast tidak digunakan
// Import UI components untuk form inputs
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Import hook untuk responsive design
import { useBreakpoint } from "@/hooks/use-mobile";
// Import individual widget form components
import AreaForm from "./widget/area-form";
import LineForm from "./widget/line-form";
import BarForm from "./widget/bar-form";
import PieForm from "./widget/pie-form";
import GaugeForm from "./widget/gauge-form";
import TextForm from "./widget/text-form";
import SliderForm from "./widget/slider-form";
import SwitchForm from "./widget/switch-form";

// Komponen AddWidgetDialog untuk menambahkan widget baru ke dashboard IoT
export default function AddWidgetDialog({
  open, // State untuk kontrol visibility dialog
  setOpen, // Setter untuk mengubah state dialog
  initialData, // Data awal termasuk dashboard_id dan chart type
  onSubmit, // Handler function untuk submit widget baru
  devices = [], // Array devices yang tersedia untuk widget
  datastreams = [], // Array datastreams dari devices
}) {
  // State untuk form data widget
  const [form, setForm] = useState({
    description: "", // Nama/judul widget
    dashboard_id: "", // ID dashboard tempat widget akan ditambahkan
    selectedPairs: [], // Array pasangan { device_id, datastream_id } untuk multi-sensor widget
    sliderValue: 50, // Default value untuk slider widget
    switchValue: 0, // Default value untuk switch widget
  });
  const [loading, setLoading] = useState(false); // Loading state saat submit

  // Hook untuk responsive design detection
  const { isMobile } = useBreakpoint(); // Hanya isMobile yang diperlukan saat ini

  // Reset form saat dialog dibuka dengan data awal
  useEffect(() => {
    if (open) {
      setForm({
        description: "", // Clear nama widget
        dashboard_id: String(initialData?.dashboard_id) || "", // Set dashboard ID dari props
        selectedPairs: [], // Clear selected device-datastream pairs
        sliderValue: 50, // Reset slider value
        switchValue: 0, // Reset switch value
      });
    }
  }, [open, initialData]); // Dependencies: dialog state dan initial data

  // Handler untuk mengubah nilai form fields
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value }); // Update form state dengan spread operator

  // Handler untuk widget form changes
  const handleWidgetFormChange = (data) => {
    setForm(prev => ({
      ...prev,
      selectedPairs: data.selectedPairs || []
    }));
  };

  // Handler untuk submit form widget baru dengan validasi
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Set loading state
    try {
      // Validasi minimal satu device-datastream pair harus dipilih
      if (form.selectedPairs.length === 0) {
  errorToast("Pilih minimal satu perangkat dan sensor!"); // Notifikasi error konsisten istilah
        return; // Stop execution jika validasi gagal
      }
      
      // Call parent handler dengan data widget
      await onSubmit({
        description: form.description, // Nama widget
        dashboard_id: form.dashboard_id, // ID dashboard
        inputs: form.selectedPairs, // Array device-datastream pairs
        chartType: initialData?.chartType, // Tipe chart dari initial data
        layout: initialData?.layoutItem, // Layout item dari initial data
      });
      setOpen(false); // Close dialog setelah berhasil
    } catch (error) {
      // Handle error saat submit
      errorToast("Gagal menambahkan widget"); // Error notification
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Determine chart configuration based on chart type
  const getChartConfig = () => {
    const chartType = initialData?.chartType?.toLowerCase();
    
    switch (chartType) {
      case 'gauge':
        return {
          maxSelection: 1,
          singleSelection: true,
          placeholder: "Pilih satu sensor untuk Grafik Gauge"
        };
      case 'text':
        return {
          maxSelection: 1,
          singleSelection: true,
          placeholder: "Pilih satu sensor untuk Widget Teks"
        };
      case 'bar':
        return {
          maxSelection: 6,
          singleSelection: false,
          placeholder: "Pilih sensor untuk Grafik Batang"
        };
      case 'pie':
        return {
          maxSelection: 5,
          singleSelection: false,
          placeholder: "Pilih sensor untuk Grafik Pai"
        };
      case 'line':
      case 'area':
      default:
        return {
          maxSelection: 4,
          singleSelection: false,
          placeholder: "Pilih sensor untuk Grafik"
        };
    }
  };

  const chartConfig = getChartConfig();

  // Render the appropriate form component based on chart type
  const renderWidgetForm = () => {
    const chartType = initialData?.chartType?.toLowerCase();
    
    switch (chartType) {
      case 'area':
        return (
          <AreaForm
            devices={devices}
            datastreams={datastreams}
            selectedPairs={form.selectedPairs}
            onChange={handleWidgetFormChange}
            maxSelection={chartConfig.maxSelection}
          />
        );
      case 'line':
        return (
          <LineForm
            devices={devices}
            datastreams={datastreams}
            selectedPairs={form.selectedPairs}
            onChange={handleWidgetFormChange}
            maxSelection={chartConfig.maxSelection}
          />
        );
      case 'bar':
        return (
          <BarForm
            datastreams={datastreams}
            datastream_id={form.selectedPairs[0]?.datastream_id}
            onChange={handleWidgetFormChange}
          />
        );
      case 'pie':
        return (
          <PieForm
            devices={devices}
            datastreams={datastreams}
            selectedPairs={form.selectedPairs}
            onChange={handleWidgetFormChange}
            maxSelection={chartConfig.maxSelection}
          />
        );
      case 'gauge':
        return (
          <GaugeForm
            devices={devices}
            datastreams={datastreams}
            selectedPairs={form.selectedPairs}
            onChange={handleWidgetFormChange}
          />
        );
      case 'text':
        return (
          <TextForm
            devices={devices}
            datastreams={datastreams}
            selectedPairs={form.selectedPairs}
            onChange={handleWidgetFormChange}
          />
        );
      case 'slider':
        return (
          <SliderForm
            value={form.sliderValue || 50}
            onChange={(data) => setForm(prev => ({ ...prev, sliderValue: data.value }))}
          />
        );
      case 'switch':
        return (
          <SwitchForm
            value={form.switchValue || 0}
            onChange={(data) => setForm(prev => ({ ...prev, switchValue: data.value }))}
          />
        );
      default:
        return (
          <AreaForm
            devices={devices}
            datastreams={datastreams}
            selectedPairs={form.selectedPairs}
            onChange={handleWidgetFormChange}
            maxSelection={4}
          />
        );
    }
  };

  const formContent = (
    <div className="flex flex-col gap-4 py-2">
      {/* Dashboard ID & Nama */}
      <Input
        id="dashboard_id"
        type="hidden"
        value={form.dashboard_id}
        required
      />
      <div className="flex flex-col gap-2 mb-3">
        <Label htmlFor="description" className="text-left ml-1 font-medium">
          Nama
        </Label>
        <Input
          id="description"
          name="description"
          placeholder="Nama atau judul widget"
          value={form.description}
          onChange={handleChange}
          required
        />
      </div>

      {/* Widget Form Component */}
      {renderWidgetForm()}
    </div>
  );
  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title="Pengaturan Widget"
      form={formContent}
      formHandle={handleSubmit}
      loading={loading}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}
