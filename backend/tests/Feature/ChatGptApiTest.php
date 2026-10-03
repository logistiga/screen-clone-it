<?php

namespace Tests\Feature;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatGptApiTest extends TestCase
{
    use RefreshDatabase;

    private string $token = 'test-token-chatgpt-1234567890';

    protected function setUp(): void
    {
        parent::setUp();
        config(['chatgpt.tokens' => [$this->token], 'chatgpt.enabled' => true, 'chatgpt.rate_limit_per_minute' => 1000]);
    }

    private function auth(): array
    {
        return ['Authorization' => 'Bearer ' . $this->token, 'Accept' => 'application/json'];
    }

    public function test_token_absent(): void
    {
        $this->getJson('/api/gpt/schema')->assertStatus(401)->assertJsonPath('error.code', 'UNAUTHENTICATED');
    }

    public function test_token_invalide(): void
    {
        $this->getJson('/api/gpt/schema', ['Authorization' => 'Bearer faux'])->assertStatus(401);
    }

    public function test_schema_sans_champ_sensible(): void
    {
        $res = $this->getJson('/api/gpt/schema', $this->auth())->assertOk()->assertJsonPath('success', true);
        $json = json_encode($res->json());
        $this->assertStringNotContainsString('password', $json);
        $this->assertStringNotContainsString('token_verification', $json);
        $this->assertStringNotContainsString('iban', strtolower($json));
    }

    public function test_ecriture_refusee(): void
    {
        $this->deleteJson('/api/gpt/resources/clients', [], $this->auth())->assertStatus(405);
        $this->putJson('/api/gpt/query', [], $this->auth())->assertStatus(405);
    }

    public function test_ressource_interdite(): void
    {
        $this->postJson('/api/gpt/query', ['resource' => 'users'], $this->auth())->assertStatus(404);
    }

    public function test_filtre_et_champ_invalides(): void
    {
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'filters' => [['field' => 'password', 'value' => 'x']]], $this->auth())
            ->assertStatus(422)->assertJsonPath('error.code', 'INVALID_FIELD');
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'filters' => [['field' => 'nom', 'op' => 'DROP', 'value' => 'x']]], $this->auth())
            ->assertStatus(422)->assertJsonPath('error.code', 'INVALID_FILTER');
    }

    public function test_injection_sql_sans_effet(): void
    {
        Client::create(['nom' => 'Alpha']);
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'filters' => [['field' => 'nom', 'value' => "x' OR '1'='1"]]], $this->auth())
            ->assertOk()->assertJsonPath('meta.total', 0);
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'sort' => ['nom; DROP TABLE clients']], $this->auth())
            ->assertStatus(422);
        $this->assertSame(1, Client::count());
    }

    public function test_pagination_et_limite_max(): void
    {
        foreach (range(1, 3) as $i) {
            Client::create(['nom' => "Client $i"]);
        }
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'limit' => 9999, 'page' => 1], $this->auth())
            ->assertOk()->assertJsonPath('meta.limit', 200)->assertJsonPath('meta.total', 3);
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'limit' => 2, 'page' => 2], $this->auth())
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_recherche(): void
    {
        Client::create(['nom' => 'Société Bêta']);
        $this->getJson('/api/gpt/search?q=Bêta', $this->auth())->assertOk()->assertJsonPath('data.0.resource', 'clients');
        $this->getJson('/api/gpt/search?q=a', $this->auth())->assertStatus(422);
    }

    public function test_agregation(): void
    {
        Client::create(['nom' => 'A', 'solde' => 100]);
        Client::create(['nom' => 'B', 'solde' => 250]);
        $this->postJson('/api/gpt/query', ['resource' => 'clients', 'aggregations' => [['fn' => 'sum', 'field' => 'solde'], ['fn' => 'count']]], $this->auth())
            ->assertOk()->assertJsonPath('data.0.sum_solde', 350)->assertJsonPath('data.0.count_id', 2);
    }

    public function test_rate_limit(): void
    {
        config(['chatgpt.rate_limit_per_minute' => 2]);
        $this->getJson('/api/gpt/schema', $this->auth())->assertOk();
        $this->getJson('/api/gpt/schema', $this->auth())->assertOk();
        $this->getJson('/api/gpt/schema', $this->auth())->assertStatus(429);
    }
}
