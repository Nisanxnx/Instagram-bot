# Instagram Reply Bot (Command-based)

This package is a simple Node.js/Express webhook receiver that parses inbound Instagram messages
(via the Messenger API for Instagram / Meta Webhooks) and routes them to command handlers.

⚠️ IMPORTANT: This is provided for educational and legitimate automation use only.
Do NOT use it to send unsolicited mass messages or harass people. Respect Instagram/Meta policies.

## Setup
1. Create a Meta Developer App and configure Instagram Messaging + Webhooks.
2. Link an Instagram Professional account to a Facebook Page.
3. Get the required tokens and set environment variables (see .env.example).
4. Install dependencies:
   ```bash
   npm install
