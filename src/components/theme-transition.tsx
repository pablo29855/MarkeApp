import { useEffect } from 'react'

interface ThemeTransitionProps {
  children: React.ReactNode
  theme: string
  userInitiated?: boolean
  // onDone se llama cuando termina la transición para resetear el flag en el provider
  onDone?: () => void
}

export function ThemeTransition({ children, userInitiated = false, onDone }: ThemeTransitionProps) {
  useEffect(() => {
    // Solo llamamos onDone si fue iniciado por el usuario
    if (userInitiated) {
      // Pequeño delay para permitir que el tema se aplique suavemente
      const timer = setTimeout(() => {
        onDone?.()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [userInitiated, onDone])

  // Simplemente renderizamos los children sin overlay
  return <>{children}</>
}