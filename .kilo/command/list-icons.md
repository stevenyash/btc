---
name: list-icons
description: List all available Lucide icons or search for specific ones
command: |
  $searchTerm = $args.search
  
  Write-Host "`n🔍 Lucide Icons`n" -ForegroundColor Cyan
  
  if ($searchTerm) {
    Write-Host "Searching for: '$searchTerm'`n" -ForegroundColor Yellow
    $url = "https://lucide.dev/api/icons?search=$([System.Uri]::EscapeDataString($searchTerm))&limit=20"
  } else {
    Write-Host "Fetching popular icons...`n" -ForegroundColor Yellow
    $url = "https://lucide.dev/api/icons?limit=50"
  }
  
  try {
    $response = Invoke-RestMethod -Uri $url
    
    if ($response.Count -eq 0) {
      Write-Host "No icons found." -ForegroundColor Red
      Write-Host "Browse all icons at: https://lucide.dev/icons" -ForegroundColor Cyan
      exit 0
    }
    
    Write-Host "Found $($response.Count) icon(s):`n" -ForegroundColor Green
    
    foreach ($icon in $response[0..([Math]::Min(19, $response.Count-1))]) {
      Write-Host ("  {0,-25} Tags: {1}" -f $icon.name, ($icon.tags -join ', '))
    }
    
    if ($response.Count -gt 20) {
      Write-Host "`n... and $($response.Count - 20) more" -ForegroundColor Gray
    }
    
    Write-Host "`nBrowse all icons: https://lucide.dev/icons`n" -ForegroundColor Cyan
    
  } catch {
    Write-Host "Error fetching icons: $_`n" -ForegroundColor Red
    Write-Host "Visit https://lucide.dev/icons to browse all icons" -ForegroundColor Yellow
  }
args:
  - name: search
    description: Search term to filter icons (e.g., 'user', 'arrow', 'home')
    required: false
    type: string
example: /list-icons
example: /list-icons user
example: /list-icons arrow
---

Lists and searches Lucide icons from the official library.
