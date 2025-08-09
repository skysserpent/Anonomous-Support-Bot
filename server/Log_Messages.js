const { EmbedBuilder } = require('discord.js');

const logState = {
  user: new Set(),
  anon: new Set(),
  server: false
};

function toggle(message, type, state) {
  if (type === 'user') {
    state ? logState.user.add(message.author.id) : logState.user.delete(message.author.id);
  } else if (type === 'anon') {
    state ? logState.anon.add(message.author.id) : logState.anon.delete(message.author.id);
  } else if (type === 'server') {
    logState.server = state;
  }

  message.channel.send(`Logging ${state ? 'enabled' : 'disabled'} for ${type}`);
}

async function handleLogging(message) {
  if (
    message.author.bot ||
    message.channel.type !== 0 ||
    message.content.startsWith('!') // skip command invocations
  ) return;

  const userId = message.author.id;
  const isAnon = logState.anon.has(userId);
  const isUser = logState.user.has(userId);
  const isServer = logState.server;

  if (!isAnon && !isUser && !isServer) return;

  const embed = new EmbedBuilder()
    .setDescription(message.content || '[File]')
    .setTimestamp();

  if (message.attachments.size > 0) {
    const files = message.attachments.map(att => att.url).join('\n');
    embed.setDescription(`${message.content || ''}\n\n${files}`.trim());
  }

  if (!isAnon) {
    embed.setAuthor({
      name: `${message.author.username}#${message.author.discriminator}`,
      iconURL: message.author.displayAvatarURL()
    });
  }

  try {
    const webhooks = await message.channel.fetchWebhooks();
    let webhook = webhooks.find(wh => wh.owner?.id === message.client.user.id);

    if (!webhook) {
      webhook = await message.channel.createWebhook({ name: 'Logger Webhook' });
    }

    await webhook.send({ embeds: [embed] });
    await message.delete().catch(() => {});
  } catch (err) {
    console.error('Logging error:', err);
  }
}

module.exports = {
  toggle,
  handleLogging
};