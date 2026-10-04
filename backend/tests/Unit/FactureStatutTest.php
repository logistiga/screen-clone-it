<?php

namespace Tests\Unit;

use App\Support\FactureStatut;
use PHPUnit\Framework\TestCase;

/** Statut toujours cohérent avec le montant payé. */
class FactureStatutTest extends TestCase
{
    public function test_paiement_complet_donne_payee(): void
    {
        $this->assertSame('payee', FactureStatut::pourMontants(390915, 390915, 'emise'));
    }

    public function test_paiement_partiel_donne_partiellement_payee(): void
    {
        $this->assertSame('partiellement_payee', FactureStatut::pourMontants(100000, 390915, 'emise'));
    }

    public function test_annulation_paiement_total_revient_a_emise(): void
    {
        $this->assertSame('emise', FactureStatut::pourMontants(0, 390915, 'payee'));
    }

    public function test_annulee_reste_annulee_quelle_que_soit_la_variante(): void
    {
        $this->assertSame('annulee', FactureStatut::pourMontants(500, 1000, 'Annulée'));
        $this->assertTrue(FactureStatut::estAnnulee('annulee'));
        $this->assertTrue(FactureStatut::estAnnulee('Annulée'));
    }

    public function test_cancelled_invoice_cannot_be_updated(): void
    {
        $this->assertTrue(FactureStatut::montantsFiges('annulee'));
        $this->assertTrue(FactureStatut::montantsFiges('payee'));
        $this->assertTrue(FactureStatut::montantsFiges('emise', 1000));
        $this->assertFalse(FactureStatut::montantsFiges('emise', 0));
        $this->assertFalse(FactureStatut::montantsFiges('brouillon', 0));
    }

    public function test_reste_a_payer_jamais_negatif(): void
    {
        $this->assertSame(0.0, FactureStatut::resteAPayer(600000, 390915));
        $this->assertSame(290915.0, FactureStatut::resteAPayer(100000, 390915));
    }
}
