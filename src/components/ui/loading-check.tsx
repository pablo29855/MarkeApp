import { cn } from "@/lib/utils"

interface LoadingCheckProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingCheck({ size = "md", className }: LoadingCheckProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      {/* Anillo exterior giratorio */}
      <div className="absolute inset-0">
        <div className="w-full h-full rounded-full border-4 border-primary/20"></div>
        <div 
          className="absolute inset-0 w-full h-full rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin"
          style={{ animationDuration: "1s" }}
        ></div>
      </div>
      
      {/* Anillo medio giratorio inverso */}
      <div className="absolute inset-2">
        <div 
          className="w-full h-full rounded-full border-4 border-transparent border-b-primary/60 border-l-primary/60 animate-spin"
          style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
        ></div>
      </div>
      
      {/* Círculo central con pulso */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/3 h-1/3 rounded-full bg-gradient-to-br from-primary to-primary/80 animate-pulse shadow-lg"></div>
      </div>
    </div>
  )
}

interface LoadingCheckOverlayProps {
  message?: string
}

export function LoadingCheckOverlay({ message = "Cargando..." }: LoadingCheckOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="relative">
        <LoadingCheck size="lg" />
        
        {/* Partículas flotantes alrededor */}
        <div className="absolute -top-2 -left-2 w-2 h-2 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: "2s" }}></div>
        <div className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}></div>
        <div className="absolute -bottom-2 -left-2 w-2 h-2 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: "2.2s", animationDelay: "0.3s" }}></div>
        <div className="absolute -bottom-2 -right-2 w-2 h-2 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: "2.8s", animationDelay: "0.7s" }}></div>
      </div>
      
      <div className="text-center space-y-3">
        <p className="text-xl font-semibold text-foreground">{message}</p>
        
        {/* Barra de progreso animada */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary/60 to-primary rounded-full animate-pulse"
            style={{
              animation: "loading-bar 2s ease-in-out infinite",
            }}
          ></div>
        </div>
        
        <p className="text-sm text-muted-foreground animate-pulse">Por favor espera...</p>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0%, 100% {
            transform: translateX(-100%);
            opacity: 0.5;
          }
          50% {
            transform: translateX(100%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
