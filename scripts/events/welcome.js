// scripts/events/welcome.js
module.exports = {
  name: 'welcome',
  handler: async ({ from, text }) => {
    return `👋 Hi there! Welcome to the bot. Type /help to see available commands.`;
  }
};
