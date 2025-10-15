import { useEffect, useState } from 'react'
import { LoadingCheckOverlay } from './ui/loading-check'

interface ThemeTransitionProps {
  children: React.ReactNode
  theme: string
  userInitiated?: boolean
  // onDone se llama cuando termina la transición para resetear el flag en el provider
  onDone?: () => void
}

export function ThemeTransition({ children, theme, userInitiated = false, onDone }: ThemeTransitionProps) {
  const [isChanging, setIsChanging] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    // Solo mostramos el loader si el cambio fue iniciado por el usuario
    if (!userInitiated) {
      // Si no fue iniciado por el usuario, no mostramos nada y simplemente renderizamos children
      return
    }

    setIsChanging(true)
    setShowLoader(true)

    const hideTimer = setTimeout(() => {
      setShowLoader(false)
      setTimeout(() => {
        setIsChanging(false)
        onDone?.()
      }, 300)
    }, 1000)

    return () => clearTimeout(hideTimer)
  }, [theme, userInitiated, onDone])

  if (isChanging) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-all duration-300 ${
          showLoader ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <LoadingCheckOverlay message="Cambiando tema..." />
      </div>
    )
  }

  return <>{children}</>
}