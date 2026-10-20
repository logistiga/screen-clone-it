<?php

namespace Tests\Unit;

use App\Http\Requests\StoreDevisRequest;
use App\Http\Requests\UpdateDevisRequest;
use App\Http\Requests\StoreFactureRequest;
use App\Http\Requests\UpdateFactureRequest;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** Validation sans connexion à la base ni création de document. */
class DocumentOperationValidationTest extends TestCase
{
    public static function requests(): array
    {
        return [
            'création devis' => [StoreDevisRequest::class],
            'modification devis' => [UpdateDevisRequest::class],
            'création facture' => [StoreFactureRequest::class],
            'modification facture' => [UpdateFactureRequest::class],
        ];
    }

    #[DataProvider('requests')]
    public function test_autre_is_accepted(string $requestClass): void
    {
        $this->assertTrue($this->accepts($requestClass, 'autre'));
    }

    #[DataProvider('requests')]
    public function test_existing_operations_remain_accepted(string $requestClass): void
    {
        foreach (['transport', 'location', 'manutention', 'stockage', 'double_relevage'] as $type) {
            $this->assertTrue($this->accepts($requestClass, $type), $type);
        }
    }

    #[DataProvider('requests')]
    public function test_unknown_operation_is_rejected(string $requestClass): void
    {
        $this->assertFalse($this->accepts($requestClass, 'operation_inconnue'));
    }

    private function accepts(string $requestClass, string $type): bool
    {
        $request = new $requestClass();
        $factory = new Factory(new Translator(new ArrayLoader(), 'fr'));

        return $factory->make(
            ['type_operation_indep' => $type],
            ['type_operation_indep' => $request->rules()['type_operation_indep']]
        )->passes();
    }
}