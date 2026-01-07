<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateConfigurationRequest;
use App\Http\Requests\UpdateTaxesRequest;
use App\Http\Requests\UpdateNumerotationRequest;
use App\Http\Requests\UpdateEntrepriseRequest;
use App\Http\Resources\ConfigurationResource;
use App\Models\Configuration;
use App\Models\Audit;
use Illuminate\Http\JsonResponse;

class ConfigurationController extends Controller
{
    public function index(): JsonResponse
    {
        $configurations = Configuration::orderBy('groupe')->orderBy('cle')->get();
        
        $grouped = $configurations->groupBy('groupe');

        return response()->json($grouped);
    }

    public function show(string $cle): JsonResponse
    {
        $configuration = Configuration::where('cle', $cle)->firstOrFail();
        return response()->json(new ConfigurationResource($configuration));
    }

    public function update(UpdateConfigurationRequest $request): JsonResponse
    {
        foreach ($request->configurations as $config) {
            Configuration::updateOrCreate(
                ['cle' => $config['cle']],
                ['valeur' => $config['valeur']]
            );
        }

        Audit::log('update', 'configuration', 'Configurations mises à jour');

        return response()->json(['message' => 'Configurations mises à jour avec succès']);
    }

    public function taxes(): JsonResponse
    {
        $taxes = [
            'taux_tva' => Configuration::where('cle', 'taux_tva')->value('valeur') ?? 18,
            'taux_css' => Configuration::where('cle', 'taux_css')->value('valeur') ?? 1,
        ];

        return response()->json($taxes);
    }

    public function updateTaxes(UpdateTaxesRequest $request): JsonResponse
    {
        Configuration::updateOrCreate(
            ['cle' => 'taux_tva'],
            ['valeur' => $request->taux_tva, 'groupe' => 'taxes', 'description' => 'Taux de TVA (%)']
        );

        Configuration::updateOrCreate(
            ['cle' => 'taux_css'],
            ['valeur' => $request->taux_css, 'groupe' => 'taxes', 'description' => 'Taux de CSS (%)']
        );

        Audit::log('update', 'configuration', 'Taux de taxes mis à jour');

        return response()->json(['message' => 'Taux de taxes mis à jour avec succès']);
    }

    public function numerotation(): JsonResponse
    {
        $prefixes = [
            'prefixe_devis' => Configuration::where('cle', 'prefixe_devis')->value('valeur') ?? 'DEV',
            'prefixe_ordre' => Configuration::where('cle', 'prefixe_ordre')->value('valeur') ?? 'OT',
            'prefixe_facture' => Configuration::where('cle', 'prefixe_facture')->value('valeur') ?? 'FAC',
        ];

        return response()->json($prefixes);
    }

    public function updateNumerotation(UpdateNumerotationRequest $request): JsonResponse
    {
        Configuration::updateOrCreate(
            ['cle' => 'prefixe_devis'],
            ['valeur' => $request->prefixe_devis, 'groupe' => 'numerotation', 'description' => 'Préfixe des devis']
        );

        Configuration::updateOrCreate(
            ['cle' => 'prefixe_ordre'],
            ['valeur' => $request->prefixe_ordre, 'groupe' => 'numerotation', 'description' => 'Préfixe des ordres de travail']
        );

        Configuration::updateOrCreate(
            ['cle' => 'prefixe_facture'],
            ['valeur' => $request->prefixe_facture, 'groupe' => 'numerotation', 'description' => 'Préfixe des factures']
        );

        Audit::log('update', 'configuration', 'Préfixes de numérotation mis à jour');

        return response()->json(['message' => 'Préfixes de numérotation mis à jour avec succès']);
    }

    public function entreprise(): JsonResponse
    {
        $entreprise = [
            'nom' => Configuration::where('cle', 'entreprise_nom')->value('valeur') ?? '',
            'adresse' => Configuration::where('cle', 'entreprise_adresse')->value('valeur') ?? '',
            'telephone' => Configuration::where('cle', 'entreprise_telephone')->value('valeur') ?? '',
            'email' => Configuration::where('cle', 'entreprise_email')->value('valeur') ?? '',
            'nif' => Configuration::where('cle', 'entreprise_nif')->value('valeur') ?? '',
            'rccm' => Configuration::where('cle', 'entreprise_rccm')->value('valeur') ?? '',
            'logo' => Configuration::where('cle', 'entreprise_logo')->value('valeur') ?? '',
        ];

        return response()->json($entreprise);
    }

    public function updateEntreprise(UpdateEntrepriseRequest $request): JsonResponse
    {
        $fields = ['nom', 'adresse', 'telephone', 'email', 'nif', 'rccm'];

        foreach ($fields as $field) {
            if ($request->has($field)) {
                Configuration::updateOrCreate(
                    ['cle' => "entreprise_{$field}"],
                    ['valeur' => $request->get($field), 'groupe' => 'entreprise']
                );
            }
        }

        Audit::log('update', 'configuration', 'Informations entreprise mises à jour');

        return response()->json(['message' => 'Informations entreprise mises à jour avec succès']);
    }
}
