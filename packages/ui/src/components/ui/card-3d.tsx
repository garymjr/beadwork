import * as React from "react"
import { cn } from "@/lib/utils"

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  tiltAmount?: number
  glowOnHover?: boolean
}

const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
  ({ className, tiltAmount = 3, glowOnHover = true, children, ...props }, ref) => {
    const [transform, setTransform] = React.useState('')
    const [isHovered, setIsHovered] = React.useState(false)
    const cardRef = React.useRef<HTMLDivElement>(null)

    React.useImperativeHandle(ref, () => cardRef.current!)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -tiltAmount
      const rotateY = ((x - centerX) / centerX) * tiltAmount

      setTransform(
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
      )
    }

    const handleMouseLeave = () => {
      setTransform('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)')
      setIsHovered(false)
    }

    return (
      <div
        ref={cardRef}
        className={cn(
          "rounded-lg border border-border bg-surface text-card-foreground shadow-sm",
          "transition-all duration-300 ease-out",
          glowOnHover && isHovered && "glow-primary",
          className
        )}
        style={{
          transform,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card3D.displayName = "Card3D"

export { Card3D }
