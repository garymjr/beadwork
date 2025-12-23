import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Checkbox } from "./checkbox"
import { RadioGroup, RadioGroupItem } from "./radio-group"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card"
import { Card3D } from "./card-3d"
import { Skeleton } from "./skeleton"
import { Spinner } from "./spinner"
import { Progress } from "./progress"
import { ErrorAlert, SuccessAlert, WarningAlert, InfoAlert } from "./alert"
import { ConnectionStatus } from "./connection-status"
import { FormField, ValidatedInput } from "./form-field"
import { toast, Toaster } from "./sonner"

export function ComponentDemo() {
  const [progress, setProgress] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected" | "error">("connected")
  const [isChecked, setIsChecked] = useState(false)
  const [radioValue, setRadioValue] = useState("option1")

  const simulateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          toast.success("Operation completed!")
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const simulateError = () => {
    toast.error("Something went wrong!")
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <Toaster position="top-right" />

      {/* Buttons with Ripple Effect */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Micro-interactions</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => toast.success("Button clicked!")}>Click for Ripple</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      {/* Form Elements with Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Elements</h2>

        <div className="grid gap-4">
          <Input placeholder="Focus me to see the border expansion" />

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              id="checkbox-demo"
            />
            <label htmlFor="checkbox-demo" className="text-sm">
              Check me for animated checkmark
            </label>
          </div>

          <RadioGroup value={radioValue} onValueChange={setRadioValue}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option1" id="option1" />
              <label htmlFor="option1" className="text-sm">Option 1</label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="option2" id="option2" />
              <label htmlFor="option2" className="text-sm">Option 2</label>
            </div>
          </RadioGroup>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading States</h2>

        <div className="space-y-4">
          {/* Spinner */}
          <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm">{progress}%</span>
            </div>
            <Progress value={progress} />
            <Button onClick={simulateProgress} size="sm">Simulate Progress</Button>
          </div>

          {/* Skeleton Loading */}
          <div className="space-y-2">
            <Skeleton variant="shimmer" className="h-4 w-full" />
            <Skeleton variant="shimmer" className="h-4 w-3/4" />
            <Skeleton variant="shimmer" className="h-32 w-full" />
          </div>
        </div>
      </section>

      {/* Error and Success States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Error & Success States</h2>

        <div className="space-y-4">
          <ErrorAlert title="Error Occurred">
            Something went wrong. Please try again.
            <Button size="sm" variant="outline" className="mt-2" onClick={simulateError}>
              Trigger Toast
            </Button>
          </ErrorAlert>

          <SuccessAlert title="Success!">
            Your changes have been saved successfully.
          </SuccessAlert>

          <WarningAlert title="Warning">
            Please review your changes before proceeding.
          </WarningAlert>

          <InfoAlert title="Information">
            This is an informational message.
          </InfoAlert>
        </div>
      </section>

      {/* Form Validation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Validation</h2>

        <FormField
          label="Email"
          required
          error="This field is required"
          description="Enter your email address"
        >
          {(props) => <ValidatedInput {...props} type="email" placeholder="user@example.com" />}
        </FormField>

        <FormField
          label="Valid Field"
          description="This field has no errors"
        >
          {(props) => <ValidatedInput {...props} type="text" placeholder="No errors here" />}
        </FormField>
      </section>

      {/* Card Effects */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Card Effects</h2>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 card-hover">
            <CardHeader>
              <CardTitle>Hover Me</CardTitle>
              <CardDescription>Standard hover effect</CardDescription>
            </CardHeader>
          </Card>

          <Card3D className="p-6">
            <CardHeader>
              <CardTitle>3D Tilt Effect</CardTitle>
              <CardDescription>Move your mouse over me</CardDescription>
            </CardHeader>
          </Card3D>
        </div>
      </section>

      {/* Connection Status */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Connection Status</h2>

        <div className="flex gap-4">
          <ConnectionStatus status="connected" />
          <ConnectionStatus status="connecting" />
          <ConnectionStatus status="disconnected" />
          <ConnectionStatus status="error" />
        </div>

        <Button onClick={() => {
          const statuses: Array<"connected" | "connecting" | "disconnected" | "error"> = ["connected", "connecting", "disconnected", "error"]
          setConnectionStatus(statuses[Math.floor(Math.random() * statuses.length)])
        }}>
          Randomize Status
        </Button>
      </section>
    </div>
  )
}
