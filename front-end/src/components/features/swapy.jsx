import { WidthProvider, Responsive } from "react-grid-layout"
import { ChartDataArea } from "@/components/charts/area"
import { ChartDataBar } from "@/components/charts/bar"
import { ChartDataPie } from "@/components/charts/pie"
import { ChartDataLine } from "@/components/charts/line"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Move } from "lucide-react"
import { toast } from "sonner"

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

const chartComponents = {
  area: ChartDataArea,
  bar: ChartDataBar,
  pie: ChartDataPie,
  line: ChartDataLine,
}

export function SwapyDragArea({
  openSheet,
  setOpenSheet,
  items,
  setItems,
  layouts,
  setLayouts,
  activeTab,
}) {
  const handleAddChart = (type) => {
    const id = `${type}-${Date.now()}`
    const defaultLayoutItem = {
      i: id,
      x: (items.length * 2) % 12,
      y: Infinity,
      w: 3,
      h: 2,
    }

    setItems([...items, { id, type }])
    setLayouts({
      ...layouts,
      lg: [...(layouts.lg || []), defaultLayoutItem],
    })

    toast.success(`Chart ${type.toUpperCase()} berhasil ditambahkan pada ${activeTab}`)
    setTimeout(() => {
      setOpenSheet(false)
    }, 100)
  }

  const handleRemoveChart = (id) => {
    setItems(items.filter((item) => item.id !== id))
    setLayouts({
      ...layouts,
      lg: (layouts.lg || []).filter((layout) => layout.i !== id),
    })
    toast.error(`Chart successfully removed from "${activeTab}" tab`)
  }

  const onLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts)
  }

  return (
    <div className="space-y-4">
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Choose Chart</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Object.entries(chartComponents).map(([type]) => (
              <Button
                key={type}
                onClick={() => handleAddChart(type)}
                variant="outline"
              >
                Add {type}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        breakpoints={{ lg: 1024, md: 768, sm: 480 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={100}
        margin={[16, 16]}
        isResizable={true}
        isDraggable={true}
        draggableHandle=".drag-handle"
      >
        {items.map((item) => {
          const ChartComponent = chartComponents[item.type]
          return (
            <div key={item.id} className="relative group">
              <div className="h-full w-full bg-white rounded-xl shadow flex flex-col overflow-hidden relative">
                {/* Header: Tombol drag + delete */}
                <div className="flex items-center justify-between px-2 py-1 bg-muted border-b rounded-t-xl">
                  <div className="drag-handle flex items-center cursor-move text-muted-foreground">
                    <Move className="w-4 h-4 mr-3" />
                    Ketuk disini
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveChart(item.id)
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Chart Content */}
                <div className="flex-1 p-4 overflow-hidden">
                  <ChartComponent />
                </div>
              </div>
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}