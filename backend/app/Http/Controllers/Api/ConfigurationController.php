<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateConfigurationRequest;
use App\Http\Requests\UpdateEntrepriseRequest;
use App\Http\Requests\UpdateNumerotationRequest;
use App\Http\Requests\UpdateTaxesRequest;
use App\Models\Audit;
use App\Models\Configuration;
use Illuminate\Http\JsonResponse;

class ConfigurationController extends Controller
{
    /**
     * Retourne une vue “plate” de la configuration utilisée par le front.
     * IMPORTANT: le modèle/DB utilise (key, data) JSON.
     */
    public function index(): JsonResponse
    {
        $taxes = Configuration::getValue('taxes') ?? [];
        $numerotation = Configuration::getValue('numerotation') ?? [];
        $entreprise = Configuration::getValue('entreprise') ?? [];

        $payload = [
            // Taxes (attendu par le front)
            'taux_tva' => (float) ($taxes['tva_taux'] ?? 18),
            'taux_css' => (float) ($taxes['css_taux'] ?? 1),

            // Numérotation (utile sur plusieurs écrans)
            'prefixe_devis' => $numerotation['prefixe_devis'] ?? 'DEV',
            'prefixe_ordre' => $numerotation['prefixe_ordre'] ?? 'OT',
            'prefixe_facture' => $numerotation['prefixe_facture'] ?? 'FAC',

            // Entreprise
            'entreprise' => $entreprise,
        ];

        return response()->json(['data' => $payload]);
    }

    /**
     * Expose une section par key (ex: taxes | numerotation | entreprise).
     */
    public function show(string $cle): JsonResponse
    {
        return response()->json([
            'data' => Configuration::getValue($cle),
        ]);
    }

    /**
     * Mise à jour “bulk” legacy: accepte configurations[].cle + configurations[].valeur.
     * - Si cle contient "section.sous_cle", on écrit dans Configuration(section).data[sous_cle]
     * - Sinon, on mappe les clés connues, ou on stocke dans un groupe "general".
     */
    public function update(UpdateConfigurationRequest $request): JsonResponse
    {
        foreach ($request->configurations as $config) {
            $cle = $config['cle'];
            $valeur = $config['valeur'];

            if (is_string($cle) && str_contains($cle, '.')) {
                [$section, $subKey] = explode('.', $cle, 2);
                Configuration::setValue($section, $subKey, $valeur);
                continue;
            }

            // Mapping compatibilité
            if ($cle === 'taux_tva') {
                Configuration::setValue('taxes', 'tva_taux', $valeur);
            } elseif ($cle === 'taux_css') {
                Configuration::setValue('taxes', 'css_taux', $valeur);
            } else {
                Configuration::setValue('general', (string) $cle, $valeur);
            }
        }

        Audit::log('update', 'configuration', 'Configurations mises à jour');

        return response()->json(['message' => 'Configurations mises à jour avec succès']);
    }

    public function taxes(): JsonResponse
    {
        $taxes = Configuration::getValue('taxes') ?? [];

        return response()->json([
            'taux_tva' => (float) ($taxes['tva_taux'] ?? 18),
            'taux_css' => (float) ($taxes['css_taux'] ?? 1),
        ]);
    }

    public function updateTaxes(UpdateTaxesRequest $request): JsonResponse
    {
        Configuration::setValue('taxes', 'tva_taux', $request->taux_tva);
        Configuration::setValue('taxes', 'css_taux', $request->taux_css);

        Audit::log('update', 'configuration', 'Taux de taxes mis à jour');

        return response()->json(['message' => 'Taux de taxes mis à jour avec succès']);
    }

    public function numerotation(): JsonResponse
    {
        $numerotation = Configuration::getValue('numerotation') ?? [];

        return response()->json([
            'prefixe_devis' => $numerotation['prefixe_devis'] ?? 'DEV',
            'prefixe_ordre' => $numerotation['prefixe_ordre'] ?? 'OT',
            'prefixe_facture' => $numerotation['prefixe_facture'] ?? 'FAC',
            'prefixe_avoir' => $numerotation['prefixe_avoir'] ?? 'AV',
            'format_annee' => $numerotation['format_annee'] ?? true,
            'prochain_numero_devis' => $numerotation['prochain_numero_devis'] ?? 1,
            'prochain_numero_ordre' => $numerotation['prochain_numero_ordre'] ?? 1,
            'prochain_numero_facture' => $numerotation['prochain_numero_facture'] ?? 1,
            'prochain_numero_avoir' => $numerotation['prochain_numero_avoir'] ?? 1,
        ]);
    }

    public function updateNumerotation(UpdateNumerotationRequest $request): JsonResponse
    {
        $fields = [
            'prefixe_devis', 'prefixe_ordre', 'prefixe_facture', 'prefixe_avoir',
            'format_annee',
            'prochain_numero_devis', 'prochain_numero_ordre', 'prochain_numero_facture', 'prochain_numero_avoir',
        ];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Configuration::setValue('numerotation', $field, $request->get($field));
            }
        }

        Audit::log('update', 'configuration', 'Numérotation mise à jour');

        return response()->json(['message' => 'Numérotation mise à jour avec succès']);
    }

    /**
     * Synchronise les compteurs avec les derniers numéros existants en base.
     */
    public function syncCompteurs(): JsonResponse
    {
        $annee = date('Y');

        \Illuminate\Support\Facades\DB::transaction(function () use ($annee) {
            $config = Configuration::where('key', 'numerotation')->lockForUpdate()->first();

            if (!$config) {
                $config = Configuration::create([
                    'key' => 'numerotation',
                    'data' => Configuration::DEFAULTS['numerotation'],
                ]);
            }

            $data = $config->data;

            // Sync Devis
            $dernierDevis = \App\Models\Devis::whereYear('created_at', $annee)
                ->orderBy('id', 'desc')
                ->first();
            if ($dernierDevis && preg_match('/-(\d{4})$/', $dernierDevis->numero, $matches)) {
                $data['prochain_numero_devis'] = intval($matches[1]) + 1;
            }

            // Sync Ordres
            $dernierOrdre = \App\Models\OrdreTravail::whereYear('created_at', $annee)
                ->orderBy('id', 'desc')
                ->first();
            if ($dernierOrdre && preg_match('/-(\d{4})$/', $dernierOrdre->numero, $matches)) {
                $data['prochain_numero_ordre'] = intval($matches[1]) + 1;
            }

            // Sync Factures
            $derniereFacture = \App\Models\Facture::whereYear('created_at', $annee)
                ->orderBy('id', 'desc')
                ->first();
            if ($derniereFacture && preg_match('/-(\d{4})$/', $derniereFacture->numero, $matches)) {
                $data['prochain_numero_facture'] = intval($matches[1]) + 1;
            }

            $config->data = $data;
            $config->save();
        });

        Audit::log('sync', 'configuration', 'Compteurs synchronisés automatiquement');

        return response()->json(['message' => 'Compteurs synchronisés avec succès']);
    }

    public function entreprise(): JsonResponse
    {
        return response()->json(Configuration::getValue('entreprise') ?? []);
    }

    public function updateEntreprise(UpdateEntrepriseRequest $request): JsonResponse
    {
        $fields = ['nom', 'adresse', 'telephone', 'email', 'nif', 'rccm', 'logo'];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Configuration::setValue('entreprise', $field, $request->get($field));
            }
        }

        Audit::log('update', 'configuration', 'Informations entreprise mises à jour');

        return response()->json(['message' => 'Informations entreprise mises à jour avec succès']);
    }
}
