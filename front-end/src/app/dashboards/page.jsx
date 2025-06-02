"use client"

import { useState, useEffect } from "react";
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
import { Bell, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Page() {
  // Always call hooks at the top
  const [charts, setCharts] = useState([]);
  const [chartName, setChartName] = useState("");
  const [deviceNumber, setDeviceNumber] = useState("");
  const [chartType, setChartType] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check Authorization
  const isAuthenticated = useAuth();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

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

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 mb-3 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          {/* Left Section: Sidebar Trigger and Breadcrumbs */}
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {/* <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem> */}
                {/* <BreadcrumbSeparator className="hidden md:block" /> */}
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right Section: Theme Toggle, Notifications, User Avatar */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="User Avatar" /> {/* Ganti dengan path avatar pengguna jika ada */}
                    <AvatarFallback>U</AvatarFallback> {/* Inisial pengguna */}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profil</DropdownMenuItem>
                <DropdownMenuItem>Pengaturan</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  {/* Tambahkan fungsi logout di sini */}
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <Label htmlFor="device-number">Device</Label>
                    <Select onValueChange={(value) => setChartType(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih device" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">1</SelectItem>
                        <SelectItem value="bar">2</SelectItem>
                      </SelectContent>
                      </Select>
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
