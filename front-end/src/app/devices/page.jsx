"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { useAuth } from "@/hooks/use-auth";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/features/app-sidebar";
import AppNavbar from "@/components/features/app-navbar";
import { IconCopy, IconEdit, IconTrashX } from "@tabler/icons-react";
import AddDeviceForm from "@/components/forms/add-device-form";
import EditDeviceForm from "@/components/forms/edit-device-form";
import DeleteDeviceForm from "@/components/forms/delete-device-form";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { showToast } from "@/components/features/toaster";
import { fetchFromBackend } from "@/lib/helper";

////////
export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);
  const [editDevice, setEditDevice] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const [name, setName] = useState("");
  const [boardType, setBoardType] = useState("");
  const [protocol, setProtocol] = useState("");
  const [FormOpen, setFormOpen] = useState(false);

  const isAuthenticated = useAuth();
  const { user } = useUser();

  const [data, setData] = useState([
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
          showToast.success("uid disalin!");
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
          showToast.success("Device berhasil dihapus!");
        };

        const handleEdit = () => {
          setEditDevice(device);
          setEditFormOpen(true);
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
                setDeleteFormOpen(true);
              }}
            >
              <IconTrashX />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleAddDevice = () => {
    if (!name || !boardType || !protocol) {
      showToast.error("All fields must be filled!");
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
    setFormOpen(false);
    showToast.success("Device berhasil ditambahkan!");
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

  // Check JWT
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className="relative"
        style={{ height: "100vh" }} // pastikan area hover cukup tinggi
      >
        <AppSidebar />
      </div>
      <SidebarInset>
        <AppNavbar page="Devices" profile={user} />

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
            <AddDeviceForm
              open={FormOpen}
              setOpen={setFormOpen}
              name={name}
              setName={setName}
              boardType={boardType}
              setBoardType={setBoardType}
              protocol={protocol}
              setProtocol={setProtocol}
              handleAddDevice={handleAddDevice}
            />
            {/* Edit device */}
            <EditDeviceForm
              open={editFormOpen}
              setOpen={setEditFormOpen}
              editDevice={editDevice}
              setEditDevice={setEditDevice}
              setData={setData}
              toast={showToast}
            />
            {/* Delete device */}
            <DeleteDeviceForm
              open={deleteFormOpen}
              setOpen={setDeleteFormOpen}
              deviceToDelete={deviceToDelete}
              setData={setData}
              toast={showToast}
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
