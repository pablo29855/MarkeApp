import * as React from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Combinar refs
    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleContainerClick = () => {
      if (inputRef.current) {
        inputRef.current.showPicker?.() // Abre el calendario nativo
      }
    }

    return (
      <div 
        className="relative cursor-pointer"
        onClick={handleContainerClick}
      >
        <input
          type="date"
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark] pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            className
          )}
          ref={inputRef}
          {...props}
        />
        <Calendar 
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
          aria-hidden="true"
        />
      </div>
    )
  }
)

DateInput.displayName = "DateInput"

export { DateInput }
