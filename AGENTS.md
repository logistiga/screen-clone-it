
- ChatGPT integration lives under `/api/gpt/*` (token in server `.env` `CHATGPT_API_TOKENS`, read-only, whitelist in `ResourceRegistry`) — kept separate from `/api/ai` which is the session-based internal assistant.
