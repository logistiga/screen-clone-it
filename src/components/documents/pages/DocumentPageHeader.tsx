import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AutoSaveIndicator } from "@/components/devis/shared";

interface DocumentPageHeaderProps {
  mode: "create" | "edit";
  backTo: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Edit mode only */
  statut?: string;
  statutBadgeMap?: Record<string, { className: string; label: string }>;
  /** Create mode only */
  autoSave?: {
    hasDraft: boolean;
    lastSaved: Date | null;
    isSaving: boolean;
    onRestore: () => void;
    onClear: () => void;
  };
}

export default function DocumentPageHeader({
  mode,
  backTo,
  icon,
  title,
  subtitle,
  statut,
  statutBadgeMap,
  autoSave,
}: DocumentPageHeaderProps) {
  const navigate = useNavigate();
  const badge =
    mode === "edit" && statut && statutBadgeMap
      ? statutBadgeMap[statut] ?? statutBadgeMap.brouillon
      : null;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate(backTo)}
            className="transition-all duration-200 hover:scale-110"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {icon}
                {title}
              </h1>
              {badge && (
                <Badge
                  variant="outline"
                  className={`${badge.className} transition-all duration-200 hover:scale-105`}
                >
                  {badge.label}
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
          </div>
        </div>
        {mode === "create" && autoSave && (
          <AutoSaveIndicator
            hasDraft={autoSave.hasDraft}
            lastSaved={autoSave.lastSaved}
            isSaving={autoSave.isSaving}
            onRestore={autoSave.onRestore}
            onClear={autoSave.onClear}
          />
        )}
      </div>
    </div>
  );
}

export const DEVIS_STATUT_BADGES: Record<string, { className: string; label: string }> = {
  brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300", label: "Brouillon" },
  envoye: { className: "bg-blue-100 text-blue-700 border-blue-300", label: "Envoyé" },
  accepte: { className: "bg-green-100 text-green-700 border-green-300", label: "Accepté" },
  refuse: { className: "bg-red-100 text-red-700 border-red-300", label: "Refusé" },
  expire: { className: "bg-orange-100 text-orange-700 border-orange-300", label: "Expiré" },
  converti: { className: "bg-purple-100 text-purple-700 border-purple-300", label: "Converti" },
};
