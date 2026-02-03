<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduler (DÉSACTIVÉ ICI)
|--------------------------------------------------------------------------
| IMPORTANT :
| Le scheduler NE DOIT PAS être défini dans routes/console.php.
| Mets la planification dans app/Console/Kernel.php (méthode schedule()).
|
| Exemple cron :
| * * * * * cd /chemin-vers-projet && php artisan schedule:run >> /dev/null 2>&1
|
*/
