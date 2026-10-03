
- ChatGPT integration lives under `/api/gpt/*` (token in server `.env` `CHATGPT_API_TOKENS`, read-only, whitelist in `ResourceRegistry`) — kept separate from `/api/ai` which is the session-based internal assistant.
- The MCP server is a separate Node service in `mcp-logistiga/` that only calls Laravel `/api/gpt/*` through one whitelisted client — keeps MySQL and the Laravel token off the MCP surface; deployed on the prod host via cloudlinux-selector/Passenger.
