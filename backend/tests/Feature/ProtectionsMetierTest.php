<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Facture;
use App\Models\OrdreTravail;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Tests de non-régression des protections métier.
 * S'exécutent uniquement sur une base de TEST dédiée (voir TestCase::exigerBaseDeTest).
 */
class ProtectionsMetierTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->exigerBaseDeTest();
        $admin = User::where('email', 'admin@logistiga.com')->first() ?? User::query()->first();
        $this->assertNotNull($admin, 'Un utilisateur administrateur est requis dans la base de test.');
        Sanctum::actingAs($admin);
    }

    private function client(): Client
    {
        return Client::forceCreate(['nom' => '[TEST-E2E] Client ' . uniqid()]);
    }

    private function ordre(Client $client, array $extra = []): OrdreTravail
    {
        return OrdreTravail::forceCreate(array_merge([
            'numero' => 'OT-TEST-' . uniqid(), 'client_id' => $client->id, 'categorie' => 'operations_independantes',
            'statut' => 'en_cours', 'date_creation' => now()->toDateString(),
            'montant_ht' => 100000, 'montant_ttc' => 119000, 'montant_paye' => 0,
        ], $extra));
    }

    public function test_ot_cannot_be_invoiced_twice(): void
    {
        $ordre = $this->ordre($this->client());
        $this->postJson("/api/ordres-travail/{$ordre->id}/convert-facture")->assertSuccessful();
        $this->postJson("/api/ordres-travail/{$ordre->id}/convert-facture")->assertStatus(422);
        $this->assertSame(1, Facture::where('ordre_id', $ordre->id)->count());
    }

    public function test_cancelled_invoice_cannot_be_updated(): void
    {
        $client = $this->client();
        $facture = Facture::forceCreate([
            'numero' => 'FAC-TEST-' . uniqid(), 'client_id' => $client->id, 'statut' => 'annulee',
            'categorie' => 'operations_independantes', 'date_creation' => now()->toDateString(),
            'montant_ht' => 1000, 'montant_ttc' => 1190, 'montant_paye' => 0,
        ]);
        $this->putJson("/api/factures/{$facture->id}", ['notes' => 'x'])->assertStatus(422);
    }

    public function test_updating_client_never_creates_new_client(): void
    {
        $client = $this->client();
        $avant = Client::count();
        for ($i = 0; $i < 3; $i++) {
            $this->putJson("/api/clients/{$client->id}", ['nom' => $client->nom, 'ville' => "V{$i}"])->assertSuccessful();
        }
        $this->assertSame($avant, Client::count());
    }

    public function test_creating_duplicate_client_requires_confirmation(): void
    {
        $client = $this->client();
        $this->postJson('/api/clients', ['nom' => $client->nom])->assertStatus(409);
    }

    public function test_showing_work_order_does_not_modify_database(): void
    {
        $ordre = $this->ordre($this->client(), ['montant_ttc' => 123456]);
        $avant = DB::table('ordres_travail')->where('id', $ordre->id)->first();
        $this->getJson("/api/ordres-travail/{$ordre->id}")->assertSuccessful();
        $this->assertEquals($avant, DB::table('ordres_travail')->where('id', $ordre->id)->first());
    }

    public function test_overpayment_is_refused(): void
    {
        $ordre = $this->ordre($this->client());
        $this->postJson('/api/paiements', [
            'ordre_id' => $ordre->id, 'montant' => 600000, 'mode_paiement' => 'especes', 'date' => now()->toDateString(),
        ])->assertStatus(422);
        $this->assertSame(0, DB::table('paiements')->where('ordre_id', $ordre->id)->count());
    }

    public function test_work_order_with_payment_cannot_be_deleted(): void
    {
        $ordre = $this->ordre($this->client(), ['montant_paye' => 1000]);
        $this->deleteJson("/api/ordres-travail/{$ordre->id}")->assertStatus(422);
        $this->assertNotNull(OrdreTravail::find($ordre->id));
    }
}
