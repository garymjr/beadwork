import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:-translate-y-px hover:bg-destructive/90 active:scale-[0.98] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        outline:
          "border-2 border-input bg-background hover:bg-surface-elevated hover:border-primary/50 hover:-translate-y-px active:scale-[0.98] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:-translate-y-px hover:bg-secondary/80 active:scale-[0.98] active:translate-y-0 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ghost: "hover:bg-surface-elevated hover:-translate-y-px active:scale-[0.98] active:translate-y-0 focus-visible:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        link: "text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, onClick, ...props }, ref) => {
    const [ripple, setRipple] = React.useState<React.ReactNode>(null)
    const internalRef = React.useRef<HTMLButtonElement>(null)

    // Handle refs properly
    React.useImperativeHandle(ref, () => internalRef.current!)
    React.useEffect(() => {
      if (typeof ref === 'function' && internalRef.current) {
        ref(internalRef.current)
      }
    }, [ref])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!internalRef.current || props.disabled) return

      const button = internalRef.current
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const newRipple = (
        <span
          key={Date.now()}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: x,
            top: y,
            width: '100px',
            height: '100px',
            marginLeft: '-50px',
            marginTop: '-50px',
          }}
        />
      )

      setRipple(newRipple)
      setTimeout(() => setRipple(null), 600)

      onClick?.(e)
    }

    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={internalRef}
        onClick={handleClick}
        {...props}
      >
        {children}
        {ripple}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
