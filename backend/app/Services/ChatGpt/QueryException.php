<?php

namespace App\Services\ChatGpt;

class QueryException extends \RuntimeException
{
    public function __construct(public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}
