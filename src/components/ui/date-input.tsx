import * as React from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full max-w-full">
        <input
          ref={ref}
          type="date"
          data-slot="input"
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
          }}
          className={cn(
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full max-w-full min-w-0 rounded-md border bg-transparent pl-3 pr-10 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            'dark:[color-scheme:dark]',
            '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:m-0',
            '[&::-webkit-datetime-edit]:pr-0 [&::-webkit-datetime-edit]:max-w-full',
            '[&::-webkit-datetime-edit-fields-wrapper]:pr-0 [&::-webkit-datetime-edit-fields-wrapper]:max-w-full',
            '[&::-webkit-inner-spin-button]:appearance-none',
            '[&::-webkit-outer-spin-button]:appearance-none',
            className,
          )}
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

DateInput.displayName = 'DateInput'

export { DateInput }
