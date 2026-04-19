import type { ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  )
}
