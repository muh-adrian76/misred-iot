import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EditAlarmForm({
  open,
  setOpen,
  editAlarm,
  setEditAlarm,
  devices,
  setDevices,
  toast
}) {
  if (!editAlarm) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Alarm</DialogTitle>
          <DialogDescription>Edit threshold sensor pada device.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Sensor</Label>
            <Input
              value={editAlarm.sensorName || ""}
              disabled
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editThreshold" className="text-right">Threshold</Label>
            <Input
              id="editThreshold"
              value={editAlarm.threshold || ""}
              onChange={e => setEditAlarm({ ...editAlarm, threshold: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!editAlarm.threshold) {
                toast.error("Threshold harus diisi!")
                return
              }
              const deviceIndex = devices.findIndex(d => d.name === editAlarm.name)
              if (deviceIndex === -1) return
              const sensorIndex = devices[deviceIndex].sensors.findIndex(s => s.id === editAlarm.id)
              if (sensorIndex === -1) return

              const updatedDevices = [...devices]
              updatedDevices[deviceIndex].sensors[sensorIndex] = { ...editAlarm }
              delete updatedDevices[deviceIndex].sensors[sensorIndex].name // optional cleanup
              setDevices(updatedDevices)
              setOpen(false)
              toast.success("Threshold berhasil diperbarui!")
            }}
          >
            Save Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}