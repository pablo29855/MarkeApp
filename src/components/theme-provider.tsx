import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ThemeTransition } from './theme-transition'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  // setTheme accepts an optional options object. If userInitiated is true,
  // ThemeTransition will show the loader overlay.
  setTheme: (theme: Theme, options?: { userInitiated?: boolean }) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'markeapp-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey)
    if (storedTheme) {
      return storedTheme as Theme
    }
    // Primera vez: usar modo claro por defecto
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    root.classList.add(resolved)

    // Sincronizar el color de la barra del navegador (PWA) con el modo
    const meta = document.getElementById('theme-color-meta') as HTMLMetaElement | null
    if (meta) meta.content = resolved === 'dark' ? '#0e1119' : '#EDF2FF'

    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  const [userInitiated, setUserInitiated] = useState(false)

  const value: ThemeContextType = {
    theme,
    setTheme: (newTheme: Theme, options?: { userInitiated?: boolean }) => {
      if (options?.userInitiated) {
        setUserInitiated(true)
      }
      // Aplicar el tema directamente sin forzar re-mount
      setThemeState(newTheme)
    },
  }

  return (
    <ThemeContext.Provider value={value}>
      <ThemeTransition theme={theme} userInitiated={userInitiated} onDone={() => setUserInitiated(false)}>
        {children}
      </ThemeTransition>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
