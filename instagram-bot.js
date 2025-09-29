// instagram-bot.js
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || 'your_page_or_ig_access_token';
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v17.0';
const IG_USER_ID = process.env.IG_USER_ID || '<INSTAGRAM_USER_ID>';
const PORT = process.env.PORT || 3000;

// ---- Load command modules from scripts/cmds ----
const commands = {};
const cmdsDir = path.join(__dirname, 'scripts', 'cmds');
fs.readdirSync(cmdsDir).forEach(file => {
  if (file.endsWith('.js')) {
    const mod = require(path.join(cmdsDir, file));
    if (mod && mod.name && typeof mod.handler === 'function') {
      commands[mod.name] = mod.handler;
      console.log('Loaded command:', mod.name);
    }
  }
});

// ---- Load events (optional) ----
const events = {};
const eventsDir = path.join(__dirname, 'scripts', 'events');
if (fs.existsSync(eventsDir)) {
  fs.readdirSync(eventsDir).forEach(file => {
    if (file.endsWith('.js')) {
      const mod = require(path.join(eventsDir, file));
      if (mod && mod.name && typeof mod.handler === 'function') {
        events[mod.name] = mod.handler;
        console.log('Loaded event:', mod.name);
      }
    }
  });
}

// Parse command
function parseCommand(text) {
  if (!text) return null;
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  return { cmd, args };
}

// ---- Webhook verification ----
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

// ---- Webhook receiver ----
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    if (body.object === 'instagram' || (body.entry && body.entry.length)) {
      for (const entry of body.entry) {
        const changes = entry.changes || [];
        for (const ch of changes) {
          const value = ch.value || {};
          const messages = value.messages || (value.message ? [value.message] : []);
          for (const m of messages) {
            const from = m.from || value.sender_id || (m.sender && m.sender.id);
            const text = m.text || (m.message && m.message.text) || null;
            if (!from || !text) continue;

            // event handler example (welcome message if user sends "hi")
            if (text.toLowerCase() === 'hi' && events['welcome']) {
              const welcomeMsg = await events['welcome']({ from, text });
              if (welcomeMsg) await sendInstagramReply(from, welcomeMsg);
              continue;
            }

            // command handler
            const parsed = parseCommand(text);
            if (parsed && commands[parsed.cmd]) {
              const responseText = await commands[parsed.cmd]({ from, args: parsed.args, originalText: text });
              if (responseText) await sendInstagramReply(from, responseText);
            } else {
              console.log('No command matched for:', text);
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    } else {
      return res.sendStatus(404);
    }
  } catch (err) {
    console.error('Webhook handling error:', err);
    res.sendStatus(500);
  }
});

// ---- Send reply ----
async function sendInstagramReply(recipientId, messageText) {
  if (!messageText) return;
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${IG_USER_ID}/messages?access_token=${PAGE_ACCESS_TOKEN}`;
  const body = {
    recipient: { id: recipientId },
    message: { text: messageText }
  };

  const resp = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await resp.json().catch(()=>({}));
  if (!resp.ok) {
    console.error('Failed to send message:', data);
  } else {
    console.log('Sent reply:', data);
  }
}

app.listen(PORT, () => console.log(`Bot listening on port ${PORT}`));
