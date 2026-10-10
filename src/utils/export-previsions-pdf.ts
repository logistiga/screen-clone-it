import html2pdf from 'html2pdf.js';
import type { StatsMensuelles, DetailCategorie } from '@/lib/api/previsions';

const moisNoms = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const formatMontant = (montant: number) => 
  Math.round(montant).toLocaleString('fr-FR') + ' FCFA';

// Couleurs pour le camembert
const pieColors = [
  '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795',
  '#3182ce', '#5a67d8', '#805ad5', '#d53f8c', '#718096'
];

// Génère un graphique camembert SVG
function generatePieChart(data: DetailCategorie[], title: string): string {
  if (data.length === 0) return '';
  
  const total = data.reduce((sum, d) => sum + d.montant_realise, 0);
  if (total === 0) return '';

  const size = 160;
  const center = size / 2;
  const radius = 60;
  
  let currentAngle = -90; // Start from top
  
  const slices = data
    .filter(d => d.montant_realise > 0)
    .map((item, index) => {
      const percentage = (item.montant_realise / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      // Calculate SVG arc path
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      return {
        path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: pieColors[index % pieColors.length],
        label: item.categorie,
        percentage: percentage.toFixed(1),
        montant: item.montant_realise
      };
    });

  const legendItems = slices.map((s, i) => `
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
      <div style="width: 10px; height: 10px; border-radius: 2px; background: ${s.color};"></div>
      <span style="font-size: 9px; color: #4a5568;">${s.label}</span>
      <span style="font-size: 9px; color: #718096; margin-left: auto;">${s.percentage}%</span>
    </div>
  `).join('');

  return `
    <div style="margin-bottom: 25px; page-break-inside: avoid;">
      <h3 style="margin: 0 0 15px; color: #1a365d; font-size: 14px;">🥧 ${title}</h3>
      <div style="display: flex; gap: 20px; align-items: flex-start;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink: 0;">
          ${slices.map(s => `<path d="${s.path}" fill="${s.color}" stroke="#fff" stroke-width="1"/>`).join('')}
          <circle cx="${center}" cy="${center}" r="25" fill="#fff"/>
          <text x="${center}" y="${center - 5}" text-anchor="middle" font-size="10" fill="#1a365d" font-weight="bold">Total</text>
          <text x="${center}" y="${center + 8}" text-anchor="middle" font-size="8" fill="#4a5568">${(total / 1000000).toFixed(1)}M</text>
        </svg>
        <div style="flex: 1;">
          ${legendItems}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 10px; color: #718096;">Total: <strong style="color: #e53e3e;">${formatMontant(total)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Génère un graphique pour les recettes
function generateRecettesPieChart(data: DetailCategorie[]): string {
  if (data.length === 0) return '';
  
  const total = data.reduce((sum, d) => sum + d.montant_realise, 0);
  if (total === 0) return '';

  const recetteColors = ['#38a169', '#48bb78', '#68d391', '#9ae6b4', '#c6f6d5', '#2f855a', '#276749', '#22543d'];

  const size = 160;
  const center = size / 2;
  const radius = 60;
  
  let currentAngle = -90;
  
  const slices = data
    .filter(d => d.montant_realise > 0)
    .map((item, index) => {
      const percentage = (item.montant_realise / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      return {
        path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        color: recetteColors[index % recetteColors.length],
        label: item.categorie,
        percentage: percentage.toFixed(1),
        montant: item.montant_realise
      };
    });

  const legendItems = slices.map((s) => `
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
      <div style="width: 10px; height: 10px; border-radius: 2px; background: ${s.color};"></div>
      <span style="font-size: 9px; color: #4a5568;">${s.label}</span>
      <span style="font-size: 9px; color: #718096; margin-left: auto;">${s.percentage}%</span>
    </div>
  `).join('');

  return `
    <div style="margin-bottom: 25px; page-break-inside: avoid;">
      <h3 style="margin: 0 0 15px; color: #38a169; font-size: 14px;">🥧 RÉPARTITION DES RECETTES</h3>
      <div style="display: flex; gap: 20px; align-items: flex-start;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink: 0;">
          ${slices.map(s => `<path d="${s.path}" fill="${s.color}" stroke="#fff" stroke-width="1"/>`).join('')}
          <circle cx="${center}" cy="${center}" r="25" fill="#fff"/>
          <text x="${center}" y="${center - 5}" text-anchor="middle" font-size="10" fill="#22543d" font-weight="bold">Total</text>
          <text x="${center}" y="${center + 8}" text-anchor="middle" font-size="8" fill="#38a169">${(total / 1000000).toFixed(1)}M</text>
        </svg>
        <div style="flex: 1;">
          ${legendItems}
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 10px; color: #718096;">Total: <strong style="color: #38a169;">${formatMontant(total)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function exportPrevisionsPDF(stats: StatsMensuelles): Promise<void> {
  const { periode, synthese, details } = stats;
  const moisNom = moisNoms[periode.mois - 1];

  // Générer les graphiques camembert
  const depensesPieChart = generatePieChart(details.depenses, 'RÉPARTITION DES DÉPENSES');
  const recettesPieChart = generateRecettesPieChart(details.recettes);
  
  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333;">
      <!-- En-tête -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1a365d; padding-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; color: #1a365d;">RAPPORT PRÉVISIONS BUDGÉTAIRES</h1>
        <h2 style="margin: 10px 0 0; font-size: 18px; color: #4a5568;">${moisNom} ${periode.annee}</h2>
      </div>

      <!-- Synthèse globale -->
      <div style="margin-bottom: 30px; background: #f7fafc; padding: 20px; border-radius: 8px;">
        <h3 style="margin: 0 0 15px; color: #1a365d; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
          📊 SYNTHÈSE GLOBALE
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; width: 50%;">
              <div style="font-size: 12px; color: #718096;">Recettes prévues</div>
              <div style="font-size: 18px; font-weight: bold; color: #2d3748;">${formatMontant(synthese.recettes.prevu)}</div>
            </td>
            <td style="padding: 10px 0;">
              <div style="font-size: 12px; color: #718096;">Recettes réalisées</div>
              <div style="font-size: 18px; font-weight: bold; color: #38a169;">${formatMontant(synthese.recettes.realise)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0;">
              <div style="font-size: 12px; color: #718096;">Dépenses prévues</div>
              <div style="font-size: 18px; font-weight: bold; color: #2d3748;">${formatMontant(synthese.depenses.prevu)}</div>
            </td>
            <td style="padding: 10px 0;">
              <div style="font-size: 12px; color: #718096;">Dépenses réalisées</div>
              <div style="font-size: 18px; font-weight: bold; color: #e53e3e;">${formatMontant(synthese.depenses.realise)}</div>
            </td>
          </tr>
        </table>
        
        <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #e2e8f0;">
          <div>
            <div style="font-size: 12px; color: #718096;">Résultat du mois</div>
            <div style="font-size: 22px; font-weight: bold; color: ${synthese.benefice >= 0 ? '#38a169' : '#e53e3e'};">
              ${synthese.benefice >= 0 ? '+' : ''}${formatMontant(synthese.benefice)}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #718096;">Situation</div>
            <div style="font-size: 14px; font-weight: bold; padding: 5px 12px; border-radius: 4px; 
              background: ${synthese.dans_budget ? '#c6f6d5' : '#fed7d7'}; 
              color: ${synthese.dans_budget ? '#22543d' : '#742a2a'};">
              ${synthese.dans_budget ? '✓ Dans le budget' : '⚠ Budget dépassé'}
            </div>
          </div>
        </div>
      </div>

      <!-- Détails Caisse / Banque -->
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #d97706;">
          <h4 style="margin: 0 0 10px; color: #92400e; font-size: 14px;">💰 CAISSE</h4>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; color: #78716c;">Entrées</div>
              <div style="font-weight: bold; color: #38a169;">${formatMontant(synthese.recettes.caisse)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #78716c;">Sorties</div>
              <div style="font-weight: bold; color: #e53e3e;">${formatMontant(synthese.depenses.caisse)}</div>
            </div>
          </div>
        </div>
        <div style="flex: 1; background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h4 style="margin: 0 0 10px; color: #1e40af; font-size: 14px;">🏦 BANQUE</h4>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; color: #64748b;">Entrées</div>
              <div style="font-weight: bold; color: #38a169;">${formatMontant(synthese.recettes.banque)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #64748b;">Sorties</div>
              <div style="font-weight: bold; color: #e53e3e;">${formatMontant(synthese.depenses.banque)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques camembert -->
      <div style="display: flex; gap: 30px; margin-bottom: 30px; page-break-inside: avoid;">
        <div style="flex: 1;">${depensesPieChart}</div>
        <div style="flex: 1;">${recettesPieChart}</div>
      </div>

      <!-- Tableau des recettes -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px; color: #38a169; font-size: 14px;">📈 DÉTAIL DES RECETTES</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f0fdf4;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #86efac;">Catégorie</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #86efac;">Prévu</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #86efac;">Caisse</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #86efac;">Banque</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #86efac;">Total</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #86efac;">Taux</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #86efac;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${details.recettes.length > 0 ? details.recettes.map(r => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px;">${r.categorie}</td>
                <td style="padding: 8px; text-align: right;">${formatMontant(r.montant_prevu)}</td>
                <td style="padding: 8px; text-align: right; color: #6b7280;">${formatMontant(r.realise_caisse)}</td>
                <td style="padding: 8px; text-align: right; color: #6b7280;">${formatMontant(r.realise_banque)}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #38a169;">${formatMontant(r.montant_realise)}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: ${r.taux >= 100 ? '#38a169' : r.taux >= 50 ? '#d97706' : '#e53e3e'};">${r.taux}%</td>
                <td style="padding: 8px; text-align: center;">
                  <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px;
                    background: ${r.statut === 'atteint' ? '#c6f6d5' : r.statut === 'depasse' ? '#bfdbfe' : r.statut === 'en_cours' ? '#fef3c7' : '#fecaca'};
                    color: ${r.statut === 'atteint' ? '#22543d' : r.statut === 'depasse' ? '#1e40af' : r.statut === 'en_cours' ? '#92400e' : '#991b1b'};">
                    ${r.statut === 'atteint' ? '✓ Atteint' : r.statut === 'depasse' ? '↑ Dépassé' : r.statut === 'en_cours' ? '⏳ En cours' : '✗ Non atteint'}
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="7" style="padding: 20px; text-align: center; color: #9ca3af;">Aucune prévision de recette</td></tr>
            `}
            <tr style="background: #f0fdf4; font-weight: bold;">
              <td style="padding: 10px;">TOTAL RECETTES</td>
              <td style="padding: 10px; text-align: right;">${formatMontant(synthese.recettes.prevu)}</td>
              <td style="padding: 10px; text-align: right;">${formatMontant(synthese.recettes.caisse)}</td>
              <td style="padding: 10px; text-align: right;">${formatMontant(synthese.recettes.banque)}</td>
              <td style="padding: 10px; text-align: right; color: #38a169;">${formatMontant(synthese.recettes.realise)}</td>
              <td style="padding: 10px; text-align: right;">${synthese.recettes.taux}%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tableau des dépenses -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px; color: #e53e3e; font-size: 14px;">📉 DÉTAIL DES DÉPENSES</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #fef2f2;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #fca5a5;">Catégorie</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #fca5a5;">Prévu</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #fca5a5;">Caisse</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #fca5a5;">Banque</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #fca5a5;">Total</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #fca5a5;">Taux</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #fca5a5;">Écart</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #fca5a5;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${details.depenses.length > 0 ? details.depenses.map(d => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px;">${d.categorie}</td>
                <td style="padding: 8px; text-align: right;">${formatMontant(d.montant_prevu)}</td>
                <td style="padding: 8px; text-align: right; color: #6b7280;">${formatMontant(d.realise_caisse)}</td>
                <td style="padding: 8px; text-align: right; color: #6b7280;">${formatMontant(d.realise_banque)}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: #e53e3e;">${formatMontant(d.montant_realise)}</td>
                <td style="padding: 8px; text-align: right; font-weight: bold; color: ${d.taux > 100 ? '#e53e3e' : d.taux >= 80 ? '#d97706' : '#38a169'};">${d.taux}%</td>
                <td style="padding: 8px; text-align: right; color: ${d.ecart > 0 ? '#e53e3e' : '#38a169'};">${d.ecart > 0 ? '+' : ''}${formatMontant(d.ecart)}</td>
                <td style="padding: 8px; text-align: center;">
                  <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px;
                    background: ${d.statut === 'atteint' ? '#c6f6d5' : d.statut === 'depasse' ? '#fed7d7' : d.statut === 'en_cours' ? '#fef3c7' : '#e5e7eb'};
                    color: ${d.statut === 'atteint' ? '#22543d' : d.statut === 'depasse' ? '#991b1b' : d.statut === 'en_cours' ? '#92400e' : '#374151'};">
                    ${d.statut === 'atteint' ? '✓ Atteint' : d.statut === 'depasse' ? '⚠ Dépassé' : d.statut === 'en_cours' ? '⏳ En cours' : '✗ Non atteint'}
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="8" style="padding: 20px; text-align: center; color: #9ca3af;">Aucune prévision de dépense</td></tr>
            `}
            <tr style="background: #fef2f2; font-weight: bold;">
              <td style="padding: 10px;">TOTAL DÉPENSES</td>
              <td style="padding: 10px; text-align: right;">${formatMontant(synthese.depenses.prevu)}</td>
              <td style="padding: 10px; text-align: right;">${formatMontant(synthese.depenses.caisse)}</td>
              <td style="padding: 10px; text-align: right;">${formatMontant(synthese.depenses.banque)}</td>
              <td style="padding: 10px; text-align: right; color: #e53e3e;">${formatMontant(synthese.depenses.realise)}</td>
              <td style="padding: 10px; text-align: right;">${synthese.depenses.taux}%</td>
              <td style="padding: 10px; text-align: right; color: ${synthese.depenses.ecart > 0 ? '#e53e3e' : '#38a169'};">
                ${synthese.depenses.ecart > 0 ? '+' : ''}${formatMontant(synthese.depenses.ecart)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pied de page -->
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between;">
        <span>Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>Prévisions budgétaires - ${moisNom} ${periode.annee}</span>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const options = {
    margin: 10,
    filename: `Previsions_${moisNom}_${periode.annee}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  try {
    await html2pdf().set(options).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}
