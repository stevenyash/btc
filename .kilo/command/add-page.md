---
name: add-page
description: Generate a new page component with shadcn/ui styling
command: |
  $frontendDir = Join-Path $PSScriptRoot "..\..\frontend-react"
  $pageName = $args.page
  $pagePath = Join-Path $frontendDir "src\pages\$pageName.tsx"
  
  # Read template
  $template = Get-Content (Join-Path $PSScriptRoot "templates\page-template.tsx") -Raw
  
  # Replace variables
  $template = $template.Replace("{{PageName}}", ($pageName -replace '\.tsx$',''))
  $template = $template.Replace("{{PageNameLower}}", (($pageName -replace '\.tsx$','') -replace '([a-z])([A-Z])','$1-$2').ToLower())
  
  # Create directory if needed
  $dir = Split-Path $pagePath -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  
  # Write file
  $template | Out-File -FilePath $pagePath -Encoding utf8
  
  Write-Host "Page created: $pagePath" -ForegroundColor Green
args:
  - name: page
    description: Page name with path (e.g., users/addUsersPage, roles/editRolePage)
    required: true
    type: string
  - name: withShadcn
    description: Include shadcn Card layout
    required: false
    type: boolean
    default: true
example: /add-page users/addUsersPage
---

Generates a new page component with proper shadcn/ui structure.
