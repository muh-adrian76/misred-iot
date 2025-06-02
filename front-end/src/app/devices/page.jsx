"use client"

import {useState} from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import useAuth from "@/hooks/use-auth";
import { Bell, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

////////
export default function Page() {
  const [data, setData] = useState([
  {
    id: "1",
    boardType: "ESP32",
    protocol: "HTTP",
    name: "Device1",
    token: "test-device-1",
  },
  {
    id: "2",
    boardType: "Arduino Nano",
    protocol: "MQTT",
    name: "Device2",
    token: "test-device-2",
  },
  {
    id: "3",
    boardType: "ESP32",
    protocol: "LoRaWAN",
    name: "Device3",
    token: "test-device-3",
  },
  {
    id: "4",
    boardType: "ESP8266",
    protocol: "MQTT",
    name: "Device4",
    token: "test-device-4",
  },
  {
    id: "5",
    boardType: "ESP8266",
    protocol: "HTTP",
    name: "Device5",
    token: "test-device-5",
  },
  ])

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
      accessorKey: "token",
      header: "UID",
      cell: ({ row }) => {
        const token = row.getValue("token")

        const handleCopy = () => {
          navigator.clipboard.writeText(token)
          toast.success("Token disalin!")
        }

        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[160px]">{token}</span>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              <IconCopy className="size-3"/>
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "protocol",
      header: () => <div className="text-right">Protocol</div>,
        cell: ({ row }) => {
          const protocol = row.getValue("protocol")

          const getBadgeStyle = (protocol) => {
            switch (protocol.toLowerCase()) {
              case "http":
                return "border-blue-500 text-blue-500"
              case "mqtt":
                return "border-green-500 text-green-500"
              case "lorawan":
                return "border-red-500 text-red-500"
              default:
                return "border-gray-500 text-gray-500"
            }
          }

          return (
            <div className="text-right">
              <Badge variant="outline" className={getBadgeStyle(protocol)}>
                {protocol.toUpperCase()}
              </Badge>
            </div>
          )
        },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const device = row.original

        const handleDelete = () => {
          setData((prev) => prev.filter((d) => d.id !== device.id))
          toast.success("Device berhasil dihapus!")
        }

        const handleEdit = () => {
          setEditDevice(device)
          setEditDialogOpen(true)
        }

        return (
          <div className="flex gap-2">
            <Button className="ml-auto" variant="outline" size="sm" onClick={handleEdit}>
              <IconEdit/>
            </Button>
            <Button className="ml-2" variant="destructive" size="sm" onClick={handleDelete}>
              <IconTrashX/>
            </Button>
          </div>
        )
      },
    }

  ]


  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editDevice, setEditDevice] = useState(null)
  const [globalFilter, setGlobalFilter] = useState("")

  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})

  const [name, setName] = useState("")
  const [boardType, setBoardType] = useState("")
  const [protocol, setProtocol] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false);


  const handleAddDevice = () => {
  if (!name || !boardType || !protocol) {
    toast.error("All fields must be filled!")
    return
  }

  const newDevice = {
    id: String(Date.now()),
    name,
    boardType,
    protocol,
    token: ".............",
  }

  setData((prev) => [...prev, newDevice])
  setName("")
  setBoardType("")
  setProtocol("")
  setDialogOpen(false) // Tutup dialog
  toast.success("Device berhasil ditambahkan!")
  }

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
      .includes(filterValue.toLowerCase())
    },
  })

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


  // Check Authorization
  const isAuthenticated = useAuth();
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
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
                  <BreadcrumbPage>Devices</BreadcrumbPage>
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
        

        {/* Main content */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Filter + Column visibility controls */}
        <div className="flex items-center py-4">
            <Input
              placeholder="Cari device..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                Filter <ChevronDown className="ml-2 h-4 w-4" />
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ml-2">Tambah Device</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tambah Device</DialogTitle>
                  {/* <DialogDescription>
                    Add your device here. Click add when you're done.
                  </DialogDescription> */}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="boardType" className="text-right">
                      Tipe Board
                    </Label>
                    <Input id="boardType" value={boardType} onChange={(e) => setBoardType(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="protocol" className="text-right">
                      Protokol
                    </Label>
                    <Select value={protocol} onValueChange={setProtocol}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MQTT">MQTT</SelectItem>
                        <SelectItem value="HTTP">HTTP</SelectItem>
                        <SelectItem value="LoRaWAN">LoRaWAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleAddDevice}>Tambah</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Edit table */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Device</DialogTitle>
                  <DialogDescription>Change device information in here.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nameEdit" className="text-right">Name</Label>
                    <Input
                      id="nameEdit"
                      className="col-span-3"
                      value={editDevice?.name || ""}
                      onChange={(e) =>
                        setEditDevice({ ...editDevice, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="boardEdit" className="text-right">Type Board</Label>
                    <Input
                      id="boardEdit"
                      className="col-span-3"
                      value={editDevice?.boardType || ""}
                      onChange={(e) =>
                        setEditDevice({ ...editDevice, boardType: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="protocolEdit" className="text-right">Protocol</Label>
                    <Select
                      value={editDevice?.protocol || ""}
                      onValueChange={(value) =>
                        setEditDevice({ ...editDevice, protocol: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih protokol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MQTT">MQTT</SelectItem>
                        <SelectItem value="HTTP">HTTP</SelectItem>
                        <SelectItem value="LoRaWAN">LoRaWAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setData((prev) =>
                        prev.map((d) => (d.id === editDevice.id ? editDevice : d))
                      )
                      setEditDialogOpen(false)
                      toast.success("Device berhasil diperbarui!")
                    }}
                  >
                    Simpan
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
