import React from "react";

const chartList = [
  { type: "line", label: "Line Chart" },
  { type: "bar", label: "Bar Chart" },
  { type: "pie", label: "Pie Chart" },
  { type: "area", label: "Area Chart" },
  // Tambahkan jenis chart lain sesuai kebutuhan
];

export default function WidgetBox({ onChartDrag }) {
  return (
    <div className="flex flex-col gap-3 mb-4 fixed top-[20%] right-2 z-50">
      {chartList.map((chart) => (
        <div
          key={chart.type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("chartType", chart.type);
            // if (onChartDrag) onChartDrag(chart.type);
          }}
          className="border rounded p-3 bg-white shadow cursor-grab hover:bg-gray-50"
        >
          {chart.label}
        </div>
      ))}
    </div>
  );
}