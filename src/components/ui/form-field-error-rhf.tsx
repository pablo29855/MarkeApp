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
      
      // Hacer scroll al campo con error y enfocarlo automáticamente
      if (fieldRef?.current) {
        // Usar requestAnimationFrame para mantener la "confianza" de iOS
        requestAnimationFrame(() => {
          if (!fieldRef.current) return
          
          fieldRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
          
          // Segundo frame para asegurar que el scroll terminó
          requestAnimationFrame(() => {
            if (!fieldRef.current) return
            
            // Enfocar el campo automáticamente con múltiples intentos para móvil
            const focusElement = (element: HTMLElement) => {
              const tryFocus = (el: HTMLInputElement | HTMLTextAreaElement) => {
                // Múltiples intentos con diferentes técnicas para iOS
                const wasReadOnly = el.readOnly
                
                // Intento 1: Focus directo
                el.readOnly = false
                el.focus({ preventScroll: true })
                el.readOnly = wasReadOnly
                
                // Intento 2: Con click después de un micro-delay
                setTimeout(() => {
                  el.readOnly = false
                  el.click()
                  el.focus()
                  el.readOnly = wasReadOnly
                  
                  // Seleccionar texto
                  try {
                    el.setSelectionRange(el.value.length, el.value.length)
                  } catch (e) {
                    // Ignorar errores
                  }
                }, 50)
                
                // Intento 3: Focus adicional con más delay
                setTimeout(() => {
                  el.readOnly = false
                  el.focus()
                  el.click()
                  el.readOnly = wasReadOnly
                }, 100)
              }
              
              if (element instanceof HTMLInputElement || 
                  element instanceof HTMLTextAreaElement) {
                tryFocus(element)
              } else if (element instanceof HTMLSelectElement) {
                element.focus({ preventScroll: true })
                setTimeout(() => element.click(), 50)
              } else if (element) {
                // Si es un contenedor, buscar el input dentro
                const input = element.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
                const select = element.querySelector('select') as HTMLSelectElement | null
                
                if (input) {
                  tryFocus(input)
                } else if (select) {
                  select.focus({ preventScroll: true })
                  setTimeout(() => select.click(), 50)
                }
              }
            }
            
            focusElement(fieldRef.current)
          })
        })
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
