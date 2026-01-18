import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfiniteScrollLoaderProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean | undefined;
  loadedCount: number;
  totalCount: number;
  onLoadMore?: () => void;
}

export const InfiniteScrollLoader = forwardRef<HTMLDivElement, InfiniteScrollLoaderProps>(
  function InfiniteScrollLoader(
    { isFetchingNextPage, hasNextPage, loadedCount, totalCount, onLoadMore },
    ref
  ) {
    if (!hasNextPage && loadedCount > 0) {
      return (
        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
          <span>Tous les éléments chargés ({totalCount})</span>
        </div>
      );
    }

    return (
      <div ref={ref} className="flex flex-col items-center justify-center py-6 gap-3">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : hasNextPage ? (
          <>
            <span className="text-sm text-muted-foreground">
              {loadedCount} sur {totalCount} éléments
            </span>
            {onLoadMore && (
              <Button variant="outline" size="sm" onClick={onLoadMore}>
                Charger plus
              </Button>
            )}
          </>
        ) : null}
      </div>
    );
  }
);

InfiniteScrollLoader.displayName = "InfiniteScrollLoader";
