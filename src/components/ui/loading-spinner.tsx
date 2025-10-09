import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = "Cargando...", className }: LoadingOverlayProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}>
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
