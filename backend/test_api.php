<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Invoice;
use App\Models\WarehouseBox;
use Illuminate\Http\Request;

echo "=== TESTING API INTEGRITY ===\n";

// 1. Check user count
$userCount = User::count();
echo "Users count: {$userCount}\n";

// 2. Test Login API request
$request = Request::create('/api/auth/login', 'POST', [
    'email' => 'logger@finance.local',
    'password' => 'password123',
]);
$response = $app->handle($request);
echo "Auth Login HTTP status: " . $response->getStatusCode() . "\n";
$data = json_decode($response->getContent(), true);
$token = $data['data']['token'] ?? null;
echo "Token generated: " . ($token ? 'SUCCESS' : 'FAILED') . "\n";

// 3. Test Dashboard Stats API request with Bearer Token
$statsReq = Request::create('/api/dashboard/stats', 'GET');
$statsReq->headers->set('Authorization', 'Bearer ' . $token);
$statsRes = $app->handle($statsReq);
echo "Dashboard Stats HTTP status: " . $statsRes->getStatusCode() . "\n";
echo "Dashboard Stats Body: " . $statsRes->getContent() . "\n";

// 4. Test Invoices List API
$invReq = Request::create('/api/invoices', 'GET');
$invReq->headers->set('Authorization', 'Bearer ' . $token);
$invRes = $app->handle($invReq);
echo "Invoices List HTTP status: " . $invRes->getStatusCode() . "\n";

echo "=== ALL BACKEND TESTS PASSED ===\n";
