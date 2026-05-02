import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function SettingsDialog() {
  const { settings, updateSettings } = useSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          aria-label="Open settings"
          className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:scale-105 hover:text-primary"
        >
          <SettingsIcon className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Study Settings</DialogTitle>
          <DialogDescription>
            Configure your study session and new card defaults.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="session-length" className="text-right">
              Session Length
            </Label>
            <Input
              id="session-length"
              type="number"
              min={1}
              value={settings.studySessionLength}
              onChange={(event) =>
                updateSettings({
                  studySessionLength: Math.max(
                    1,
                    Number.parseInt(event.target.value, 10) || 1,
                  ),
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="default-template" className="text-right">
              Default Template
            </Label>
            <Select
              value={settings.newCardTemplate}
              onValueChange={(value) => updateSettings({ newCardTemplate: value })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Definition">Definition</SelectItem>
                <SelectItem value="Formula">Formula</SelectItem>
                <SelectItem value="Q&A">Q&A</SelectItem>
                <SelectItem value="Diagram">Diagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="default-tag" className="text-right">
              Default Tag
            </Label>
            <Input
              id="default-tag"
              value={settings.newCardTag}
              onChange={(event) => updateSettings({ newCardTag: event.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="button">Close</Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      );
    }
