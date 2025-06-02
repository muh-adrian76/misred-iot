import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { user } from "@/components/features/app-sidebar" // pastikan user diimport jika perlu

export default function EditDeviceDialog({
  open,
  setOpen,
  editDevice,
  setEditDevice,
  setData,
  toast
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              // Ambil UID lama
              const oldUid = editDevice.uid || ""
              // Pisahkan UID lama: [user]-[device]-[id]
              const parts = oldUid.split("-")
              // Ganti bagian nama device saja
              if (parts.length >= 3) {
                const formattedDevice = editDevice.name.toLowerCase().replace(/\s+/g, "-")
                parts[1] = formattedDevice
              }
              const newUid = parts.join("-")

              setData((prev) =>
                prev.map((d) =>
                  d.id === editDevice.id
                    ? { ...editDevice, uid: newUid }
                    : d
                )
              )
              setOpen(false)
              toast.success("Device berhasil diperbarui!")
            }}
          >
            Save Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}