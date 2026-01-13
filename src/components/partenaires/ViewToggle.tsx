import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "grid";
  onChange: (view: "list" | "grid") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border bg-muted/50 p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("list")}
        className={cn(
          "h-8 w-8 p-0",
          view === "list" && "bg-background shadow-sm"
        )}
      >
        <List className="h-4 w-4" />
        <span className="sr-only">Vue liste</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("grid")}
        className={cn(
          "h-8 w-8 p-0",
          view === "grid" && "bg-background shadow-sm"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Vue grille</span>
      </Button>
    </div>
  );
}
