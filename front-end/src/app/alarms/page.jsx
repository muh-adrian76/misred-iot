"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  SidebarInset,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Bell, Sun, Moon, Laptop } from "lucide-react";
import { AppSidebar } from "@/components/features/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { IconCopy, IconEdit, IconTrashX } from "@tabler/icons-react";
import AddAlarmDialog from "@/components/features/add-alarm";
import EditAlarmDialog from "@/components/features/edit-alarm";
import ConfirmDeleteAlarmDialog from "@/components/features/delete-alarm";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { fetchFromBackend } from "@/lib/utils";
import { googleLogout } from "@react-oauth/google";
import { useTheme } from "next-themes";

export default function DataTableDemo() {
  const [devices, setDevices] = React.useState([
    {
      name: "Device1",
      sensors: [
        { id: "1", sensorName: "pH", threshold: "7" },
        { id: "2", sensorName: "COD", threshold: "100" },
        { id: "3", sensorName: "NH3-N", threshold: ".10" },
        { id: "4", sensorName: "TSS", threshold: "30" },
        { id: "5", sensorName: "Flowmeter", threshold: "100" },
      ],
    },
    {
      name: "Device2",
      sensors: [
        { id: "6", sensorName: "pH", threshold: "9" },
        { id: "7", sensorName: "TSS", threshold: "28" },
      ],
    },
  ]);

  const user = {
    name: "Test User",
    email: "test@user.com",
    avatar: "/avatars/shadcn.jpg", // ganti sesuai data user Anda
  };
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const flatData = React.useMemo(() => {
    return devices.flatMap((device) =>
      device.sensors
        .filter((sensor) => sensor.threshold !== "") // hanya tampilkan yang ada threshold
        .map((sensor) => ({
          ...sensor,
          name: device.name,
        }))
    );
  }, [devices]);
  // Edit Table
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "sensorName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sensor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "name",
      header: "Device Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "threshold",
      header: "Threshold",
      cell: ({ row }) => <div>{row.getValue("threshold")}</div>,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const alarm = row.original;

        const handleEdit = () => {
          setEditAlarm({
            ...alarm,
            name: alarm.name, // penting untuk tracking nama device
          });
          setEditDialogOpen(true);
        };

        return (
          <div className="flex gap-2">
            <Button
              className="ml-auto"
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <IconEdit />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setAlarmToDelete(alarm);
                setDeleteDialogOpen(true);
              }}
            >
              <IconTrashX />
            </Button>
          </div>
        );
      },
    },
  ];

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editAlarm, setEditAlarm] = React.useState(null);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [alarmToDelete, setAlarmToDelete] = React.useState(null);

  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [name, setName] = React.useState("");
  const [sensorName, setsensorName] = React.useState("");
  const [threshold, setthreshold] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [openSettings, setOpenSettings] = React.useState(false);
  const isAuthenticated = useAuth();
  const { setTheme, theme } = useTheme();

  const handleAddAlarm = () => {
    if (!name || !sensorName || !threshold) {
      toast.error("All fields must be filled!");
      return;
    }

    const deviceIndex = devices.findIndex((d) => d.name === name);
    if (deviceIndex === -1) {
      toast.error("Device not found!");
      return;
    }

    const sensorIndex = devices[deviceIndex].sensors.findIndex(
      (sensor) => sensor.sensorName === sensorName
    );

    if (sensorIndex === -1) {
      toast.error("Sensor tidak ditemukan pada device!");
      return;
    }

    if (devices[deviceIndex].sensors[sensorIndex].threshold !== "") {
      toast.error("Alarm untuk sensor ini sudah ada pada device tersebut!");
      return;
    }

    // Update threshold sensor yang sudah ada
    const updatedDevices = [...devices];
    updatedDevices[deviceIndex].sensors[sensorIndex] = {
      ...updatedDevices[deviceIndex].sensors[sensorIndex],
      threshold,
    };

    setDevices(updatedDevices);

    // Reset form
    setName("");
    setsensorName("");
    setthreshold("");
    setDialogOpen(false);

    toast.success("Alarm berhasil ditambahkan!");
  };

  const handleSaveEdit = () => {
    const deviceIndex = devices.findIndex((d) => d.name === editAlarm.name);
    if (deviceIndex === -1) return;

    const sensorIndex = devices[deviceIndex].sensors.findIndex(
      (s) => s.id === editAlarm.id
    );
    if (sensorIndex === -1) return;

    const updatedDevices = [...devices];
    updatedDevices[deviceIndex].sensors[sensorIndex] = {
      ...editAlarm,
    };
    delete updatedDevices[deviceIndex].sensors[sensorIndex].name; // optional cleanup
    setDevices(updatedDevices);
    setEditDialogOpen(false);
    toast.success("Sensor berhasil diperbarui!");
  };

  const table = useReactTable({
    data: flatData,
    columns,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },

    globalFilterFn: (row, columnId, filterValue) => {
      return Object.values(row.original)
        .join(" ")
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    },
  });

  // Check Authorization
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await fetchFromBackend("/auth/logout", {
      method: "POST",
    });
    googleLogout?.();
    router.push("/login");
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className="relative"
        style={{ height: "100vh" }}
      >
        <AppSidebar />
      </div>
      <SidebarInset>
        {/* Header */}
         <header className="flex h-16 items-center border-b bg-background px-4 gap-4 justify-between">
          <div className="flex items-center gap-2 px-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>Menu</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Alarm</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Kanan: Action Buttons */}
          <div className="flex items-center gap-4 px-4">
            {/* Notifikasi */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-full"
                >
                  <Bell className="w-5 h-5" />
                  {/* Notif */}
                  {/* <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full" /> */}
                  <span className="sr-only">Notifikasi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2 font-medium">Notifikasi Terbaru</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="text-sm">Alarm pH tinggi di Device1</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="text-sm">Alarm TSS rendah di Device2</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Tema */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : theme === "light" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 w-4 h-4" /> Cerah
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 w-4 h-4" /> Gelap
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 w-4 h-4" /> Sistem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Profil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-3 py-2">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setOpenSettings(true)}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Filter + Column visibility controls */}
          <div className="flex items-center py-4">
            <Input
              placeholder="Find alarm ..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Add alarm */}
            <AddAlarmDialog
              open={dialogOpen}
              setOpen={setDialogOpen}
              sensorName={sensorName}
              setsensorName={setsensorName}
              name={name}
              setName={setName}
              threshold={threshold}
              setthreshold={setthreshold}
              handleAddAlarm={handleAddAlarm}
              flatData={flatData}
              devices={devices}
              toast={toast}
            />
            {/* Edit table */}
            <EditAlarmDialog
              open={editDialogOpen}
              setOpen={setEditDialogOpen}
              editAlarm={editAlarm}
              setEditAlarm={setEditAlarm}
              devices={devices}
              setDevices={setDevices}
              flatData={flatData}
              toast={toast}
            />
            {/* Confirm Delete */}
            <ConfirmDeleteAlarmDialog
              open={deleteDialogOpen}
              setOpen={setDeleteDialogOpen}
              alarmToDelete={alarmToDelete}
              setDevices={setDevices}
              toast={toast}
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer pagination & row info */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
