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
import SliderForm from "./widget/slider-form";
import SwitchForm from "./widget/switch-form";

// Komponen EditWidgetDialog untuk mengedit widget existing dalam dashboard IoT
export default function EditWidgetDialog({
  open, // State untuk kontrol visibility dialog
  setOpen, // Setter untuk mengubah state dialog
  widgetData, // Data widget yang akan diedit
  onSubmit, // Handler function untuk submit widget yang sudah diedit
  devices = [], // Array devices yang tersedia untuk widget
  datastreams = [], // Array datastreams dari devices
}) {
  // State untuk form data widget dengan existing data
  const [form, setForm] = useState({
    id: "", // ID widget yang diedit
    description: "", // Nama/judul widget
    dashboard_id: "", // ID dashboard tempat widget berada
    selectedPairs: [], // Array pasangan { device_id, datastream_id } untuk multi-sensor widget
    sliderValue: 50, // Value untuk slider widget
    switchValue: 0, // Value untuk switch widget
  });
  const [loading, setLoading] = useState(false); // Loading state saat submit

  // Hook untuk responsive design detection
  const { isMobile } = useBreakpoint(); // Hanya isMobile dipakai

  // Reset form when dialog is opened dengan data widget existing
  useEffect(() => {
    if (open && widgetData) {
      setForm({
        id: widgetData.id || "", // Set widget ID
        description: widgetData.description || "", // Set existing description
        dashboard_id: widgetData.dashboard_id || "",
        selectedPairs: Array.isArray(widgetData.inputs)
          ? widgetData.inputs
          : Array.isArray(widgetData.datastream_ids)
            ? widgetData.datastream_ids
            : widgetData.datastream_id
              ? [
                  {
                    device_id: widgetData.device_id,
                    datastream_id: widgetData.datastream_id,
                  },
                ]
              : [],
        sliderValue: widgetData.value || widgetData.sliderValue || 50,
        switchValue: widgetData.value || widgetData.switchValue || 0,
      });
    }
  }, [open, widgetData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handler untuk widget form changes
  const handleWidgetFormChange = (data) => {
    setForm(prev => ({
      ...prev,
      selectedPairs: data.selectedPairs || []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.description.trim()) {
        errorToast("Nama widget harus diisi");
        return;
      }
      if (form.selectedPairs.length === 0) {
  errorToast("Pilih minimal satu perangkat dan sensor!");
        return;
      }
      await onSubmit({
        id: form.id,
        description: form.description,
        dashboard_id: form.dashboard_id,
        inputs: form.selectedPairs,
      });
      setOpen(false);
    } catch (error) {
  errorToast("Gagal memperbarui widget");
    } finally {
      setLoading(false);
    }
  };

  // Determine chart configuration - bisa dikembangkan lebih lanjut berdasarkan widget type
  const getChartConfig = () => {
    // Detect chart type from widget data if available
    const chartType = widgetData?.type?.toLowerCase() || widgetData?.chartType?.toLowerCase() || 'area';
    
    switch (chartType) {
      case 'gauge':
        return {
          maxSelection: 1,
          singleSelection: true,
          placeholder: "Pilih satu sensor untuk Grafik Gauge"
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
        return {
          maxSelection: 4,
          singleSelection: false,
          placeholder: "Pilih sensor untuk Grafik Garis"
        };
      case 'area':
      default:
        return {
          maxSelection: 4,
          singleSelection: false,
          placeholder: "Pilih sensor untuk Grafik Area"
        };
    }
  };

  const chartConfig = getChartConfig();

  // Render the appropriate form component based on chart type
  const renderWidgetForm = () => {
    const chartType = widgetData?.type?.toLowerCase() || widgetData?.chartType?.toLowerCase() || 'area';
    
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
      case 'slider':
        return (
          <SliderForm
            value={form.sliderValue || widgetData?.value || 50}
            onChange={(data) => setForm(prev => ({ ...prev, sliderValue: data.value }))}
          />
        );
      case 'switch':
        return (
          <SwitchForm
            value={form.switchValue || widgetData?.value || 0}
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
    <div className="flex flex-col gap-2 py-2">
      {/* Hidden ID field */}
      <Input id="id" type="hidden" value={form.id} required />
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
      title={
        <>
          Ubah <i>{widgetData?.description || ""}</i>
        </>
      }
      form={formContent}
      formHandle={handleSubmit}
      loading={loading}
      confirmText="Simpan"
      cancelText="Batal"
    />
  );
}
