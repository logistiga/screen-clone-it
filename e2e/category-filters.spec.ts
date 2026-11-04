import { test, expect } from '@playwright/test';

const categories = [
  { value: 'conteneurs', label: 'Conteneurs' },
  { value: 'conventionnel', label: 'Conventionnel' },
  { value: 'operations_independantes', label: 'Indépendant' },
];

for (const document of ['ordres', 'factures']) {
  for (const category of categories) {
    test(`${document}: ${category.value} resets to page 1 and filters the request`, async ({ page }) => {
      const requests: URL[] = [];
      await page.route('**/api/**', async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith('/src/') || url.pathname.startsWith('/node_modules/')) {
          await route.continue();
          return;
        }
        if (url.pathname.endsWith('/auth/user')) {
          await route.fulfill({ json: { id: 1, nom: 'Test', role: 'administrateur', actif: true, permissions: [] } });
          return;
        }
        const endpoint = document === 'ordres' ? '/ordres-travail' : '/factures';
        if (url.pathname.endsWith(endpoint)) {
          requests.push(url);
          const selected = url.searchParams.get('categorie');
          const currentPage = Number(url.searchParams.get('page') || 1);
          const rows = selected ? [selected] : categories.map((item) => item.value);
          await route.fulfill({ json: {
            data: rows.map((value, index) => ({
              id: index + 1, numero: `TEST-${value}-${currentPage}`, categorie: value,
              client: { id: 1, nom: 'Client test' }, date_creation: '2026-11-04',
              statut: 'brouillon', montant_ttc: 100, montant_ht: 100, montant_paye: 0,
            })),
            meta: { current_page: currentPage, last_page: selected ? 1 : 3, total: selected ? 1 : 30, per_page: 10 },
          } });
          return;
        }
        await route.fulfill({ json: { data: [], meta: { total: 0 } } });
      });
      await page.goto(`http://localhost:8080/${document}`);
      await expect(page.getByRole('table')).toBeVisible();
      await page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).click();
      await expect(page.getByRole('table')).toContainText('TEST-conteneurs-2');
      await page.getByRole('combobox').filter({ hasText: 'Toutes catégories' }).click();
      await page.getByRole('option', { name: category.label, exact: true }).click();
      await expect(page.getByRole('table')).toContainText(`TEST-${category.value}-1`);
      const filtered = requests.filter((url) => url.searchParams.get('categorie') === category.value);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered[0].searchParams.get('page')).toBe('1');
      for (const other of categories.filter((item) => item.value !== category.value)) {
        await expect(page.getByRole('table')).not.toContainText(`TEST-${other.value}`);
      }
      await page.screenshot({ path: `/tmp/browser/category-filters/${document}-${category.value}.png` });
      await page.getByRole('combobox').filter({ hasText: category.label }).click();
      await page.getByRole('option', { name: 'Toutes catégories', exact: true }).click();
      await expect(page.getByRole('table')).toContainText('TEST-conteneurs-1');
      await expect(page.getByRole('table')).toContainText('TEST-conventionnel-1');
      await expect(page.getByRole('table')).toContainText('TEST-operations_independantes-1');
    });
  }
}