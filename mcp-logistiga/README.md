# mcp-logistiga

Serveur MCP distant (Streamable HTTP, SDK officiel) qui expose à ChatGPT 7 outils **en lecture seule** sur les données LOGISTIGA, en appelant uniquement l'API Laravel `/api/gpt/*`.

```bash
npm install
cp .env.example .env   # remplir LOGISTIGA_API_TOKEN et MCP_ACCESS_TOKENS (jamais dans Git)
npm run build
npm test               # 26 tests sur un faux Laravel
npm start              # http://localhost:3333/mcp-logistiga/health
```

- Production : `https://facturation.logistiga.pro/mcp-logistiga` (Passenger, Node 22).
- Outils : `logistiga_get_schema`, `logistiga_search`, `logistiga_query`, `logistiga_list_resource`, `logistiga_client_summary`, `logistiga_unpaid_invoices`, `logistiga_revenue`.
- Guide complet (déploiement, sécurité, rotation, connexion ChatGPT) : [docs/CHATGPT_MCP_SETUP.md](docs/CHATGPT_MCP_SETUP.md).
