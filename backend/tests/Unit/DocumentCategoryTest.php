<?php

namespace Tests\Unit;

use App\Support\DocumentCategory;
use PHPUnit\Framework\TestCase;

/** Les filtres reconnaissent les valeurs historiques sans réécrire les documents. */
class DocumentCategoryTest extends TestCase
{
    public function test_conteneurs_filter_includes_legacy_invoice_category(): void
    {
        $this->assertSame(['conteneurs', 'Conteneur', 'conteneur'], DocumentCategory::equivalentValues('conteneurs'));
    }

    public function test_conventionnel_filter_includes_legacy_invoice_category(): void
    {
        $this->assertSame(['conventionnel', 'Conventionnel', 'Lot', 'lot', 'lots'], DocumentCategory::equivalentValues('conventionnel'));
    }

    public function test_independent_filter_includes_legacy_invoice_category(): void
    {
        $this->assertSame(['operations_independantes', 'Independant', 'independant', 'divers', 'DIVERS'], DocumentCategory::equivalentValues('operations_independantes'));
    }

    public function test_legacy_and_current_filters_use_the_same_values(): void
    {
        foreach (['Conteneur' => 'conteneurs', 'Lot' => 'conventionnel', 'Independant' => 'operations_independantes'] as $legacy => $current) {
            $this->assertSame(DocumentCategory::equivalentValues($current), DocumentCategory::equivalentValues($legacy));
        }
    }
}