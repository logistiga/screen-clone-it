<?php

namespace App\Services\Caisse;

use RuntimeException;

class SoldeInsuffisantException extends RuntimeException
{
    public function __construct(string $message, public ?float $soldeActuel = null, public int $status = 422)
    {
        parent::__construct($message);
    }
}
