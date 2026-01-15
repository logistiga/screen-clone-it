# Templates d'Emails - LOJISTIGA

Ce document contient tous les modèles d'emails à importer dans la gestion des templates.
Chaque template inclut : nom, type, objet, contenu HTML et variables disponibles.

---

## 📋 LISTE DES TEMPLATES

| # | Nom | Type | Description |
|---|-----|------|-------------|
| 1 | Envoi de Devis | devis | Envoi d'un devis au client |
| 2 | Envoi de Facture | facture | Envoi d'une facture au client |
| 3 | Envoi d'Ordre de Travail | ordre | Envoi d'un OT au client/transitaire |
| 4 | Confirmation de Paiement | confirmation | Confirmation après réception d'un paiement |
| 5 | Rappel de Paiement - Niveau 1 | relance | Premier rappel pour facture impayée |
| 6 | Rappel de Paiement - Niveau 2 | relance | Deuxième rappel (urgent) |
| 7 | Rappel de Paiement - Niveau 3 | relance | Dernier rappel avant actions |
| 8 | Rapport Quotidien | notification | Récapitulatif quotidien des activités |
| 9 | Rapport des Factures Impayées | notification | Liste des factures non réglées |
| 10 | Rapport des Ordres de Travail | notification | Synthèse des OT en cours |
| 11 | Rapport de Paiements | notification | Récapitulatif des paiements reçus |
| 12 | Nouveau Client | notification | Email de bienvenue nouveau client |
| 13 | Alerte Échéance Crédit | notification | Alerte crédit bancaire arrivant à échéance |

---

## 1️⃣ ENVOI DE DEVIS

**Nom:** `Envoi de Devis`
**Type:** `devis`
**Objet:** `Votre Devis N°{{numero_devis}} - LOJISTIGA`

**Variables disponibles:**
- `{{client_nom}}` - Nom du client
- `{{numero_devis}}` - Numéro du devis
- `{{date_devis}}` - Date du devis
- `{{date_validite}}` - Date de validité
- `{{montant_ht}}` - Montant HT
- `{{remise_montant}}` - Montant de la remise
- `{{remise_type}}` - Type de remise (pourcentage/fixe)
- `{{montant_tva}}` - Montant TVA
- `{{montant_css}}` - Montant CSS
- `{{montant_ttc}}` - Montant TTC
- `{{message_personnalise}}` - Message personnalisé optionnel
- `{{signature}}` - Signature de l'entreprise

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px;">Solutions Logistiques Professionnelles</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px;">
      📄 Devis N°{{numero_devis}}
    </h2>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Suite à votre demande, nous avons le plaisir de vous transmettre notre devis détaillé.
    </p>

    {{#if message_personnalise}}
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;">{{message_personnalise}}</p>
    </div>
    {{/if}}

    <!-- Détails financiers -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        💰 Détails Financiers
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant HT</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{montant_ht}} FCFA</td>
        </tr>
        {{#if remise_montant}}
        <tr>
          <td style="padding: 8px 0; color: #059669; font-size: 14px;">Remise ({{remise_type}})</td>
          <td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600;">-{{remise_montant}} FCFA</td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">TVA (18%)</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_tva}} FCFA</td>
        </tr>
        {{#if montant_css}}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">CSS (1%)</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_css}} FCFA</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #1e40af;">
          <td style="padding: 12px 0; color: #1e40af; font-size: 16px; font-weight: 700;">TOTAL TTC</td>
          <td style="padding: 12px 0; color: #1e40af; font-size: 18px; text-align: right; font-weight: 700;">{{montant_ttc}} FCFA</td>
        </tr>
      </table>
    </div>

    <!-- Infos devis -->
    <div style="display: flex; gap: 20px; margin: 25px 0;">
      <div style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #92400e; margin: 0; font-size: 12px;">📅 Date du devis</p>
        <p style="color: #78350f; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{date_devis}}</p>
      </div>
      <div style="flex: 1; background: #fee2e2; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #991b1b; margin: 0; font-size: 12px;">⏰ Validité</p>
        <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{date_validite}}</p>
      </div>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Ce devis est valable jusqu'au <strong>{{date_validite}}</strong>. N'hésitez pas à nous contacter pour toute question ou pour confirmer votre commande.
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Cordialement,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Solutions Logistiques<br>
      Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.
    </p>
  </div>
</div>
```

---

## 2️⃣ ENVOI DE FACTURE

**Nom:** `Envoi de Facture`
**Type:** `facture`
**Objet:** `Votre Facture N°{{numero_facture}} - LOJISTIGA`

**Variables disponibles:**
- `{{client_nom}}` - Nom du client
- `{{numero_facture}}` - Numéro de la facture
- `{{date_facture}}` - Date de facturation
- `{{date_echeance}}` - Date d'échéance
- `{{montant_ht}}` - Montant HT
- `{{remise_montant}}` - Montant de la remise
- `{{remise_type}}` - Type de remise
- `{{montant_tva}}` - Montant TVA
- `{{montant_css}}` - Montant CSS
- `{{montant_ttc}}` - Montant TTC
- `{{reste_a_payer}}` - Reste à payer
- `{{statut}}` - Statut de la facture
- `{{message_personnalise}}` - Message personnalisé
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">Facture Professionnelle</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 20px;">
      🧾 Facture N°{{numero_facture}}
    </h2>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Veuillez trouver ci-joint votre facture pour les prestations réalisées.
    </p>

    {{#if message_personnalise}}
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
      <p style="color: #047857; margin: 0; font-size: 14px;">{{message_personnalise}}</p>
    </div>
    {{/if}}

    <!-- Détails financiers -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        💰 Récapitulatif
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant HT</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{montant_ht}} FCFA</td>
        </tr>
        {{#if remise_montant}}
        <tr>
          <td style="padding: 8px 0; color: #059669; font-size: 14px;">Remise ({{remise_type}})</td>
          <td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right; font-weight: 600;">-{{remise_montant}} FCFA</td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">TVA (18%)</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_tva}} FCFA</td>
        </tr>
        {{#if montant_css}}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">CSS (1%)</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_css}} FCFA</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #059669;">
          <td style="padding: 12px 0; color: #059669; font-size: 16px; font-weight: 700;">TOTAL TTC</td>
          <td style="padding: 12px 0; color: #059669; font-size: 18px; text-align: right; font-weight: 700;">{{montant_ttc}} FCFA</td>
        </tr>
        {{#if reste_a_payer}}
        <tr style="background: #fef2f2;">
          <td style="padding: 12px; color: #dc2626; font-size: 14px; font-weight: 600;">Reste à payer</td>
          <td style="padding: 12px; color: #dc2626; font-size: 16px; text-align: right; font-weight: 700;">{{reste_a_payer}} FCFA</td>
        </tr>
        {{/if}}
      </table>
    </div>

    <!-- Dates importantes -->
    <div style="display: flex; gap: 20px; margin: 25px 0;">
      <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #166534; margin: 0; font-size: 12px;">📅 Date de facturation</p>
        <p style="color: #14532d; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{date_facture}}</p>
      </div>
      <div style="flex: 1; background: #fef3c7; border-radius: 8px; padding: 15px; text-align: center;">
        <p style="color: #92400e; margin: 0; font-size: 12px;">⏰ Échéance</p>
        <p style="color: #78350f; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{date_echeance}}</p>
      </div>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Merci de procéder au règlement avant le <strong>{{date_echeance}}</strong>.
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Cordialement,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Solutions Logistiques<br>
      Pour toute question, contactez notre service comptabilité.
    </p>
  </div>
</div>
```

---

## 3️⃣ ENVOI D'ORDRE DE TRAVAIL

**Nom:** `Envoi d'Ordre de Travail`
**Type:** `ordre`
**Objet:** `Ordre de Travail N°{{numero_ordre}} - LOJISTIGA`

**Variables disponibles:**
- `{{client_nom}}` - Nom du client
- `{{numero_ordre}}` - Numéro de l'OT
- `{{date_creation}}` - Date de création
- `{{conteneurs}}` - Liste des conteneurs
- `{{statut}}` - Statut de l'OT
- `{{montant_ht}}` - Montant HT
- `{{remise_montant}}` - Montant remise
- `{{montant_ttc}}` - Montant TTC
- `{{message_personnalise}}` - Message personnalisé
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 14px;">Ordre de Travail</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h2 style="color: #7c3aed; margin: 0 0 20px 0; font-size: 20px;">
      📦 Ordre de Travail N°{{numero_ordre}}
    </h2>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Nous vous confirmons la prise en charge de votre ordre de travail.
    </p>

    {{#if message_personnalise}}
    <div style="background: #faf5ff; border-left: 4px solid #a855f7; padding: 15px; margin: 20px 0;">
      <p style="color: #6b21a8; margin: 0; font-size: 14px;">{{message_personnalise}}</p>
    </div>
    {{/if}}

    <!-- Infos OT -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        📋 Détails de l'Ordre
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">N° Ordre</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_ordre}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date de création</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_creation}}</td>
        </tr>
        {{#if conteneurs}}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Conteneur(s)</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{conteneurs}}</td>
        </tr>
        {{/if}}
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Statut</td>
          <td style="padding: 8px 0; text-align: right;">
            <span style="background: #ddd6fe; color: #5b21b6; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">{{statut}}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Montants -->
    <div style="background: #faf5ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant HT</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_ht}} FCFA</td>
        </tr>
        {{#if remise_montant}}
        <tr>
          <td style="padding: 8px 0; color: #059669; font-size: 14px;">Remise</td>
          <td style="padding: 8px 0; color: #059669; font-size: 14px; text-align: right;">-{{remise_montant}} FCFA</td>
        </tr>
        {{/if}}
        <tr style="border-top: 2px solid #7c3aed;">
          <td style="padding: 12px 0; color: #7c3aed; font-size: 16px; font-weight: 700;">TOTAL TTC</td>
          <td style="padding: 12px 0; color: #7c3aed; font-size: 18px; text-align: right; font-weight: 700;">{{montant_ttc}} FCFA</td>
        </tr>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Cordialement,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Solutions Logistiques
    </p>
  </div>
</div>
```

---

## 4️⃣ CONFIRMATION DE PAIEMENT

**Nom:** `Confirmation de Paiement`
**Type:** `confirmation`
**Objet:** `Confirmation de Paiement - Réf. {{reference_paiement}}`

**Variables disponibles:**
- `{{client_nom}}` - Nom du client
- `{{reference_paiement}}` - Référence du paiement
- `{{numero_facture}}` - Numéro de la facture associée
- `{{date_paiement}}` - Date du paiement
- `{{montant_paye}}` - Montant payé
- `{{mode_paiement}}` - Mode de paiement
- `{{reste_a_payer}}` - Reste à payer (si partiel)
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #059669 0%, #34d399 100%); padding: 30px; text-align: center;">
    <div style="background: #ffffff; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 30px;">✓</span>
    </div>
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Paiement Reçu</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">Merci pour votre confiance</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Nous accusons réception de votre paiement et vous en remercions.
    </p>

    <!-- Détails paiement -->
    <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #a7f3d0;">
      <h3 style="color: #059669; margin: 0 0 15px 0; font-size: 16px;">
        💳 Détails du Paiement
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Référence</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{reference_paiement}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{numero_facture}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_paiement}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Mode</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{mode_paiement}}</td>
        </tr>
        <tr style="border-top: 2px solid #059669; background: #d1fae5;">
          <td style="padding: 12px 8px; color: #059669; font-size: 16px; font-weight: 700;">Montant payé</td>
          <td style="padding: 12px 8px; color: #059669; font-size: 18px; text-align: right; font-weight: 700;">{{montant_paye}} FCFA</td>
        </tr>
      </table>
    </div>

    {{#if reste_a_payer}}
    <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>⚠️ Reste à payer :</strong> {{reste_a_payer}} FCFA
      </p>
    </div>
    {{else}}
    <div style="background: #d1fae5; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="color: #047857; margin: 0; font-size: 16px; font-weight: 600;">
        ✅ Facture entièrement soldée
      </p>
    </div>
    {{/if}}

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Cordialement,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Solutions Logistiques<br>
      Ce reçu fait foi de paiement.
    </p>
  </div>
</div>
```

---

## 5️⃣ RAPPEL DE PAIEMENT - NIVEAU 1

**Nom:** `Rappel de Paiement - Niveau 1`
**Type:** `relance`
**Objet:** `Rappel : Facture N°{{numero_facture}} en attente de règlement`

**Variables disponibles:**
- `{{client_nom}}` - Nom du client
- `{{numero_facture}}` - Numéro de la facture
- `{{date_facture}}` - Date de facturation
- `{{date_echeance}}` - Date d'échéance
- `{{montant_du}}` - Montant dû
- `{{jours_retard}}` - Nombre de jours de retard
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 14px;">Rappel de Paiement</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h2 style="color: #f59e0b; margin: 0 0 20px 0; font-size: 20px;">
      🔔 Rappel Amical
    </h2>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de la facture suivante :
    </p>

    <!-- Détails facture -->
    <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #fcd34d;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_facture}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date de facturation</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_facture}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Échéance</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{date_echeance}}</td>
        </tr>
        <tr style="border-top: 2px solid #f59e0b;">
          <td style="padding: 12px 0; color: #f59e0b; font-size: 16px; font-weight: 700;">Montant dû</td>
          <td style="padding: 12px 0; color: #f59e0b; font-size: 18px; text-align: right; font-weight: 700;">{{montant_du}} FCFA</td>
        </tr>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Si le paiement a déjà été effectué, nous vous prions de ne pas tenir compte de ce message.
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Cordialement,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Service Comptabilité
    </p>
  </div>
</div>
```

---

## 6️⃣ RAPPEL DE PAIEMENT - NIVEAU 2

**Nom:** `Rappel de Paiement - Niveau 2`
**Type:** `relance`
**Objet:** `⚠️ URGENT : Facture N°{{numero_facture}} - {{jours_retard}} jours de retard`

**Variables:** (identiques au niveau 1)

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 14px;">Rappel Urgent</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h2 style="color: #ea580c; margin: 0 0 20px 0; font-size: 20px;">
      ⚠️ Second Rappel - Retard de {{jours_retard}} jours
    </h2>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Malgré notre précédent rappel, nous constatons que la facture ci-dessous reste impayée :
    </p>

    <!-- Alerte retard -->
    <div style="background: #fef2f2; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="color: #dc2626; margin: 0; font-size: 14px; font-weight: 600;">
        ⏰ Retard de paiement : {{jours_retard}} jours
      </p>
    </div>

    <!-- Détails facture -->
    <div style="background: #fff7ed; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #fdba74;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_facture}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Échéance dépassée</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{date_echeance}}</td>
        </tr>
        <tr style="border-top: 2px solid #ea580c;">
          <td style="padding: 12px 0; color: #ea580c; font-size: 16px; font-weight: 700;">Montant dû</td>
          <td style="padding: 12px 0; color: #ea580c; font-size: 18px; text-align: right; font-weight: 700;">{{montant_du}} FCFA</td>
        </tr>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      <strong>Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.</strong>
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Cordialement,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Service Recouvrement
    </p>
  </div>
</div>
```

---

## 7️⃣ RAPPEL DE PAIEMENT - NIVEAU 3

**Nom:** `Rappel de Paiement - Niveau 3`
**Type:** `relance`
**Objet:** `🚨 DERNIER RAPPEL : Facture N°{{numero_facture}} - Action imminente`

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">LOJISTIGA</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">Dernier Avertissement</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 20px;">
      🚨 DERNIER RAPPEL AVANT ACTIONS
    </h2>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Malgré nos multiples relances, votre facture reste impayée depuis <strong>{{jours_retard}} jours</strong>.
    </p>

    <!-- Alerte critique -->
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 16px;">
        ⚠️ ATTENTION
      </h3>
      <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.6;">
        Sans règlement de votre part sous <strong>48 heures</strong>, nous serons contraints d'engager des procédures de recouvrement, pouvant inclure :
      </p>
      <ul style="color: #7f1d1d; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
        <li>Suspension de tous les services en cours</li>
        <li>Application de pénalités de retard</li>
        <li>Transmission au service contentieux</li>
      </ul>
    </div>

    <!-- Détails facture -->
    <div style="background: #fee2e2; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Facture N°</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{numero_facture}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Retard</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{jours_retard}} jours</td>
        </tr>
        <tr style="border-top: 2px solid #dc2626;">
          <td style="padding: 12px 0; color: #dc2626; font-size: 16px; font-weight: 700;">MONTANT DÛ</td>
          <td style="padding: 12px 0; color: #dc2626; font-size: 20px; text-align: right; font-weight: 700;">{{montant_du}} FCFA</td>
        </tr>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Pour éviter ces désagréments, merci de procéder au règlement immédiat ou de nous contacter pour convenir d'un échéancier.
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #1f2937; padding: 20px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      LOJISTIGA - Service Contentieux<br>
      Ce courrier vaut mise en demeure.
    </p>
  </div>
</div>
```

---

## 8️⃣ RAPPORT QUOTIDIEN

**Nom:** `Rapport Quotidien`
**Type:** `notification`
**Objet:** `📊 Récapitulatif Quotidien - {{date}}`

**Variables disponibles:**
- `{{date}}` - Date du rapport
- `{{factures_creees}}` - Nombre de factures créées
- `{{factures_payees}}` - Nombre de factures payées
- `{{devis_crees}}` - Nombre de devis créés
- `{{ordres_crees}}` - Nombre d'OT créés
- `{{montant_encaisse}}` - Montant total encaissé
- `{{factures_impayees}}` - Nombre de factures impayées
- `{{montant_impaye}}` - Montant total impayé
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📊 Rapport Quotidien</h1>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">{{date}}</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Bonjour,<br>
      Voici le récapitulatif de l'activité du jour :
    </p>

    <!-- Statistiques -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
      <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #166534; margin: 0; font-size: 12px;">📄 Factures créées</p>
        <p style="color: #14532d; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{factures_creees}}</p>
      </div>
      <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #047857; margin: 0; font-size: 12px;">✅ Factures payées</p>
        <p style="color: #065f46; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{factures_payees}}</p>
      </div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #1e40af; margin: 0; font-size: 12px;">📋 Devis créés</p>
        <p style="color: #1e3a8a; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{devis_crees}}</p>
      </div>
      <div style="background: #faf5ff; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #7c3aed; margin: 0; font-size: 12px;">📦 Ordres créés</p>
        <p style="color: #5b21b6; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{ordres_crees}}</p>
      </div>
    </div>

    <!-- Montant encaissé -->
    <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
      <p style="color: #d1fae5; margin: 0; font-size: 14px;">💰 Montant encaissé aujourd'hui</p>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">{{montant_encaisse}} FCFA</p>
    </div>

    <!-- Alertes impayés -->
    {{#if factures_impayees}}
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">⚠️ Attention - Factures impayées</h3>
      <p style="color: #7f1d1d; margin: 0; font-size: 14px;">
        <strong>{{factures_impayees}}</strong> facture(s) en retard pour un total de <strong>{{montant_impaye}} FCFA</strong>
      </p>
    </div>
    {{/if}}

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      Connectez-vous à LOJISTIGA pour plus de détails.<br><br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      Rapport généré automatiquement par LOJISTIGA
    </p>
  </div>
</div>
```

---

## 9️⃣ RAPPORT DES FACTURES IMPAYÉES

**Nom:** `Rapport des Factures Impayées`
**Type:** `notification`
**Objet:** `🚨 Rapport Factures Impayées - {{date}} ({{nombre_factures}} factures)`

**Variables disponibles:**
- `{{date}}` - Date du rapport
- `{{nombre_factures}}` - Nombre total de factures impayées
- `{{montant_total}}` - Montant total impayé
- `{{liste_factures}}` - Liste HTML des factures
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #dc2626 0%, #f87171 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚨 Factures Impayées</h1>
    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">Rapport du {{date}}</p>
  </div>

  <!-- Résumé -->
  <div style="background: #fef2f2; padding: 20px; display: flex; justify-content: space-around; border-bottom: 1px solid #fecaca;">
    <div style="text-align: center;">
      <p style="color: #991b1b; margin: 0; font-size: 12px;">Nombre de factures</p>
      <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{nombre_factures}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #991b1b; margin: 0; font-size: 12px;">Montant total dû</p>
      <p style="color: #7f1d1d; margin: 5px 0 0 0; font-size: 28px; font-weight: 700;">{{montant_total}} FCFA</p>
    </div>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Voici la liste des factures en attente de règlement :
    </p>

    <!-- Tableau des factures -->
    <div style="margin: 25px 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #fee2e2;">
            <th style="padding: 12px 8px; text-align: left; color: #991b1b; border-bottom: 2px solid #dc2626;">N° Facture</th>
            <th style="padding: 12px 8px; text-align: left; color: #991b1b; border-bottom: 2px solid #dc2626;">Client</th>
            <th style="padding: 12px 8px; text-align: right; color: #991b1b; border-bottom: 2px solid #dc2626;">Montant</th>
            <th style="padding: 12px 8px; text-align: center; color: #991b1b; border-bottom: 2px solid #dc2626;">Retard</th>
          </tr>
        </thead>
        <tbody>
          {{liste_factures}}
        </tbody>
      </table>
    </div>

    <p style="color: #6b7280; font-size: 13px; font-style: italic;">
      * Les factures sont triées par ordre de retard décroissant
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #1f2937; padding: 20px; text-align: center;">
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      LOJISTIGA - Service Recouvrement
    </p>
  </div>
</div>
```

**Format d'une ligne de liste_factures:**
```html
<tr style="border-bottom: 1px solid #e5e7eb;">
  <td style="padding: 10px 8px; color: #374151; font-weight: 600;">FAC-2024-001</td>
  <td style="padding: 10px 8px; color: #374151;">Nom du Client</td>
  <td style="padding: 10px 8px; color: #dc2626; text-align: right; font-weight: 600;">500 000 FCFA</td>
  <td style="padding: 10px 8px; text-align: center;">
    <span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 11px;">15 jours</span>
  </td>
</tr>
```

---

## 🔟 RAPPORT DES ORDRES DE TRAVAIL

**Nom:** `Rapport des Ordres de Travail`
**Type:** `notification`
**Objet:** `📦 Rapport OT - {{date}} ({{nombre_ordres}} ordres)`

**Variables disponibles:**
- `{{date}}` - Date du rapport
- `{{nombre_ordres}}` - Nombre total d'ordres
- `{{ordres_en_cours}}` - Nombre d'OT en cours
- `{{ordres_termines}}` - Nombre d'OT terminés
- `{{ordres_en_attente}}` - Nombre d'OT en attente
- `{{montant_total}}` - Montant total des OT
- `{{liste_ordres}}` - Liste HTML des ordres
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📦 Rapport Ordres de Travail</h1>
    <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 14px;">{{date}}</p>
  </div>

  <!-- Statistiques -->
  <div style="background: #faf5ff; padding: 20px; display: flex; justify-content: space-around; border-bottom: 1px solid #e9d5ff;">
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">🔄 En cours</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{ordres_en_cours}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">✅ Terminés</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{ordres_termines}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">⏳ En attente</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 24px; font-weight: 700;">{{ordres_en_attente}}</p>
    </div>
    <div style="text-align: center;">
      <p style="color: #6b21a8; margin: 0; font-size: 11px;">💰 Total</p>
      <p style="color: #581c87; margin: 5px 0 0 0; font-size: 18px; font-weight: 700;">{{montant_total}}</p>
    </div>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Synthèse des ordres de travail :
    </p>

    <!-- Tableau des ordres -->
    <div style="margin: 25px 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f3e8ff;">
            <th style="padding: 12px 8px; text-align: left; color: #6b21a8; border-bottom: 2px solid #a855f7;">N° OT</th>
            <th style="padding: 12px 8px; text-align: left; color: #6b21a8; border-bottom: 2px solid #a855f7;">Client</th>
            <th style="padding: 12px 8px; text-align: center; color: #6b21a8; border-bottom: 2px solid #a855f7;">Conteneurs</th>
            <th style="padding: 12px 8px; text-align: center; color: #6b21a8; border-bottom: 2px solid #a855f7;">Statut</th>
            <th style="padding: 12px 8px; text-align: right; color: #6b21a8; border-bottom: 2px solid #a855f7;">Montant</th>
          </tr>
        </thead>
        <tbody>
          {{liste_ordres}}
        </tbody>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Gestion des Opérations
    </p>
  </div>
</div>
```

---

## 1️⃣1️⃣ RAPPORT DE PAIEMENTS

**Nom:** `Rapport de Paiements`
**Type:** `notification`
**Objet:** `💰 Rapport des Paiements - {{periode}} ({{montant_total}} FCFA)`

**Variables disponibles:**
- `{{periode}}` - Période du rapport (ex: "Janvier 2024")
- `{{date_debut}}` - Date de début
- `{{date_fin}}` - Date de fin
- `{{nombre_paiements}}` - Nombre de paiements
- `{{montant_total}}` - Montant total encaissé
- `{{paiements_especes}}` - Total en espèces
- `{{paiements_virement}}` - Total par virement
- `{{paiements_cheque}}` - Total par chèque
- `{{paiements_mobile}}` - Total Mobile Money
- `{{liste_paiements}}` - Liste HTML des paiements
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #059669 0%, #34d399 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💰 Rapport des Paiements</h1>
    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 14px;">{{periode}}</p>
  </div>

  <!-- Montant total -->
  <div style="background: #ecfdf5; padding: 25px; text-align: center; border-bottom: 2px solid #10b981;">
    <p style="color: #047857; margin: 0; font-size: 14px;">Total encaissé</p>
    <p style="color: #065f46; margin: 10px 0 0 0; font-size: 36px; font-weight: 700;">{{montant_total}} FCFA</p>
    <p style="color: #059669; margin: 10px 0 0 0; font-size: 13px;">{{nombre_paiements}} paiement(s) reçu(s)</p>
  </div>

  <!-- Répartition par mode -->
  <div style="padding: 25px; background: #f8fafc;">
    <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; text-align: center;">Répartition par mode de paiement</h3>
    <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">💵 Espèces</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_especes}}</p>
      </div>
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">🏦 Virement</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_virement}}</p>
      </div>
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">📝 Chèque</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_cheque}}</p>
      </div>
      <div style="background: #ffffff; border-radius: 8px; padding: 15px 20px; text-align: center; min-width: 120px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #6b7280; margin: 0; font-size: 11px;">📱 Mobile</p>
        <p style="color: #374151; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">{{paiements_mobile}}</p>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Détail des paiements</h3>

    <!-- Tableau des paiements -->
    <div style="margin: 15px 0; overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #ecfdf5;">
            <th style="padding: 10px 6px; text-align: left; color: #047857; border-bottom: 2px solid #10b981;">Date</th>
            <th style="padding: 10px 6px; text-align: left; color: #047857; border-bottom: 2px solid #10b981;">Référence</th>
            <th style="padding: 10px 6px; text-align: left; color: #047857; border-bottom: 2px solid #10b981;">Client</th>
            <th style="padding: 10px 6px; text-align: center; color: #047857; border-bottom: 2px solid #10b981;">Mode</th>
            <th style="padding: 10px 6px; text-align: right; color: #047857; border-bottom: 2px solid #10b981;">Montant</th>
          </tr>
        </thead>
        <tbody>
          {{liste_paiements}}
        </tbody>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Service Comptabilité
    </p>
  </div>
</div>
```

---

## 1️⃣2️⃣ BIENVENUE NOUVEAU CLIENT

**Nom:** `Bienvenue Nouveau Client`
**Type:** `notification`
**Objet:** `🎉 Bienvenue chez LOJISTIGA, {{client_nom}} !`

**Variables disponibles:**
- `{{client_nom}}` - Nom du client
- `{{client_email}}` - Email du client
- `{{client_telephone}}` - Téléphone du client
- `{{date_creation}}` - Date de création du compte
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px; text-align: center;">
    <div style="background: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
      <span style="font-size: 40px;">🎉</span>
    </div>
    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bienvenue !</h1>
    <p style="color: #bfdbfe; margin: 15px 0 0 0; font-size: 16px;">Nous sommes ravis de vous compter parmi nous</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Bonjour <strong>{{client_nom}}</strong>,
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Toute l'équipe LOJISTIGA vous souhaite la bienvenue ! Nous sommes honorés de votre confiance et nous engageons à vous offrir un service de qualité.
    </p>

    <!-- Infos compte -->
    <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px;">📋 Vos informations</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nom / Société</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{client_nom}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{client_email}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Téléphone</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{client_telephone}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Compte créé le</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{date_creation}}</td>
        </tr>
      </table>
    </div>

    <!-- Services -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">🚀 Nos services</h3>
      <ul style="color: #374151; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Gestion logistique complète</li>
        <li>Suivi des conteneurs en temps réel</li>
        <li>Devis et facturation professionnels</li>
        <li>Support réactif et personnalisé</li>
      </ul>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      N'hésitez pas à nous contacter pour toute question ou besoin particulier.
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      À très bientôt,<br>
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #1e40af; padding: 25px; text-align: center;">
    <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 600;">LOJISTIGA</p>
    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 12px;">
      Solutions Logistiques Professionnelles
    </p>
  </div>
</div>
```

---

## 1️⃣3️⃣ ALERTE ÉCHÉANCE CRÉDIT

**Nom:** `Alerte Échéance Crédit`
**Type:** `notification`
**Objet:** `⏰ Alerte : Échéance crédit {{reference}} dans {{jours_restants}} jours`

**Variables disponibles:**
- `{{reference}}` - Référence du crédit
- `{{banque}}` - Nom de la banque
- `{{montant_total}}` - Montant total du crédit
- `{{montant_echeance}}` - Montant de l'échéance
- `{{date_echeance}}` - Date d'échéance
- `{{jours_restants}}` - Jours restants avant échéance
- `{{signature}}` - Signature

**Contenu:**
```html
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Alerte Échéance</h1>
    <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 14px;">Crédit Bancaire</p>
  </div>

  <!-- Alerte jours -->
  <div style="background: {{jours_restants <= 7 ? '#fef2f2' : '#fffbeb'}}; padding: 20px; text-align: center; border-bottom: 3px solid {{jours_restants <= 7 ? '#dc2626' : '#f59e0b'}};">
    <p style="color: {{jours_restants <= 7 ? '#dc2626' : '#f59e0b'}}; margin: 0; font-size: 14px; font-weight: 600;">
      {{#if (jours_restants <= 7)}}🚨 URGENT{{else}}⚠️ ATTENTION{{/if}}
    </p>
    <p style="color: {{jours_restants <= 7 ? '#7f1d1d' : '#92400e'}}; margin: 10px 0 0 0; font-size: 32px; font-weight: 700;">{{jours_restants}} jours</p>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 13px;">avant l'échéance</p>
  </div>

  <!-- Content -->
  <div style="padding: 30px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Une échéance de crédit approche. Voici les détails :
    </p>

    <!-- Détails crédit -->
    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
        🏦 Informations du Crédit
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Référence</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right; font-weight: 600;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Banque</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{banque}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Montant total</td>
          <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">{{montant_total}} FCFA</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date d'échéance</td>
          <td style="padding: 8px 0; color: #dc2626; font-size: 14px; text-align: right; font-weight: 600;">{{date_echeance}}</td>
        </tr>
        <tr style="border-top: 2px solid #f59e0b; background: #fffbeb;">
          <td style="padding: 12px 8px; color: #f59e0b; font-size: 16px; font-weight: 700;">Montant à payer</td>
          <td style="padding: 12px 8px; color: #f59e0b; font-size: 18px; text-align: right; font-weight: 700;">{{montant_echeance}} FCFA</td>
        </tr>
      </table>
    </div>

    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      Merci de vous assurer que les fonds sont disponibles pour honorer cette échéance.
    </p>

    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 25px;">
      <strong>{{signature}}</strong>
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #64748b; margin: 0; font-size: 12px;">
      LOJISTIGA - Gestion Financière
    </p>
  </div>
</div>
```

---

## 📝 NOTES D'UTILISATION

### Variables Communes
Toutes les templates peuvent utiliser ces variables supplémentaires :
- `{{entreprise_nom}}` - Nom de l'entreprise
- `{{entreprise_adresse}}` - Adresse de l'entreprise
- `{{entreprise_telephone}}` - Téléphone de l'entreprise
- `{{entreprise_email}}` - Email de l'entreprise
- `{{logo_url}}` - URL du logo de l'entreprise

### Import dans la base de données

Pour importer ces templates via le seeder Laravel :

```php
EmailTemplate::create([
    'nom' => 'Nom du Template',
    'type' => 'devis', // devis, facture, ordre, confirmation, relance, notification, custom
    'objet' => 'Sujet avec {{variables}}',
    'contenu' => 'Contenu HTML...',
    'variables' => ['variable1', 'variable2', ...],
    'actif' => true,
    'created_by' => 1,
]);
```

### Personnalisation
Les templates utilisent une syntaxe de type Handlebars pour les conditions :
- `{{#if variable}}...{{/if}}` - Affichage conditionnel
- `{{#else}}...{{/else}}` - Alternative
- `{{variable}}` - Remplacement de variable

Pour l'implémentation PHP, utilisez `str_replace()` pour les variables simples et une logique personnalisée pour les conditions.

---

*Document généré pour LOJISTIGA - Tous droits réservés*
