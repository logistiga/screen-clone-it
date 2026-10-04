
- ChatGPT integration lives under `/api/gpt/*` (token in server `.env` `CHATGPT_API_TOKENS`, read-only, whitelist in `ResourceRegistry`) — kept separate from `/api/ai` which is the session-based internal assistant.
- The MCP server is a separate Node service in `mcp-logistiga/` that only calls Laravel `/api/gpt/*` through one whitelisted client — keeps MySQL and the Laravel token off the MCP surface; deployed on the prod host via cloudlinux-selector/Passenger.
- Invoice statuses and paid/locked rules go through `App\Support\FactureStatut` — avoids string variants like 'Annulée' vs 'annulee'.
- GET/consultation endpoints never write (no recalculation, sync or repair on read) — historical documents must not change silently.
- Money operations (payments, credit notes, cancellations, invoicing an OT) lock rows with `lockForUpdate` inside `DB::transaction` and re-check balances under lock — prevents concurrent duplicates and overpayment.
- `PreventDuplicateSubmission` middleware rejects identical write requests within a few seconds server-side — complements the frontend dedupe.
- DB-touching tests run only on a dedicated test database (`TestCase::exigerBaseDeTest`) — never against production.
