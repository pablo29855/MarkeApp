import { cn } from "@/lib/utils"

interface LoadingCheckProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingCheck({ size = "md", className }: LoadingCheckProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  }

  const checkSizeClasses = {
    sm: "w-6 h-3",
    md: "w-10 h-5",
    lg: "w-16 h-8",
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Círculo exterior con animación de pulso */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/70 animate-pulse shadow-lg" />
      
      {/* Círculo giratorio */}
      <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      
      {/* Check animado en el centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          "border-l-4 border-b-4 border-white animate-scale-in",
          checkSizeClasses[size]
        )} 
        style={{ 
          transform: "rotate(-45deg)",
          transformOrigin: "bottom left",
        }} 
        />
      </div>
    </div>
  )
}

interface LoadingCheckOverlayProps {
  message?: string
}

export function LoadingCheckOverlay({ message = "Cargando..." }: LoadingCheckOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <LoadingCheck size="lg" />
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground animate-pulse">{message}</p>
        <div className="flex gap-1 justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  )
}
