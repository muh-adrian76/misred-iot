import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function DeleteAlarmForm({
  open,
  setOpen,
  alarmToDelete,
  setDevices,
  toast
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Alarm?</DialogTitle>
          <DialogDescription>
            Apakah kamu yakin ingin menghapus alarm <strong>{alarmToDelete?.sensorName}</strong> dari <strong>{alarmToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!alarmToDelete) return
              setDevices(prev =>
                prev.map(device =>
                  device.name === alarmToDelete.name
                    ? {
                        ...device,
                        sensors: device.sensors.map(s =>
                          s.id === alarmToDelete.id
                            ? { ...s, threshold: "" }
                            : s
                        )
                      }
                    : device
                )
              )
              setOpen(false)
              toast.success("Alarm berhasil dihapus!")
            }}
          >
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}