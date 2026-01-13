import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export function DevisCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-8 ml-auto" />
          </div>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        {/* Validité */}
        <div className="mb-3 space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-1.5 w-full" />
        </div>

        {/* Date */}
        <div className="flex justify-between mb-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DevisTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function DevisGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <DevisCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DevisTableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <DevisTableRowSkeleton key={i} />
      ))}
    </>
  );
}
