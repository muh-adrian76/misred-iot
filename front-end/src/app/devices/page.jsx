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
import { Bell, Sun, Moon, Laptop } from "lucide-react";
import {
  SidebarInset,
  SidebarTrigger,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/features/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { IconCopy, IconEdit, IconTrashX } from "@tabler/icons-react";
import AddDeviceDialog from "@/components/features/add-device";
import EditDeviceDialog from "@/components/forms/edit-device-form";
import ConfirmDeleteDialog from "@/components/features/delete-device";
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
import { fetchFromBackend } from "@/lib/helper";
import { googleLogout } from "@react-oauth/google";
import { useTheme } from "next-themes";

////////
export default function DataTableDemo() {
  const [data, setData] = React.useState([
    {
      id: "1",
      boardType: "ESP32",
      protocol: "HTTP",
      name: "Device1",
      uid: "shadcn-device1-1",
    },
    {
      id: "2",
      boardType: "Arduino Nano",
      protocol: "MQTT",
      name: "Device2",
      uid: "shadcn-device2-2",
    },
    {
      id: "3",
      boardType: "ESP32",
      protocol: "LoRaWAN",
      name: "Device3",
      uid: "shadcn-device3-3",
    },
    {
      id: "4",
      boardType: "ESP8266",
      protocol: "MQTT",
      name: "Device4",
      uid: "shadcn-device4-4",
    },
    {
      id: "5",
      boardType: "ESP8266",
      protocol: "HTTP",
      name: "Device5",
      uid: "shadcn-device5-5",
    },
  ]);

  const user = {
    name: "Test User",
    email: "test@user.com",
    avatar: "/avatars/shadcn.jpg", // ganti sesuai data user Anda
  };
  
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
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "boardType",
      header: "Type Board",
      cell: ({ row }) => <div>{row.getValue("boardType")}</div>,
    },
    {
      accessorKey: "uid",
      header: "UID",
      cell: ({ row }) => {
        const uid = row.getValue("uid");

        const handleCopy = () => {
          navigator.clipboard.writeText(uid);
          toast.success("uid disalin!");
        };

        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[160px]">{uid}</span>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <IconCopy className="size-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "protocol",
      header: () => <div className="text-right">Protocol</div>,
      cell: ({ row }) => {
        const protocol = row.getValue("protocol");

        const getBadgeStyle = (protocol) => {
          switch (protocol.toLowerCase()) {
            case "http":
              return "border-blue-500 text-blue-500";
            case "mqtt":
              return "border-green-500 text-green-500";
            case "lorawan":
              return "border-red-500 text-red-500";
            default:
              return "border-gray-500 text-gray-500";
          }
        };

        return (
          <div className="text-right">
            <Badge variant="outline" className={getBadgeStyle(protocol)}>
              {protocol.toUpperCase()}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const device = row.original;

        const handleDelete = () => {
          setData((prev) => prev.filter((d) => d.id !== device.id));
          toast.success("Device berhasil dihapus!");
        };

        const handleEdit = () => {
          setEditDevice(device);
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
                setDeviceToDelete(device);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deviceToDelete, setDeviceToDelete] = React.useState(null);
  const [editDevice, setEditDevice] = React.useState(null);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [name, setName] = React.useState("");
  const [boardType, setBoardType] = React.useState("");
  const [protocol, setProtocol] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const [openSettings, setOpenSettings] = React.useState(false);
  const isAuthenticated = useAuth();
  const { setTheme, theme } = useTheme();

  const handleAddDevice = () => {
    if (!name || !boardType || !protocol) {
      toast.error("All fields must be filled!");
      return;
    }

    const nomorUrut = data.length + 1;
    const formattedName = user.name.toLowerCase().replace(/\s+/g, "-");
    const formattedDevice = name.toLowerCase().replace(/\s+/g, "-");
    const uid = `${formattedName}-${formattedDevice}-${nomorUrut}`;

    const newDevice = {
      id: String(Date.now()),
      name,
      boardType,
      protocol,
      uid,
    };

    setData((prev) => [...prev, newDevice]);
    setName("");
    setBoardType("");
    setProtocol("");
    setDialogOpen(false);
    toast.success("Device berhasil ditambahkan!");
  };

  const table = useReactTable({
    data,
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
                <BreadcrumbItem>
                <span className="text-muted-foreground">Menu</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Devices</BreadcrumbPage>
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
              placeholder="Find device..."
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
            {/* Add device */}
            <AddDeviceDialog
              open={dialogOpen}
              setOpen={setDialogOpen}
              name={name}
              setName={setName}
              boardType={boardType}
              setBoardType={setBoardType}
              protocol={protocol}
              setProtocol={setProtocol}
              handleAddDevice={handleAddDevice}
            />
            {/* Edit table */}
            <EditDeviceDialog
              open={editDialogOpen}
              setOpen={setEditDialogOpen}
              editDevice={editDevice}
              setEditDevice={setEditDevice}
              setData={setData}
              toast={toast}
            />
            {/* Confirm Delete */}
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              setOpen={setDeleteDialogOpen}
              deviceToDelete={deviceToDelete}
              setData={setData}
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
