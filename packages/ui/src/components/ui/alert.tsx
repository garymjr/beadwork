import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 transition-all duration-300 ease-out [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive:
          "border-destructive/50 text-destructive bg-destructive/10 animate-shake [&>svg]:text-destructive",
        success:
          "border-success/50 text-success bg-success/10 animate-success-flash [&>svg]:text-success",
        warning:
          "border-warning/50 text-warning bg-warning/10 [&>svg]:text-warning",
        info:
          "border-info/50 text-info bg-info/10 [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

// Helper components for common alert patterns
const ErrorAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode }
>(({ className, title, action, children, ...props }, ref) => (
  <Alert ref={ref} variant="destructive" className={cn(className)} {...props}>
    <AlertCircle className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>
      {children}
    </AlertDescription>
    {action && <div className="mt-2">{action}</div>}
  </Alert>
))
ErrorAlert.displayName = "ErrorAlert"

const SuccessAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode }
>(({ className, title, action, children, ...props }, ref) => (
  <Alert ref={ref} variant="success" className={cn(className)} {...props}>
    <CheckCircle className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>
      {children}
    </AlertDescription>
    {action && <div className="mt-2">{action}</div>}
  </Alert>
))
SuccessAlert.displayName = "SuccessAlert"

const WarningAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode }
>(({ className, title, action, children, ...props }, ref) => (
  <Alert ref={ref} variant="warning" className={cn(className)} {...props}>
    <AlertTriangle className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>
      {children}
    </AlertDescription>
    {action && <div className="mt-2">{action}</div>}
  </Alert>
))
WarningAlert.displayName = "WarningAlert"

const InfoAlert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { title?: string; action?: React.ReactNode }
>(({ className, title, action, children, ...props }, ref) => (
  <Alert ref={ref} variant="info" className={cn(className)} {...props}>
    <Info className="h-4 w-4" />
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>
      {children}
    </AlertDescription>
    {action && <div className="mt-2">{action}</div>}
  </Alert>
))
InfoAlert.displayName = "InfoAlert"

export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  ErrorAlert,
  SuccessAlert,
  WarningAlert,
  InfoAlert,
}
