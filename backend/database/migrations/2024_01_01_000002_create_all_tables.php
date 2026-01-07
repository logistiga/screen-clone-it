<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Clients
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('pays')->default('Gabon');
            $table->enum('type', ['Particulier', 'Entreprise'])->default('Entreprise');
            $table->string('rccm')->nullable();
            $table->string('nif')->nullable();
            $table->string('contact_principal')->nullable();
            $table->decimal('solde', 15, 2)->default(0);
            $table->decimal('limite_credit', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Banques
        Schema::create('banques', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('numero_compte');
            $table->string('rib')->nullable();
            $table->string('iban')->nullable();
            $table->string('swift')->nullable();
            $table->decimal('solde', 15, 2)->default(0);
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Partenaires
        Schema::create('transitaires', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('representants', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('armateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->nullable();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // Devis
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->date('date_creation');
            $table->date('date_validite');
            $table->string('categorie')->default('conteneurs');
            $table->string('type_operation')->nullable();
            $table->string('type_operation_indep')->nullable();
            $table->foreignId('armateur_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transitaire_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('representant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('navire')->nullable();
            $table->string('numero_bl')->nullable();
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->decimal('tva', 15, 2)->default(0);
            $table->decimal('css', 15, 2)->default(0);
            $table->decimal('montant_ttc', 15, 2)->default(0);
            $table->string('statut')->default('brouillon');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Ordres de travail
        Schema::create('ordres_travail', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('devis_id')->nullable()->constrained('devis')->nullOnDelete();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->date('date_creation');
            $table->string('categorie')->default('conteneurs');
            $table->string('type_operation')->nullable();
            $table->string('type_operation_indep')->nullable();
            $table->foreignId('armateur_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transitaire_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('representant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('navire')->nullable();
            $table->string('numero_bl')->nullable();
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->decimal('tva', 15, 2)->default(0);
            $table->decimal('css', 15, 2)->default(0);
            $table->decimal('montant_ttc', 15, 2)->default(0);
            $table->decimal('montant_paye', 15, 2)->default(0);
            $table->string('statut')->default('en_cours');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Factures
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('ordre_id')->nullable()->constrained('ordres_travail')->nullOnDelete();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->date('date_creation');
            $table->date('date_echeance');
            $table->string('categorie')->default('conteneurs');
            $table->string('type_operation')->nullable();
            $table->string('type_operation_indep')->nullable();
            $table->foreignId('armateur_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transitaire_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('representant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('navire')->nullable();
            $table->string('numero_bl')->nullable();
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->decimal('tva', 15, 2)->default(0);
            $table->decimal('css', 15, 2)->default(0);
            $table->decimal('montant_ttc', 15, 2)->default(0);
            $table->decimal('montant_paye', 15, 2)->default(0);
            $table->string('statut')->default('emise');
            $table->text('notes')->nullable();
            $table->string('token_verification')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Lignes des documents
        Schema::create('lignes_devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devis_id')->constrained('devis')->onDelete('cascade');
            $table->text('description');
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->string('lieu_depart')->nullable();
            $table->string('lieu_arrivee')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamps();
        });

        Schema::create('lignes_ordres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ordre_id')->constrained('ordres_travail')->onDelete('cascade');
            $table->text('description');
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->string('lieu_depart')->nullable();
            $table->string('lieu_arrivee')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamps();
        });

        Schema::create('lignes_factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained()->onDelete('cascade');
            $table->text('description');
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('montant_ht', 15, 2)->default(0);
            $table->string('lieu_depart')->nullable();
            $table->string('lieu_arrivee')->nullable();
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamps();
        });

        // Conteneurs
        Schema::create('conteneurs_devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devis_id')->constrained('devis')->onDelete('cascade');
            $table->string('numero');
            $table->string('taille')->nullable();
            $table->text('description')->nullable();
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('operations_conteneurs_devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conteneur_id')->constrained('conteneurs_devis')->onDelete('cascade');
            $table->string('type');
            $table->text('description')->nullable();
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('prix_total', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('conteneurs_ordres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ordre_id')->constrained('ordres_travail')->onDelete('cascade');
            $table->string('numero');
            $table->string('taille')->nullable();
            $table->text('description')->nullable();
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('operations_conteneurs_ordres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conteneur_id')->constrained('conteneurs_ordres')->onDelete('cascade');
            $table->string('type');
            $table->text('description')->nullable();
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('prix_total', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('conteneurs_factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained()->onDelete('cascade');
            $table->string('numero');
            $table->string('taille')->nullable();
            $table->text('description')->nullable();
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('operations_conteneurs_factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conteneur_id')->constrained('conteneurs_factures')->onDelete('cascade');
            $table->string('type');
            $table->text('description')->nullable();
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('prix_total', 15, 2)->default(0);
            $table->timestamps();
        });

        // Lots
        Schema::create('lots_devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devis_id')->constrained('devis')->onDelete('cascade');
            $table->string('numero_lot');
            $table->text('description')->nullable();
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('prix_total', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('lots_ordres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ordre_id')->constrained('ordres_travail')->onDelete('cascade');
            $table->string('numero_lot');
            $table->text('description')->nullable();
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('prix_total', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('lots_factures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained()->onDelete('cascade');
            $table->string('numero_lot');
            $table->text('description')->nullable();
            $table->decimal('quantite', 10, 2)->default(1);
            $table->decimal('prix_unitaire', 15, 2)->default(0);
            $table->decimal('prix_total', 15, 2)->default(0);
            $table->timestamps();
        });

        // Paiements
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ordre_id')->nullable()->constrained('ordres_travail')->nullOnDelete();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->decimal('montant', 15, 2);
            $table->date('date');
            $table->string('mode_paiement');
            $table->string('reference')->nullable();
            $table->foreignId('banque_id')->nullable()->constrained()->nullOnDelete();
            $table->string('numero_cheque')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Mouvements de caisse
        Schema::create('mouvements_caisse', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->decimal('montant', 15, 2);
            $table->date('date');
            $table->text('description');
            $table->foreignId('paiement_id')->nullable()->constrained()->nullOnDelete();
            $table->string('source')->default('caisse');
            $table->foreignId('banque_id')->nullable()->constrained()->nullOnDelete();
            $table->string('categorie')->nullable();
            $table->string('beneficiaire')->nullable();
            $table->timestamps();
        });

        // Primes partenaires
        Schema::create('primes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ordre_id')->constrained('ordres_travail')->onDelete('cascade');
            $table->foreignId('transitaire_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('representant_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('montant', 15, 2);
            $table->string('statut')->default('due');
            $table->date('date_paiement')->nullable();
            $table->timestamps();
        });

        Schema::create('paiements_primes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transitaire_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('representant_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('montant', 15, 2);
            $table->date('date');
            $table->string('mode_paiement');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('paiement_prime_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_prime_id')->constrained('paiements_primes')->onDelete('cascade');
            $table->foreignId('prime_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Crédits bancaires
        Schema::create('credits_bancaires', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('banque_id')->constrained()->onDelete('cascade');
            $table->decimal('montant_emprunte', 15, 2);
            $table->decimal('taux_interet', 5, 2);
            $table->integer('duree_en_mois');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->decimal('mensualite', 15, 2);
            $table->decimal('total_interets', 15, 2);
            $table->decimal('montant_rembourse', 15, 2)->default(0);
            $table->string('statut')->default('actif');
            $table->string('objet');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('echeances_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_id')->constrained('credits_bancaires')->onDelete('cascade');
            $table->integer('numero');
            $table->date('date_echeance');
            $table->decimal('montant_capital', 15, 2);
            $table->decimal('montant_interet', 15, 2);
            $table->decimal('montant_total', 15, 2);
            $table->decimal('montant_paye', 15, 2)->default(0);
            $table->date('date_paiement')->nullable();
            $table->string('statut')->default('a_payer');
            $table->timestamps();
        });

        Schema::create('remboursements_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_id')->constrained('credits_bancaires')->onDelete('cascade');
            $table->foreignId('echeance_id')->nullable()->constrained('echeances_credits')->nullOnDelete();
            $table->foreignId('banque_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('montant', 15, 2);
            $table->date('date');
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('documents_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_id')->constrained('credits_bancaires')->onDelete('cascade');
            $table->string('type');
            $table->string('nom');
            $table->string('chemin');
            $table->integer('version')->default(1);
            $table->string('taille')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('modifications_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credit_id')->constrained('credits_bancaires')->onDelete('cascade');
            $table->string('type');
            $table->date('date_modification');
            $table->text('ancienne_valeur')->nullable();
            $table->text('nouvelle_valeur')->nullable();
            $table->text('motif');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('document_ref')->nullable();
            $table->timestamps();
        });

        // Prévisions
        Schema::create('previsions', function (Blueprint $table) {
            $table->id();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->decimal('montant_estime', 15, 2);
            $table->string('banque_envisagee')->nullable();
            $table->decimal('taux_estime', 5, 2)->nullable();
            $table->integer('duree_estimee')->nullable();
            $table->date('date_objectif')->nullable();
            $table->string('priorite')->default('moyenne');
            $table->string('statut')->default('en_attente');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Annulations
        Schema::create('annulations', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->string('type');
            $table->unsignedBigInteger('document_id');
            $table->string('document_numero');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->decimal('montant', 15, 2);
            $table->date('date');
            $table->text('motif');
            $table->boolean('avoir_genere')->default(false);
            $table->string('numero_avoir')->nullable();
            $table->timestamps();
        });

        // Notes de début
        Schema::create('notes_debut', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->string('type');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('ordre_id')->nullable()->constrained('ordres_travail')->nullOnDelete();
            $table->foreignId('facture_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date_creation');
            $table->string('conteneur_numero')->nullable();
            $table->string('conteneur_taille')->nullable();
            $table->string('navire')->nullable();
            $table->foreignId('armateur_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('transitaire_id')->nullable()->constrained()->nullOnDelete();
            $table->string('numero_bl')->nullable();
            $table->date('date_arrivee')->nullable();
            $table->date('date_debut_stockage')->nullable();
            $table->date('date_fin_stockage')->nullable();
            $table->integer('jours_franchise')->default(0);
            $table->integer('jours_stockage')->default(0);
            $table->decimal('tarif_journalier', 15, 2)->default(0);
            $table->decimal('montant_stockage', 15, 2)->default(0);
            $table->decimal('montant_manutention', 15, 2)->default(0);
            $table->decimal('montant_total', 15, 2)->default(0);
            $table->text('observations')->nullable();
            $table->string('statut')->default('brouillon');
            $table->timestamps();
            $table->softDeletes();
        });

        // Audit
        Schema::create('audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('module');
            $table->string('document_type')->nullable();
            $table->unsignedBigInteger('document_id')->nullable();
            $table->string('document_numero')->nullable();
            $table->text('details')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestamps();
            $table->index(['module', 'action']);
            $table->index('created_at');
        });

        // Configuration
        Schema::create('configurations', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audits');
        Schema::dropIfExists('notes_debut');
        Schema::dropIfExists('annulations');
        Schema::dropIfExists('previsions');
        Schema::dropIfExists('modifications_credits');
        Schema::dropIfExists('documents_credits');
        Schema::dropIfExists('remboursements_credits');
        Schema::dropIfExists('echeances_credits');
        Schema::dropIfExists('credits_bancaires');
        Schema::dropIfExists('paiement_prime_items');
        Schema::dropIfExists('paiements_primes');
        Schema::dropIfExists('primes');
        Schema::dropIfExists('mouvements_caisse');
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('lots_factures');
        Schema::dropIfExists('lots_ordres');
        Schema::dropIfExists('lots_devis');
        Schema::dropIfExists('operations_conteneurs_factures');
        Schema::dropIfExists('conteneurs_factures');
        Schema::dropIfExists('operations_conteneurs_ordres');
        Schema::dropIfExists('conteneurs_ordres');
        Schema::dropIfExists('operations_conteneurs_devis');
        Schema::dropIfExists('conteneurs_devis');
        Schema::dropIfExists('lignes_factures');
        Schema::dropIfExists('lignes_ordres');
        Schema::dropIfExists('lignes_devis');
        Schema::dropIfExists('factures');
        Schema::dropIfExists('ordres_travail');
        Schema::dropIfExists('devis');
        Schema::dropIfExists('armateurs');
        Schema::dropIfExists('representants');
        Schema::dropIfExists('transitaires');
        Schema::dropIfExists('banques');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('configurations');
    }
};
