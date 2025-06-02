"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { SidebarInset, SidebarTrigger, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/features/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { IconCopy, IconEdit, IconTrashX } from "@tabler/icons-react"




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
])

  const flatData = React.useMemo(() => {
  return devices.flatMap((device) =>
    device.sensors.map((sensor) => ({
      ...sensor,
      name: device.name,
    }))
  )
  }, [devices])
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
        const alarm = row.original

        const handleEdit = () => {
          setEditAlarm({
            ...alarm,
            name: alarm.name, // penting untuk tracking nama device
          })
          setEditDialogOpen(true)
        }

        return (
          <div className="flex gap-2">
            <Button className="ml-auto" variant="outline" size="sm" onClick={handleEdit}>
              <IconEdit/>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setAlarmToDelete(alarm)
                setDeleteDialogOpen(true)
              }}
            >
              <IconTrashX/>
            </Button>
          </div>
        )
      },
    }

  ]


  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [editAlarm, setEditAlarm] = React.useState(null)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [alarmToDelete, setAlarmToDelete] = React.useState(null)

  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [name, setName] = React.useState("")
  const [sensorName, setsensorName] = React.useState("")
  const [threshold, setthreshold] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)

  


  const handleAddAlarm = () => {
  if (!name || !sensorName || !threshold) {
    toast.error("All fields must be filled!")
    return
  }

  const deviceIndex = devices.findIndex((d) => d.name === name)

  if (deviceIndex === -1) {
    toast.error("Device not found!")
    return
  }

  const existing = devices[deviceIndex].sensors.some(
    (sensor) => sensor.sensorName === sensorName
  )

  if (existing) {
    toast.error("Alarm untuk sensor ini sudah ada pada device tersebut!")
    return
  }

  const newSensor = {
    id: String(Date.now()),
    sensorName,
    threshold,
  }

  // Salin array devices lalu tambahkan sensor pada device yang sesuai
  const updatedDevices = [...devices]
  updatedDevices[deviceIndex] = {
    ...updatedDevices[deviceIndex],
    sensors: [...updatedDevices[deviceIndex].sensors, newSensor],
  }

  setDevices(updatedDevices)

  // Reset form
  setName("")
  setsensorName("")
  setthreshold("")
  setDialogOpen(false)

  toast.success("Alarm berhasil ditambahkan!")
}

  const handleSaveEdit = () => {
  const deviceIndex = devices.findIndex((d) => d.name === editAlarm.name)
  if (deviceIndex === -1) return

  const sensorIndex = devices[deviceIndex].sensors.findIndex(
    (s) => s.id === editAlarm.id
  )
  if (sensorIndex === -1) return

  const updatedDevices = [...devices]
  updatedDevices[deviceIndex].sensors[sensorIndex] = {
    ...editAlarm,
  }
  delete updatedDevices[deviceIndex].sensors[sensorIndex].name // optional cleanup
  setDevices(updatedDevices)
  setEditDialogOpen(false)
  toast.success("Sensor berhasil diperbarui!")
}



  

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
      .includes(filterValue.toLowerCase())
    },
  })

  return (
    <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4">
        <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Alarm</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ml-2">Add Alarm</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Alarm</DialogTitle>
                  <DialogDescription>
                    Add your alarm here. Click add when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sensorName" className="text-right">
                      Sensor
                    </Label>
                    <Input id="sensorName" value={sensorName} onChange={(e) => setsensorName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      DeviceName
                    </Label>
                    <Select
                      value={name}
                      onValueChange={(value) => setName(value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih Device" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(flatData.map((d) => d.name))].map((deviceName) => (
                          <SelectItem key={deviceName} value={deviceName}>
                            {deviceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="threshold" className="text-right">
                      Threshold
                    </Label>
                    <Input id="threshold" type="number" value={threshold} onChange={(e) => setthreshold(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddAlarm}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Edit table */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Alarm</DialogTitle>
                  <DialogDescription>Change alarm information in here.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sensorEdit" className="text-right">Sensor</Label>
                    <Input
                      id="sensorEdit"
                      className="col-span-3"
                      value={editAlarm?.sensorName || ""}
                      onChange={(e) =>
                        setEditAlarm({ ...editAlarm, sensorName: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nameEdit" className="text-right">DeviceName</Label>
                    <Select
                      value={editAlarm?.name || ""}
                      onValueChange={(value) =>
                        setEditAlarm({ ...editAlarm, name: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih Device" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...new Set(flatData.map((d) => d.name))].map((deviceName) => (
                          <SelectItem key={deviceName} value={deviceName}>
                            {deviceName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="thresholdEdit" className="text-right">Threshold</Label>
                    <Input
                      id="thresholdEdit"
                      className="col-span-3"
                      value={editAlarm?.threshold || ""}
                      onChange={(e) =>
                        setEditAlarm({ ...editAlarm, threshold: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      const sensorToUpdate = editAlarm

                      // Validasi sebelum update
                      const targetDevice = devices.find((d) => d.name === sensorToUpdate.name)
                      if (!targetDevice) {
                        toast.error("Device tidak ditemukan!")
                        return
                      }

                      const sensorDuplicate = targetDevice.sensors.find(
                        (s) =>
                          s.sensorName === sensorToUpdate.sensorName &&
                          s.id !== sensorToUpdate.id // pastikan bukan dirinya sendiri
                      )

                      if (sensorDuplicate) {
                        toast.error("Sensor ini sudah ada di device yang dipilih!")
                        return // 🚫 batalkan update
                      }

                      // Update jika lolos validasi
                      setDevices((prevDevices) => {
                        return prevDevices.map((device) => {
                          if (device.name !== sensorToUpdate.name) return device

                          const updatedSensors = device.sensors.map((sensor) => {
                            if (sensor.id === sensorToUpdate.id) {
                              const { name, ...sensorData } = sensorToUpdate
                              return sensorData
                            }
                            return sensor
                          })

                          return {
                            ...device,
                            sensors: updatedSensors,
                          }
                        })
                      })

                      setEditDialogOpen(false)
                      toast.success("Sensor berhasil diperbarui!")
                    }}
                  >
                    Save Change
                  </Button>


                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Confirm Delete */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Hapus Device?</DialogTitle>
                  <DialogDescription>
                    Apakah kamu yakin ingin menghapus sensor <strong>{alarmToDelete?.sensorName}</strong>?
                    Tindakan ini tidak dapat dibatalkan.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDevices((prevDevices) => {
                        return prevDevices.map((device) => ({
                          ...device,
                          sensors: device.sensors.filter(
                            (sensor) => sensor.id !== alarmToDelete.id
                          ),
                        }))
                      })
                      setDeleteDialogOpen(false)
                      toast.success("Alarm berhasil dihapus!")
                    }}
                  >
                    Hapus
                  </Button>

                </DialogFooter>
              </DialogContent>
            </Dialog>            
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
                    <TableCell colSpan={columns.length} className="h-24 text-center">
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

  )
}
