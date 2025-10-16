import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface FormFieldErrorProps {
  error?: string
  show?: boolean
  fieldRef?: React.RefObject<HTMLElement>
  className?: string
  submitAttempt?: number
}

/**
 * Componente de error flotante para formularios manuales
 * Muestra tooltips flotantes similares a las validaciones nativas del navegador
 * Se renderiza directamente en el DOM sin Portal para mantener posición en móvil
 */
export function FormFieldError({ error, show = false, fieldRef, className, submitAttempt }: FormFieldErrorProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (show && error) {
      setShowTooltip(true)
      
      // Hacer scroll al campo con error cada vez que se muestra
      if (fieldRef?.current) {
        setTimeout(() => {
          fieldRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }, 100)
      }

      // Auto-ocultar después de 3 segundos
      const timer = setTimeout(() => {
        setShowTooltip(false)
      }, 3000)

      return () => {
        clearTimeout(timer)
      }
    } else {
      setShowTooltip(false)
    }
  }, [show, error, submitAttempt, fieldRef])

  if (!error || !show || !showTooltip) return null

  return (
    <div
      className={cn(
        "absolute -top-[52px] left-0 right-0 z-[9999] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 pointer-events-none",
        className
      )}
    >
      <div className="bg-red-500 text-white px-3 py-2 rounded-md shadow-xl flex items-center gap-2 text-sm font-medium border border-red-600">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
      {/* Flecha apuntando al campo */}
      <div 
        className="absolute left-6 -bottom-1 w-2 h-2 bg-red-500 transform rotate-45 border-r border-b border-red-600"
      />
    </div>
  )
}
