import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FieldError } from "react-hook-form"

interface FormFieldErrorRHFProps {
  error?: FieldError
  fieldRef?: React.RefObject<HTMLElement>
  className?: string
  fieldName?: string
  showFieldError?: string | null
  submitAttempt?: number
}

/**
 * Componente de error flotante para react-hook-form
 * Muestra tooltips flotantes similares a las validaciones nativas del navegador
 * Se renderiza directamente en el DOM sin Portal para mantener posición en móvil
 */
export function FormFieldErrorRHF({ error, fieldRef, className, fieldName, showFieldError, submitAttempt }: FormFieldErrorRHFProps) {
  const [show, setShow] = useState(false)

  // Si se especifica showFieldError, solo mostrar si coincide con fieldName
  const shouldShow = showFieldError === fieldName

  useEffect(() => {
    if (error?.message && shouldShow) {
      setShow(true)
      
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
        setShow(false)
      }, 3000)

      return () => {
        clearTimeout(timer)
      }
    } else {
      setShow(false)
    }
  }, [shouldShow, error?.message, submitAttempt])

  if (!error?.message || !show || !shouldShow) return null

  return (
    <div
      className={cn(
        "absolute -top-[52px] left-0 right-0 z-[9999] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 pointer-events-none",
        className
      )}
    >
      <div className="bg-red-500 text-white px-3 py-2 rounded-md shadow-xl flex items-center gap-2 text-sm font-medium border border-red-600">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error.message}</span>
      </div>
      {/* Flecha apuntando al campo */}
      <div 
        className="absolute left-6 -bottom-1 w-2 h-2 bg-red-500 transform rotate-45 border-r border-b border-red-600"
      />
    </div>
  )
}
