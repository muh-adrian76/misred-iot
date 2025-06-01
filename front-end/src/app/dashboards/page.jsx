"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartDataLine } from "@/components/charts/line";
import { ChartDataBar } from "@/components/charts/bar";
import { ChartDataArea } from "@/components/charts/area";
import { AppSidebar } from "@/components/features/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/use-auth";

export default function Page() {
  // Always call hooks at the top
  const [charts, setCharts] = useState([]);
  const [chartName, setChartName] = useState("");
  const [deviceNumber, setDeviceNumber] = useState("");
  const [chartType, setChartType] = useState("");

  // Check Authorization
  const isAuthenticated = useAuth();
  
  // If not authenticated, render nothing or a fallback
  if (!isAuthenticated) {
    return null;
  }

  const handleAddChart = () => {
    if (chartName && deviceNumber && chartType) {
      setCharts([...charts, { name: chartName, device: deviceNumber, type: chartType }]);
      setChartName("");
      setDeviceNumber("");
      setChartType("");
    }
  };

  const renderChart = (chart) => {
    switch (chart.type) {
      case "line":
        return <ChartDataLine />;
      case "bar":
        return <ChartDataBar />;
      case "area":
        return <ChartDataArea />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-end mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Tambah Chart</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Chart Baru</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="chart-name">Nama Chart</Label>
                    <Input
                      id="chart-name"
                      value={chartName}
                      onChange={(e) => setChartName(e.target.value)}
                      placeholder="Masukkan nama chart"
                    />
                  </div>
                  <div>
                    <Label htmlFor="device-number">Nomor Device</Label>
                    <Input
                      id="device-number"
                      value={deviceNumber}
                      onChange={(e) => setDeviceNumber(e.target.value)}
                      placeholder="Masukkan nomor device"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chart-type">Jenis Chart</Label>
                    <Select onValueChange={(value) => setChartType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis chart" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                        <SelectItem value="area">Area</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddChart}>Tambah</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {charts.map((chart, index) => (
              <div key={index} className="aspect-video rounded-xl bg-muted/50">
                {renderChart(chart)}
              </div>
            ))}
          </div>
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  );
}
