import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AddAlarmForm({
  open,
  setOpen,
  sensorName,
  setsensorName,
  name,
  setName,
  threshold,
  setthreshold,
  handleAddAlarm,
  flatData,
  devices,
  toast
}) {
  // Ambil daftar device unik
  const deviceOptions = (devices ?? []).map(device => device.name)
  // Ambil daftar sensor unik dari device terpilih
  const selectedDevice = (devices ?? []).find(device => device.name === name)
  const sensorOptions = selectedDevice
    ? selectedDevice.sensors.map(sensor => sensor.sensorName)
    : []

  const handleAdd = () => {
    if (!name || !sensorName || !threshold) {
      toast.error("Semua field harus diisi!")
      return
    }
    // Cek sensor sudah ada dan threshold-nya TIDAK kosong
    if (
      selectedDevice &&
      selectedDevice.sensors.some(
        s => s.sensorName === sensorName && s.threshold !== ""
      )
    ) {
      toast.error("Alarm untuk sensor ini sudah ada pada device tersebut!")
      return
    }
    handleAddAlarm()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-2">Add Alarm</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Alarm</DialogTitle>
          <DialogDescription>
            Tambahkan alarm baru untuk sensor pada device.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deviceName" className="text-right">Device</Label>
            <Select value={name} onValueChange={setName}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Device" />
              </SelectTrigger>
              <SelectContent>
                {deviceOptions.map(deviceName => (
                  <SelectItem key={deviceName} value={deviceName}>{deviceName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sensorName" className="text-right">Sensor</Label>
            <Select value={sensorName} onValueChange={setsensorName} disabled={!name}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih Sensor" />
              </SelectTrigger>
              <SelectContent>
                {sensorOptions.map(sensor => (
                  <SelectItem key={sensor} value={sensor}>{sensor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="threshold" className="text-right">Threshold</Label>
            <Input
              id="threshold"
              value={threshold}
              onChange={e => setthreshold(e.target.value)}
              className="col-span-3"
              placeholder="Threshold"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAdd}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}