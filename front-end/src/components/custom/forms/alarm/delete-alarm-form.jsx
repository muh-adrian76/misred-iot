import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteAlarmForm({ open, setOpen, alarmToDelete, handleDeleteAlarm }) {
  if (!alarmToDelete) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Alarm?</DialogTitle>
          <DialogDescription>
            Apakah kamu yakin ingin menghapus alarm <strong>{alarmToDelete.description}</strong>? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              handleDeleteAlarm(alarmToDelete.id);
              setOpen(false);
            }}
          >
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}