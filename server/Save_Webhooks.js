const fs = require('fs');
const path = './server/Webhooks.json';

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, '{}');
}
let data = JSON.parse(fs.readFileSync(path));

module.exports = {
  save: async (client, message, args) => {
    const [name, ...contentParts] = args;
    const content = contentParts.join(' ');
    if (!name || !content) return message.channel.send('Usage: !save_webhook <name> <content>');

    data[name] = content;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    message.channel.send(`Saved webhook "${name}".`);
  },

  list: async (client, message) => {
    const names = Object.keys(data);
    if (names.length === 0) return message.channel.send('No saved webhooks.');
    message.channel.send(`Saved webhooks:\n- ${names.join('\n- ')}`);
  },

  send: async (client, message, args) => {
    const [name, channelId] = args;
    if (!name) return message.channel.send('Usage: !webhook <name> [channelId]');
    const content = data[name];
    if (!content) return message.channel.send(`Webhook "${name}" not found.`);

    const channel = channelId
      ? await client.channels.fetch(channelId).catch(() => null)
      : message.channel;
    if (!channel || !channel.isTextBased()) return message.channel.send('Invalid channel.');

    channel.send(content);
  }
};