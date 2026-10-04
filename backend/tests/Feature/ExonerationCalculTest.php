<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\OrdreTravail;
use App\Services\Finance\ExonerationService;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/** Non-régression : l'exonération au paiement utilise le calcul commun et ne re-déduit pas la remise. */
class ExonerationCalculTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->exigerBaseDeTest();
    }

    private function ordre(array $extra = []): OrdreTravail
    {
        $client = Client::forceCreate(['nom' => '[TEST-E2E] Exo ' . uniqid()]);
        return OrdreTravail::forceCreate(array_merge([
            'numero' => 'OT-TEST-' . uniqid(), 'client_id' => $client->id, 'categorie' => 'operations_independantes',
            'statut' => 'en_cours', 'date_creation' => now()->toDateString(),
            'montant_ht' => 90000, 'remise_montant' => 10000, 'tva' => 16200, 'css' => 900,
            'montant_ttc' => 107100, 'montant_paye' => 0,
        ], $extra));
    }

    public function test_exoneration_tva_keeps_css_and_does_not_reapply_discount(): void
    {
        $doc = app(ExonerationService::class)->appliquer($this->ordre(), true, false, 'Test');
        $this->assertEquals(0, (float) $doc->tva);
        $this->assertEquals(900, (float) $doc->css);
        $this->assertEquals(90900, (float) $doc->montant_ttc);
        $this->assertSame(['TVA'], $doc->taxes_selection['exonerated_tax_codes']);
    }

    public function test_full_exoneration_ttc_equals_ht(): void
    {
        $doc = app(ExonerationService::class)->appliquer($this->ordre(), true, true, 'Test');
        $this->assertEquals(90000, (float) $doc->montant_ttc);
    }

    public function test_exoneration_refused_if_already_paid_more_than_new_total(): void
    {
        $this->expectException(\DomainException::class);
        app(ExonerationService::class)->appliquer($this->ordre(['montant_paye' => 100000]), true, true, 'Test');
    }
}
