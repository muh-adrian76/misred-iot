"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const chartTypes = ["area", "bar", "pie", "line"]

export function AddChartForm({
  open,
  setOpen,
  existingTabs = [],
  onAddChart,
  createDashboard,
  dashboards,
}) {
  const [step, setStep] = useState(1);
  const [selectedTab, setSelectedTab] = useState("");
  const [newTab, setNewTab] = useState("");
  const [selectedChart, setSelectedChart] = useState("");

  const handleNext = () => {
    if (!selectedTab && !newTab) {
      toast.error("Select a tab or create a new tab");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    const tab = selectedTab || newTab;

    try {
      let dashboardId;

      if (newTab) {
        dashboardId = await createDashboard(newTab);
      } else {
        const dashboard = dashboards.find((d) => d.name === tab);
        if (!dashboard) {
          throw new Error("Dashboard tidak ditemukan");
        }
        dashboardId = dashboard.id;
      }

      onAddChart(tab, selectedChart, dashboardId);

      setStep(1);
      setSelectedTab("");
      setNewTab("");
      setSelectedChart("");
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menambahkan chart");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="gap-0">
        <SheetHeader>
          <SheetTitle>
            {step === 1 ? "Choose / Create New Tab" : "Choose Chart Type"}
          </SheetTitle>
        </SheetHeader>
        {step === 1 ? (
          <div className="space-y-4 mt-4 p-4">
            {existingTabs.length > 0 && (
              <div>
                <Label>Choose Tab</Label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedTab}
                  onChange={(e) => {
                    setSelectedTab(e.target.value);
                    setNewTab("");
                  }}
                >
                  <option value="">-- Choose Tab --</option>
                  {existingTabs.map((tab) => (
                    <option key={tab} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {existingTabs.length > 0 && (
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-muted" />
                <span className="mx-2 text-muted-foreground text-sm">Or</span>
                <div className="flex-grow border-t border-muted" />
              </div>
            )}
            <div>
              <Label className="mb-3">Create a new tab</Label>
              <Input
                value={newTab}
                onChange={(e) => {
                  setNewTab(e.target.value);
                  setSelectedTab("");
                }}
                placeholder="Tab Name"
              />
            </div>

            <SheetFooter>
              <Button onClick={handleNext}>Next</Button>
            </SheetFooter>
          </div>
        ) : (
          <div className="space-y-4 mt-4 p-4">
            <Label>Select Chart Type</Label>
            <div className="grid grid-cols-2 gap-4">
              {chartTypes.map((type) => (
                <Button
                  key={type}
                  variant={selectedChart === type ? "default" : "outline"}
                  onClick={() => setSelectedChart(type)}
                >
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>
            <SheetFooter className="mt-4">
              <Button disabled={!selectedChart} onClick={handleSubmit}>
                Add Chart
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}