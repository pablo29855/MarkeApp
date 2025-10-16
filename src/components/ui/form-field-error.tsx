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
      
      console.log('[FormFieldError] Show error:', error, 'submitAttempt:', submitAttempt)
      
      // Hacer scroll al campo con error y enfocarlo automáticamente
      if (fieldRef?.current) {
        console.log('[FormFieldError] fieldRef.current found:', fieldRef.current)
        
        // Usar requestAnimationFrame para mantener la "confianza" de iOS
        // y ejecutar en el mismo frame de renderizado
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
              console.log('[FormFieldError] focusElement called with:', element)
              
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
                console.log('[FormFieldError] Direct input/textarea element, focusing...')
                tryFocus(element)
                console.log('[FormFieldError] Focus attempts scheduled')
              } else if (element instanceof HTMLSelectElement) {
                console.log('[FormFieldError] Direct select element, focusing...')
                element.focus({ preventScroll: true })
                setTimeout(() => element.click(), 50)
                console.log('[FormFieldError] Focus applied to select successfully')
              } else if (element) {
                // Si es un contenedor, buscar el input dentro
                console.log('[FormFieldError] Container element, searching for input...')
                const input = element.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
                const select = element.querySelector('select') as HTMLSelectElement | null
                
                console.log('[FormFieldError] Found input:', input, 'select:', select)
                
                if (input) {
                  console.log('[FormFieldError] Input found, focusing...')
                  tryFocus(input)
                  console.log('[FormFieldError] Focus attempts scheduled for input')
                } else if (select) {
                  console.log('[FormFieldError] Select found, focusing...')
                  select.focus({ preventScroll: true })
                  setTimeout(() => select.click(), 50)
                  console.log('[FormFieldError] Focus applied to select successfully')
                } else {
                  console.log('[FormFieldError] No input/textarea/select found inside container')
                }
              }
            }
            
            focusElement(fieldRef.current)
          })
        })
      } else {
        console.log('[FormFieldError] No fieldRef.current')
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
