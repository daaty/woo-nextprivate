# Test health endpoint and basic connectivity
Write-Host "Testing basic connectivity..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health endpoint response:" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Cyan
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health endpoint failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "" 
    Write-Host "Trying basic localhost connection..." -ForegroundColor Yellow
    
    try {
        $basicResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 10
        Write-Host "✅ Basic localhost connection works" -ForegroundColor Green
        Write-Host "Status Code: $($basicResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Basic localhost connection also failed:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
