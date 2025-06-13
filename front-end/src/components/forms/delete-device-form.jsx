import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function DeleteDeviceForm({
  open,
  setOpen,
  deviceToDelete,
  setData,
  toast
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Device?</DialogTitle>
          <DialogDescription>
            Apakah kamu yakin ingin menghapus device <strong>{deviceToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setData((prev) =>
                prev.filter((item) => item.id !== deviceToDelete.id)
              )
              setOpen(false)
              toast.success("Device berhasil dihapus!")
            }}
          >
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}