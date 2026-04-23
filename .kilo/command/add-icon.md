---
name: add-icon
description: Search for and add Lucide icons to a component
command: |
  $iconName = $args.icon
  $componentPath = $args.component
  
  if (!$iconName) {
    Write-Host "Usage: /add-icon <icon-name> [component-path]" -ForegroundColor Yellow
    Write-Host "Example: /add-icon User" -ForegroundColor Cyan
    Write-Host "Example: /add-icon Mail src/components/Button.tsx" -ForegroundColor Cyan
    exit 1
  }
  
  # Search Lucide icons
  $searchTerm = $iconName.ToLower()
  Write-Host "`nSearching for Lucide icon: '$searchTerm'...`n" -ForegroundColor Cyan
  
  try {
    $response = Invoke-RestMethod -Uri "https://lucide.dev/api/icons?search=$searchTerm&limit=10"
    
    if ($response.Count -eq 0) {
      Write-Host "No icons found matching '$searchTerm'" -ForegroundColor Red
      Write-Host "Browse all icons at: https://lucide.dev/icons" -ForegroundColor Yellow
      exit 1
    }
    
    Write-Host "Found $($response.Count) icon(s):`n" -ForegroundColor Green
    
    foreach ($icon in $response) {
      Write-Host "  Name: $($icon.name)" -ForegroundColor White
      Write-Host "  Tags: $($icon.tags -join ', ')"
      Write-Host "  Import: import { $($icon.name) } from 'lucide-react'`n"
    }
    
    # If component path provided, add import
    if ($componentPath) {
      $fullPath = Join-Path (Join-Path $PSScriptRoot "..\..\frontend-react") $componentPath
      
      if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if already imported
        if ($content -match "from ['\"]lucide-react['\"]") {
          Write-Host "`nWarning: lucide-react import already exists in $componentPath" -ForegroundColor Yellow
          Write-Host "Add '$($response[0].name)' to existing import statement." -ForegroundColor Cyan
        } else {
          # Add import at the top
          $importLine = "import { $($response[0].name) } from 'lucide-react'"
          $content = $importLine + "`r`n" + $content
          $content | Out-File -FilePath $fullPath -Encoding utf8
          Write-Host "`nAdded import to $componentPath" -ForegroundColor Green
        }
      } else {
        Write-Host "`nError: Component not found: $componentPath" -ForegroundColor Red
      }
    }
    
  } catch {
    Write-Host "Error searching icons: $_" -ForegroundColor Red
    Write-Host "Check your internet connection or visit https://lucide.dev/icons" -ForegroundColor Yellow
  }
args:
  - name: icon
    description: Icon name to search for (e.g., user, mail, settings)
    required: true
    type: string
  - name: component
    description: Optional component path to add the icon import to
    required: false
    type: string
example: /add-icon User
example: /add-icon Settings src/components/Button.tsx
---

Searches Lucide icon library and optionally adds import to a component.
