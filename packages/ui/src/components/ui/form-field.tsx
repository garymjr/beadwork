import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode
}

export function FormField({ label, error, required, description, children }: FormFieldProps) {
  const id = React.useId()
  const errorId = `${id}-error`
  const descriptionId = `${id}-description`

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": error ? errorId : description ? descriptionId : undefined,
      })}
      {description && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive flex items-center gap-1 animate-shake">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function ValidatedInput({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border-2 border-border bg-background px-3 py-2 text-base transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:border-[2.5px] focus-visible:shadow-[0_0_0_3px_hsl(var(--color-primary-subtle))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        error && "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_3px_hsl(var(--color-destructive)_/_0.2)] focus-visible:ring-destructive",
        className
      )}
      {...props}
    />
  )
}
