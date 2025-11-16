Write-Host "Preparing workspace..."

# Use absolute script directory so working directories are correct
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Run npm install in repo root to ensure workspace-level dependencies are present
Write-Host "Running 'npm install' in repository root..."
Push-Location $scriptDir
try {
	& npm install
} finally {
	Pop-Location
}

Write-Host "Starting Docker containers..."
docker compose up -d

# Helper to start a service in its folder with Start-Process and proper working directory
function Start-ServiceProcess($name, $folder, $installCmd, $startFile, $startArgs) {
	Write-Host "Starting $name..."
	$wd = Join-Path $scriptDir $folder
	if (-not (Test-Path $wd)) {
		Write-Host "Directory $wd not found, skipping $name" -ForegroundColor Yellow
		return
	}
	Push-Location $wd
	try {
		if ($installCmd) { Invoke-Expression $installCmd }
	} finally {
		Pop-Location
	}

	if ($startFile -ieq 'powershell') {
		Start-Process -FilePath 'powershell' -ArgumentList '-NoExit','-Command',$startArgs -WorkingDirectory $wd
	} elseif ($startFile -ieq 'node') {
		Start-Process -FilePath 'node' -ArgumentList $startArgs -WorkingDirectory $wd
	} else {
		Start-Process -FilePath $startFile -ArgumentList $startArgs -WorkingDirectory $wd
	}
}

Start-ServiceProcess 'ProductService' 'product-grpc' 'npm install' 'powershell' 'npm run start:dev'
Start-ServiceProcess 'OrderService' 'order-service' 'npm install' 'powershell' 'npm run start:dev'
Start-ServiceProcess 'PaymentService' 'payment-service' 'npm install' 'powershell' 'npm run start:dev'
Start-ServiceProcess 'InventoryService' 'inventory-service' 'npm install' 'powershell' 'npm run start:dev'
Start-ServiceProcess 'NotificationService' 'notification-service' 'npm install' 'powershell' 'npm run start:dev'
Start-ServiceProcess 'NotiWorker' 'noti-worker' 'npm install' 'node' 'worker.js'

Write-Host "All services started (or skipped if directories missing)."
