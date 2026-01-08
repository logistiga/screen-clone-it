<?php

namespace App\Services;

use App\Models\Devis;
use App\Services\Devis\DevisServiceFactory;

/**
 * Service principal Devis - délègue au Factory pour le routing par type.
 * Maintenu pour compatibilité avec le controller existant.
 */
class DevisService
{
    protected DevisServiceFactory $factory;

    public function __construct(DevisServiceFactory $factory)
    {
        $this->factory = $factory;
    }

    public function creer(array $data): Devis
    {
        return $this->factory->creer($data);
    }

    public function modifier(Devis $devis, array $data): Devis
    {
        return $this->factory->modifier($devis, $data);
    }

    public function convertirEnOrdre(Devis $devis): \App\Models\OrdreTravail
    {
        return $this->factory->convertirEnOrdre($devis);
    }

    public function dupliquer(Devis $devis): Devis
    {
        return $this->factory->dupliquer($devis);
    }
}
