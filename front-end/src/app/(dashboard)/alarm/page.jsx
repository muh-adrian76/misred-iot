"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Bell,
  BellOff,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import alarmAPI from "@/lib/api/alarm";
import { AlarmForm } from "@/components/custom/forms/alarm-form";
import { AlarmForm } from "@/components/custom/forms/alarm-form";

const getOperatorText = (operator) => {
  const operators = {
    '>': 'Lebih besar dari',
    '<': 'Lebih kecil dari',
    '>=': 'Lebih besar atau sama dengan',
    '<=': 'Lebih kecil atau sama dengan',
    '=': 'Sama dengan',
    '!=': 'Tidak sama dengan'
  };
  return operators[operator] || operator;
};

const getPriorityFromThreshold = (operator, threshold) => {
  // Logika sederhana untuk menentukan prioritas berdasarkan threshold
  if (threshold > 100 || (operator === '>' && threshold > 50)) return 'high';
  if (threshold > 50 || (operator === '>' && threshold > 20)) return 'medium';
  return 'low';
};

export default function AlarmPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, active, inactive
  const [selectedAlarm, setSelectedAlarm] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [alarmToDelete, setAlarmToDelete] = useState(null);
  
  const queryClient = useQueryClient();

  // Fetch alarms
  const { data: alarmsResponse, isLoading } = useQuery({
    queryKey: ['alarms'],
    queryFn: () => alarmAPI.getAlarms(),
    refetchInterval: 30000, // Refresh setiap 30 detik
  });

  const alarms = alarmsResponse?.alarms || [];

  // Create alarm mutation
  const createAlarmMutation = useMutation({
    mutationFn: alarmAPI.createAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      setShowCreateDialog(false);
      toast.success("Alarm berhasil dibuat!");
    },
    onError: (error) => {
      toast.error(`Gagal membuat alarm: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update alarm mutation
  const updateAlarmMutation = useMutation({
    mutationFn: ({ alarmId, data }) => alarmAPI.updateAlarm(alarmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      setShowEditDialog(false);
      setSelectedAlarm(null);
      toast.success("Alarm berhasil diperbarui!");
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui alarm: ${error.response?.data?.message || error.message}`);
    },
  });

  // Delete alarm mutation
  const deleteAlarmMutation = useMutation({
    mutationFn: alarmAPI.deleteAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      setShowDeleteDialog(false);
      setAlarmToDelete(null);
      toast.success("Alarm berhasil dihapus!");
    },
    onError: (error) => {
      toast.error(`Gagal menghapus alarm: ${error.response?.data?.message || error.message}`);
    },
  });

  // Toggle alarm status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: alarmAPI.toggleAlarmStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      toast.success("Status alarm berhasil diubah!");
    },
    onError: (error) => {
      toast.error(`Gagal mengubah status alarm: ${error.response?.data?.message || error.message}`);
    },
  });

  // Filter and search alarms
  const filteredAlarms = alarms.filter((alarm) => {
    const matchesSearch = alarm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alarm.device_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alarm.datastream_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && alarm.is_active) ||
                         (filterStatus === "inactive" && !alarm.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateAlarm = (data) => {
    createAlarmMutation.mutate(data);
  };

  const handleEditAlarm = (data) => {
    if (selectedAlarm) {
      updateAlarmMutation.mutate({ alarmId: selectedAlarm.id, data });
    }
  };

  const handleDeleteClick = (alarm) => {
    setAlarmToDelete(alarm);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (alarmToDelete) {
      deleteAlarmMutation.mutate(alarmToDelete.id);
    }
  };

  const handleToggleStatus = (alarmId) => {
    toggleStatusMutation.mutate(alarmId);
  };

  const handleEditClick = (alarm) => {
    setSelectedAlarm(alarm);
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alarm Management</h1>
          <p className="text-muted-foreground">
            Kelola alarm dan notifikasi untuk perangkat IoT Anda
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Alarm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Alarm Baru</DialogTitle>
              <DialogDescription>
                Buat alarm untuk memantau kondisi sensor secara real-time
              </DialogDescription>
            </DialogHeader>
            <AlarmForm
              onSubmit={handleCreateAlarm}
              onCancel={() => setShowCreateDialog(false)}
              isLoading={createAlarmMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alarm</p>
                <p className="text-2xl font-bold">{alarms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold">
                  {alarms.filter(a => a.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non-aktif</p>
                <p className="text-2xl font-bold">
                  {alarms.filter(a => !a.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Terakhir Dipicu</p>
                <p className="text-2xl font-bold">
                  {alarms.filter(a => a.last_triggered).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari alarm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alarms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Alarm</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Belum ada alarm</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchTerm || filterStatus !== "all" 
                  ? "Tidak ada alarm yang sesuai dengan filter"
                  : "Mulai dengan membuat alarm pertama Anda untuk memantau perangkat IoT"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Alarm</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Sensor</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notifikasi</TableHead>
                  <TableHead>Terakhir Dipicu</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlarms.map((alarm) => (
                  <TableRow key={alarm.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alarm.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Cooldown: {alarm.cooldown_minutes} menit
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">#{alarm.device_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {alarm.device_description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alarm.datastream_description}</p>
                        <p className="text-sm text-muted-foreground">
                          Pin: {alarm.datastream_pin} • {alarm.datastream_unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          {getOperatorText(alarm.operator)} <strong>{alarm.threshold}</strong>
                        </p>
                        <Badge 
                          variant={
                            getPriorityFromThreshold(alarm.operator, alarm.threshold) === 'high' 
                              ? 'destructive' 
                              : getPriorityFromThreshold(alarm.operator, alarm.threshold) === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {getPriorityFromThreshold(alarm.operator, alarm.threshold)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alarm.is_active}
                          onCheckedChange={() => handleToggleStatus(alarm.id)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <Badge variant={alarm.is_active ? "default" : "secondary"}>
                          {alarm.is_active ? "Aktif" : "Non-aktif"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {alarm.notification_whatsapp && (
                          <Badge variant="outline" className="text-xs">
                            WhatsApp
                          </Badge>
                        )}
                        {alarm.notification_browser && (
                          <Badge variant="outline" className="text-xs">
                            Browser
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alarm.last_triggered ? (
                        <div>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(alarm.last_triggered), { 
                              addSuffix: true, 
                              locale: id 
                            })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Belum pernah</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditClick(alarm)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(alarm)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Alarm</DialogTitle>
            <DialogDescription>
              Perbarui konfigurasi alarm Anda
            </DialogDescription>
          </DialogHeader>
          {selectedAlarm && (
            <AlarmForm
              defaultValues={selectedAlarm}
              onSubmit={handleEditAlarm}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedAlarm(null);
              }}
              isLoading={updateAlarmMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Alarm</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus alarm "{alarmToDelete?.description}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAlarmMutation.isPending}
            >
              {deleteAlarmMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Alarm Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAlarm ? "Edit Alarm" : "Buat Alarm Baru"}
            </DialogTitle>
            <DialogDescription>
              {selectedAlarm 
                ? "Perbarui pengaturan alarm yang sudah ada"
                : "Buat alarm baru untuk memantau kondisi sensor secara real-time"
              }
            </DialogDescription>
          </DialogHeader>
          
          <AlarmForm
            defaultValues={selectedAlarm}
            onSubmit={handleSubmitAlarm}
            onCancel={() => setIsDialogOpen(false)}
            isLoading={createAlarmMutation.isPending || updateAlarmMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
