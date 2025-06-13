import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export default function AddDeviceForm({
  open,
  setOpen,
  name,
  setName,
  boardType,
  setBoardType,
  protocol,
  setProtocol,
  handleAddDevice
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="ml-auto">Tambah Device</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Device</DialogTitle>
          <DialogDescription>
            Add your device here. Click add when you're done.
          </DialogDescription>
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
              Type Board
            </Label>
            <Input id="boardType" value={boardType} onChange={(e) => setBoardType(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="protocol" className="text-right">
              Protocol
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
          <Button type="button" onClick={handleAddDevice}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}