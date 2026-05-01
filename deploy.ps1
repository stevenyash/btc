<#
.SYNOPSIS
    Deployment script for BTC (Bits Tutor Connect) - manages environment switching and deployment
.DESCRIPTION
    This script handles:
    - Switching between development and production environments
    - Building the frontend with correct environment variables
    - Restarting the backend service with correct environment
    - health checks
.PARAMETER Environment
    Target environment: 'development' or 'production' (default: production)
.PARAMETER SkipBackend
    Skip backend restart
.PARAMETER SkipFrontend
    Skip frontend build
.PARAMETER Only
    Only perform specific action: 'backend', 'frontend'
.EXAMPLE
    .\deploy.ps1 -Environment production
    Deploy to production (default)
.EXAMPLE
    .\deploy.ps1 -Environment development
    Switch to development environment
.NOTES
    Requires: Node.js, npm, PM2 (if using PM2 for backend)
#>

param(
    [ValidateSet('development', 'production')]
    [string]$Environment = 'production',

    [switch]$SkipBackend,

    [switch]$SkipFrontend,

    [ValidateSet('backend', 'frontend')]
    [string]$Only
)

$ErrorActionPreference = 'Stop'

# Paths
$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $RootPath "nodejs-express-api"
$FrontendPath = Join-Path $RootPath "react-frontend"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BTC Deployment Script" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

function Set-EnvironmentFiles {
    param([string]$Env)

    Write-Host "📝 Setting environment files to '$Env'..." -ForegroundColor Yellow

    # Backend: copy the appropriate .env file to .env (which is loaded by the app)
    $BackendEnvSource = Join-Path $BackendPath ".env.$Env"
    $BackendEnvTarget = Join-Path $BackendPath ".env"

    if (Test-Path $BackendEnvSource) {
        Copy-Item $BackendEnvSource $BackendEnvTarget -Force
        Write-Host "  ✓ Backend: $BackendEnvSource → $BackendEnvTarget" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Backend .env.$Env not found, using existing .env" -ForegroundColor Yellow
    }

    # Frontend: Vite automatically uses .env.[mode] based on --mode flag
    # We don't need to copy files, just pass the right mode to build command
    Write-Host "  ✓ Frontend will use .env.$Env on build" -ForegroundColor Green
}

function Build-Frontend {
    param([string]$Env)

    Write-Host ""
    Write-Host "🔨 Building frontend ($Env)..." -ForegroundColor Yellow

    Push-Location $FrontendPath

    try {
        # Install dependencies if node_modules missing
        if (-not (Test-Path "node_modules")) {
            Write-Host "  📦 Installing frontend dependencies..." -ForegroundColor Cyan
            npm install
        }

        # Build with the correct mode
        $Mode = $Env
        Write-Host "  🏗️  Running: npm run build -- --mode $Mode" -ForegroundColor Cyan
        npm run build -- --mode $Mode

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Frontend build succeeded" -ForegroundColor Green
        } else {
            throw "Frontend build failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

function Restart-Backend {
    param([string]$Env)

    Write-Host ""
    Write-Host "🔄 Restarting backend ($Env)..." -ForegroundColor Yellow

    Push-Location $BackendPath

    try {
        # Check if PM2 is available and process exists
        $UsePM2 = $false
        try {
            $pm2List = pm2 list --no-color 2>$null
            if ($LASTEXITCODE -eq 0) {
                $UsePM2 = $true
            }
        } catch {}

        if ($UsePM2) {
            Write-Host "  ✓ Using PM2 to restart backend" -ForegroundColor Cyan

            # Check if process exists in PM2
            $pm2Info = pm2 list --no-color | Select-String "nodejs-express-api|app.js|index.js"

            if ($pm2Info) {
                pm2 restart nodejs-express-api --update-env
                Write-Host "  ✓ Backend restarted via PM2" -ForegroundColor Green
            } else {
                Write-Host "  ⚠ Backend not found in PM2, starting new process..." -ForegroundColor Yellow
                pm2 start app.ts --name nodejs-express-api --interpreter node -- update-env
                Write-Host "  ✓ Backend started via PM2" -ForegroundColor Green
            }
        } else {
            Write-Host "  ⚠ PM2 not detected. Manual restart required." -ForegroundColor Yellow
            Write-Host "  Please restart your backend process manually:" -ForegroundColor Cyan
            Write-Host "    cd $BackendPath" -ForegroundColor Gray
            Write-Host "    npm start  (or: node app.js, nodemon, etc.)" -ForegroundColor Gray
        }
    }
    finally {
        Pop-Location
    }
}

function Test-Health {
    Write-Host ""
    Write-Host "🏥 Health checks..." -ForegroundColor Yellow

    # Wait a moment for services to start
    Start-Sleep -Seconds 3

    $BackendUrl = if ($Environment -eq 'production') {
        "https://backend.bitstutorconnect.co.ke/api/components_data/learninglevels"
    } else {
        "http://localhost:8060/api/components_data/learninglevels"
    }

    try {
        $response = Invoke-WebRequest -Uri $BackendUrl -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ Backend API is responding (HTTP $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Backend returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ✗ Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution
try {
    # Validate paths exist
    if (-not (Test-Path $BackendPath)) {
        throw "Backend path not found: $BackendPath"
    }
    if (-not (Test-Path $FrontendPath)) {
        throw "Frontend path not found: $FrontendPath"
    }

    # Determine what to run based on -Only parameter
    $runBackend = -not $SkipBackend
    $runFrontend = -not $SkipFrontend

    if ($Only) {
        $runBackend = ($Only -eq 'backend')
        $runFrontend = ($Only -eq 'frontend')
    }

    # Step 1: Set environment files
    Set-EnvironmentFiles -Env $Environment

    # Step 2: Build frontend (if needed)
    if ($runFrontend) {
        Build-Frontend -Env $Environment
    } else {
        Write-Host ""
        Write-Host "⏭️  Skipping frontend build" -ForegroundColor Cyan
    }

    # Step 3: Restart backend (if needed)
    if ($runBackend) {
        Restart-Backend -Env $Environment
    } else {
        Write-Host ""
        Write-Host "⏭️  Skipping backend restart" -ForegroundColor Cyan
    }

    # Step 4: Health checks
    if ($runBackend) {
        Test-Health
    }

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Deployment complete!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan

    if ($Environment -eq 'production') {
        Write-Host ""
        Write-Host "🔗 Production URLs:" -ForegroundColor White
        Write-Host "   Frontend: https://bitstutorconnect.co.ke" -ForegroundColor Gray
        Write-Host "   Backend:  https://backend.bitstutorconnect.co.ke:8060" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "🔗 Development URLs:" -ForegroundColor White
        Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
        Write-Host "   Backend:  http://localhost:8060" -ForegroundColor Gray
    }
}
catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Deployment failed." -ForegroundColor Red
    exit 1
}
