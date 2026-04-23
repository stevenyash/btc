---
name: icon-component
description: Generate a reusable icon button component with Lucide icons
command: |
  $frontendDir = Join-Path $PSScriptRoot "..\..\frontend-react"
  $iconName = $args.icon
  $componentName = $args.name
  
  if (!$iconName) {
    Write-Host "Usage: /icon-component <icon-name> [component-name]" -ForegroundColor Yellow
    Write-Host "Example: /icon-component User UserIconButton" -ForegroundColor Cyan
    exit 1
  }
  
  $componentName = if ($componentName) { $componentName } else { $iconName + "Icon" }
  $fileName = $componentName.ToLower() + ".tsx"
  $filePath = Join-Path $frontendDir "src\components\$fileName"
  
  $template = @"
import { $iconName } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface $componentNameProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function $componentName({
  children,
  size = 'md',
  className,
  ...props
}: $componentNameProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }
  
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2', className)}
      {...props}
    >
      <$iconName className={cn(sizeClasses[size])} strokeWidth={1.5} />
      {children}
    </button>
  )
}
"@
  
  $template | Out-File -FilePath $filePath -Encoding utf8
  Write-Host "`nComponent created: $filePath" -ForegroundColor Green
  Write-Host "Usage: import $componentName from '@/components/$($componentName.ToLower())'" -ForegroundColor Cyan
  Write-Host "Example: <$componentName size='lg'>Click me</$componentName>`n" -ForegroundColor Cyan
args:
  - name: icon
    description: Lucide icon name (e.g., User, Mail, Settings)
    required: true
    type: string
  - name: name
    description: Custom component name (defaults to IconName + "Icon")
    required: false
    type: string
example: /icon-component User
example: /icon-component Settings IconButton
---

Generates a reusable button component with a Lucide icon.
