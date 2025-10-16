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
    return 'light'
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  const [transitionKey, setTransitionKey] = useState(0)
  const [userInitiated, setUserInitiated] = useState(false)

  const value: ThemeContextType = {
    theme,
    setTheme: (newTheme: Theme, options?: { userInitiated?: boolean }) => {
      if (options?.userInitiated) {
        setUserInitiated(true)
      }
      // Forzamos la transición incluso si el tema es el mismo
      setTransitionKey(prev => prev + 1)
      setThemeState(newTheme)
    },
  }

  return (
    <ThemeContext.Provider value={value}>
      <ThemeTransition key={transitionKey} theme={theme} userInitiated={userInitiated} onDone={() => setUserInitiated(false)}>
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
