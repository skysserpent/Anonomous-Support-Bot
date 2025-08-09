const { EmbedBuilder, ChannelType } = require('discord.js');

function nowStamp() {
  const now = new Date();
  return `${now.toLocaleDateString()} • ${now.toLocaleTimeString()}`;
}

function buildEmbedFromDM(message) {
  return new EmbedBuilder()
    .setColor('DarkPurple')
    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL() })
    .setDescription(message.content || '*No content*')
    .setFooter({ text: `UserID: ${message.author.id} • ${nowStamp()}` });
}

module.exports = {
  async handleCustomerMessage(client, message, tickets) {
    const uid = message.author.id;
    const ticket = tickets[uid];
    if (!ticket || !ticket.channelId) return;
    const channel = await client.channels.fetch(ticket.channelId);
    
    const embed = buildEmbedFromDM(message);
    const sent = await channel.send({ embeds: [embed] });
    
    if (!ticket.messages) ticket.messages = {};
    ticket.messages[message.id] = sent.id;
    
    if (!ticket.log) ticket.log = [];
    ticket.log.push(`[DM -> Ticket] ${message.author.tag}: ${message.content}`);
  },
  
  async handleCustomerEdit(client, oldMsg, newMsg, tickets) {
    if (newMsg.channel?.type !== ChannelType.DM) return;
    const uid = newMsg.author.id;
    const ticket = tickets[uid];
    if (!ticket || !ticket.channelId) return;
    
    const channel = await client.channels.fetch(ticket.channelId);
    const mirrorId = ticket.messages?.[newMsg.id];
    if (!mirrorId) return;
    
    const original = await channel.messages.fetch(mirrorId).catch(() => null);
    if (!original) return;
    
    const embed = buildEmbedFromDM(newMsg);
    await original.edit({ embeds: [embed] });
    
    if (!ticket.log) ticket.log = [];
    ticket.log.push(`[EDIT] ${newMsg.author.tag}: ${newMsg.content}`);
  }
};
