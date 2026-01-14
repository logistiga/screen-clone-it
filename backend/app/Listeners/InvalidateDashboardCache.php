<?php

namespace App\Listeners;

use App\Services\CacheService;
use Illuminate\Contracts\Queue\ShouldQueue;

class InvalidateDashboardCache implements ShouldQueue
{
    public function handle($event): void
    {
        CacheService::invalidateDashboard();
    }
}
