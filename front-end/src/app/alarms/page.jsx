"use client";

import { useState, useMemo } from "react";
import { useUser } from "@/providers/user-provider";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
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
import { showToast } from "@/components/features/toaster";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/features/app-sidebar";
import AppNavbar from "@/components/features/app-navbar";

import { Copy, Edit, Trash } from "lucide-react";
import AddAlarmForm from "@/components/forms/add-alarm-form";
import EditAlarmForm from "@/components/forms/edit-alarm-form";
import DeleteAlarmForm from "@/components/forms/delete-alarm-form";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { fetchFromBackend } from "@/lib/helper";

export default function Page() {
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [editAlarm, setEditAlarm] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteFormOpen, setDeleteFormOpen] = useState(false);
  const [alarmToDelete, setAlarmToDelete] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const [name, setName] = useState("");
  const [sensorName, setsensorName] = useState("");
  const [threshold, setthreshold] = useState("");
  const [FormOpen, setFormOpen] = useState(false);

  const isAuthenticated = useAuth();
  const { user } = useUser();

  const [devices, setDevices] = useState([
    {
      name: "Device1",
      sensors: [
        { id: "1", sensorName: "pH", threshold: ">8.5; <6.5" },
        { id: "2", sensorName: "COD", threshold: ">100; <50" },
        { id: "3", sensorName: "NH3-N", threshold: ">75; <10" },
        { id: "4", sensorName: "TSS", threshold: ">300" },
        { id: "5", sensorName: "Flowmeter", threshold: ">1000" },
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const flatData = useMemo(() => {
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
              <Edit />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setAlarmToDelete(alarm);
                setDeleteFormOpen(true);
              }}
            >
              <Trash />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleAddAlarm = () => {
    if (!name || !sensorName || !threshold) {
      showToast.error("All fields must be filled!");
      return;
    }

    const deviceIndex = devices.findIndex((d) => d.name === name);
    if (deviceIndex === -1) {
      showToast.error("Device not found!");
      return;
    }

    const sensorIndex = devices[deviceIndex].sensors.findIndex(
      (sensor) => sensor.sensorName === sensorName
    );

    if (sensorIndex === -1) {
      showToast.error("Sensor tidak ditemukan pada device!");
      return;
    }

    if (devices[deviceIndex].sensors[sensorIndex].threshold !== "") {
      showToast.error("Alarm untuk sensor ini sudah ada pada device tersebut!");
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
    setFormOpen(false);

    showToast.success("Alarm berhasil ditambahkan!");
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
    setEditFormOpen(false);
    showToast.success("Sensor berhasil diperbarui!");
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
        <AppNavbar page="Alarms" profile={user} />

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
            <AddAlarmForm
              open={FormOpen}
              setOpen={setFormOpen}
              sensorName={sensorName}
              setsensorName={setsensorName}
              name={name}
              setName={setName}
              threshold={threshold}
              setthreshold={setthreshold}
              handleAddAlarm={handleAddAlarm}
              flatData={flatData}
              devices={devices}
              toast={showToast}
            />
            {/* Edit table */}
            <EditAlarmForm
              open={editFormOpen}
              setOpen={setEditFormOpen}
              editAlarm={editAlarm}
              setEditAlarm={setEditAlarm}
              devices={devices}
              setDevices={setDevices}
              flatData={flatData}
              toast={showToast}
            />
            {/* Confirm Delete */}
            <DeleteAlarmForm
              open={deleteFormOpen}
              setOpen={setDeleteFormOpen}
              alarmToDelete={alarmToDelete}
              setDevices={setDevices}
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
