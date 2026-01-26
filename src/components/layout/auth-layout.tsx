import type { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-foreground/20" />
          <span className="text-xl font-bold">PRMS</span>
        </div>
        <div className="space-y-2">
          <blockquote className="text-lg">
            "Kiralama islerinizi kolaylastiran, modern ve guvenilir yonetim sistemi."
          </blockquote>
          <p className="text-sm text-primary-foreground/80">
            Property Rental Management System
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  )
}
