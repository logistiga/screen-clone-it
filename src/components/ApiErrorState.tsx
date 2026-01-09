import { forwardRef, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractApiErrorInfo, formatApiErrorDebug } from "@/lib/api-error";

type ApiErrorStateProps = {
  title: string;
  error: unknown;
  onRetry?: () => void;
  variant?: "page" | "inline";
};

export const ApiErrorState = forwardRef<HTMLDivElement, ApiErrorStateProps>(function ApiErrorState(
  { title, error, onRetry, variant = "page" },
  ref
) {
  const info = useMemo(() => extractApiErrorInfo(error), [error]);
  const [showDetails, setShowDetails] = useState(false);

  const debugText = useMemo(() => formatApiErrorDebug(info), [info]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(debugText);
      toast.success("Détails copiés");
    } catch {
      toast.error("Impossible de copier les détails");
    }
  };

  const wrapperClass = variant === "page" ? "flex justify-center px-4 py-12" : "";
  const cardClass = variant === "page" ? "w-full max-w-3xl" : "w-full";

  return (
    <div ref={ref} className={wrapperClass}>
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-destructive">
                {info.status ? `HTTP ${info.status} — ` : ""}
                {info.message}
              </p>
              {info.hint && <p className="text-xs text-muted-foreground">{info.hint}</p>}
              {(info.method || info.url) && (
                <p className="text-xs text-muted-foreground break-words">
                  {info.method ? `${info.method} ` : ""}
                  {info.url || ""}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowDetails((v) => !v)}>
                {showDetails ? "Masquer les détails" : "Afficher les détails"}
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                Copier les détails
              </Button>
              {onRetry && <Button onClick={onRetry}>Réessayer</Button>}
            </div>

            {showDetails && (
              <pre className="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">{debugText}</pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
