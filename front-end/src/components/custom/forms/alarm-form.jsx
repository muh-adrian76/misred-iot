"use client";
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deviceAPI } from "@/lib/api/device";
import { datastreamAPI } from "@/lib/api/datastream";

const alarmSchema = z.object({
  description: z.string().min(1, "Deskripsi harus diisi").max(255, "Deskripsi terlalu panjang"),
  device_id: z.number().min(1, "Device harus dipilih"),
  datastream_id: z.number().min(1, "Datastream harus dipilih"),
  operator: z.enum(['=', '<', '>', '<=', '>=', '!='], {
    required_error: "Operator harus dipilih",
  }),
  threshold: z.number().min(-999999, "Threshold terlalu kecil").max(999999, "Threshold terlalu besar"),
  cooldown_minutes: z.number().min(1, "Cooldown minimal 1 menit").max(1440, "Cooldown maksimal 24 jam").optional(),
  notification_whatsapp: z.boolean().optional(),
  notification_browser: z.boolean().optional(),
});

const operatorOptions = [
  { value: '>', label: 'Lebih besar dari (>)' },
  { value: '<', label: 'Lebih kecil dari (<)' },
  { value: '>=', label: 'Lebih besar atau sama dengan (>=)' },
  { value: '<=', label: 'Lebih kecil atau sama dengan (<=)' },
  { value: '=', label: 'Sama dengan (=)' },
  { value: '!=', label: 'Tidak sama dengan (!=)' },
];

export function AlarmForm({ defaultValues, onSubmit, onCancel, isLoading }) {
  const [selectedDevice, setSelectedDevice] = useState(defaultValues?.device_id || null);
  
  const form = useForm({
    resolver: zodResolver(alarmSchema),
    defaultValues: {
      description: defaultValues?.description || "",
      device_id: defaultValues?.device_id || null,
      datastream_id: defaultValues?.datastream_id || null,
      operator: defaultValues?.operator || ">",
      threshold: defaultValues?.threshold || 0,
      cooldown_minutes: defaultValues?.cooldown_minutes || 5,
      notification_whatsapp: defaultValues?.notification_whatsapp ?? true,
      notification_browser: defaultValues?.notification_browser ?? true,
    },
  });

  // Fetch devices
  const { data: devicesResponse } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceAPI.getAllUserDevices(),
  });

  // Fetch datastreams for selected device
  const { data: datastreamsResponse } = useQuery({
    queryKey: ['datastreams', selectedDevice],
    queryFn: () => datastreamAPI.getDatastreamsByDeviceId(selectedDevice),
    enabled: !!selectedDevice,
  });

  const devices = devicesResponse?.result || [];
  const datastreams = datastreamsResponse?.result || [];

  useEffect(() => {
    if (defaultValues?.device_id) {
      setSelectedDevice(defaultValues.device_id);
    }
  }, [defaultValues]);

  const handleDeviceChange = (deviceId) => {
    const numericDeviceId = parseInt(deviceId);
    setSelectedDevice(numericDeviceId);
    form.setValue('device_id', numericDeviceId);
    form.setValue('datastream_id', null); // Reset datastream when device changes
  };

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  const selectedDeviceData = devices.find(d => d.id === selectedDevice);
  const selectedDatastream = datastreams.find(d => d.id === form.watch('datastream_id'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Alarm Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Alarm</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: Suhu Ruangan Tinggi"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Berikan nama yang deskriptif untuk alarm ini
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Device Selection */}
        <FormField
          control={form.control}
          name="device_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Device</FormLabel>
              <Select 
                onValueChange={handleDeviceChange}
                value={selectedDevice?.toString() || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih device" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>#{device.id} - {device.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {device.protocol}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih device yang akan dimonitor
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Device Info */}
        {selectedDeviceData && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Board Type</Label>
                  <p>{selectedDeviceData.board_type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Protocol</Label>
                  <p>{selectedDeviceData.protocol}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={selectedDeviceData.status === 'online' ? 'default' : 'secondary'}>
                    {selectedDeviceData.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Firmware</Label>
                  <p>{selectedDeviceData.firmware_version || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datastream Selection */}
        <FormField
          control={form.control}
          name="datastream_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sensor/Datastream</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={!selectedDevice}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedDevice ? "Pilih sensor" : "Pilih device terlebih dahulu"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {datastreams.map((datastream) => (
                    <SelectItem key={datastream.id} value={datastream.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{datastream.description}</span>
                        <Badge variant="outline" className="text-xs">
                          Pin {datastream.pin}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {datastream.unit}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih sensor yang akan dimonitor untuk alarm ini
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Datastream Info */}
        {selectedDatastream && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p>{selectedDatastream.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Range</Label>
                  <p>{selectedDatastream.min_value} - {selectedDatastream.max_value}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Default</Label>
                  <p>{selectedDatastream.default_value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Condition Configuration */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Kondisi Alarm</Label>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Operator */}
            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih operator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {operatorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Threshold */}
            <FormField
              control={form.control}
              name="threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nilai Threshold {selectedDatastream && `(${selectedDatastream.unit})`}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Condition Preview */}
          {form.watch('operator') && form.watch('threshold') !== undefined && selectedDatastream && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <Label className="text-muted-foreground">Preview Kondisi:</Label>
                <p className="font-medium">
                  Alarm akan dipicu ketika <span className="text-blue-600 font-semibold">
                    {selectedDatastream.description}
                  </span> {operatorOptions.find(op => op.value === form.watch('operator'))?.label.toLowerCase()} <span className="text-blue-600 font-semibold">
                    {form.watch('threshold')} {selectedDatastream.unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Alarm Settings */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Pengaturan Alarm</Label>
          
          {/* Cooldown */}
          <FormField
            control={form.control}
            name="cooldown_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cooldown (menit)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="5"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Jeda waktu minimum antara notifikasi alarm (1-1440 menit)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notification Options */}
          <div className="space-y-4">
            <Label>Metode Notifikasi</Label>
            
            <FormField
              control={form.control}
              name="notification_whatsapp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">WhatsApp</FormLabel>
                    <FormDescription>
                      Kirim notifikasi via WhatsApp saat alarm dipicu
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notification_browser"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Browser</FormLabel>
                    <FormDescription>
                      Tampilkan notifikasi di browser saat alarm dipicu
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : defaultValues ? "Perbarui" : "Buat Alarm"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
