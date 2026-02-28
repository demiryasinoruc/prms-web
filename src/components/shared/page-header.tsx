import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    permission?: boolean
  }
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const showAction = action && (action.permission === undefined || action.permission)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {showAction && (
        <Button onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  )
}
