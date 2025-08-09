module.exports = {
  handleStaffCommand: async (client, message, tickets, staffMessages) => {
    const parts = message.content.split(' ');
    const command = parts.shift().toLowerCase();
    
    // Find ticket by current channel
    const entry = Object.entries(tickets).find(([, v]) => v.channelId === message.channel.id);
    if (!entry) return;
    const [userId] = entry;
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) return;
    
    if (command === '!ar') {
      const content = parts.join(' ').trim();
      if (!content) return;
      const dm = await user.send({ embeds: [{ description: content }] });
      const ch = await message.channel.send({ embeds: [{ description: content }] });
      staffMessages[userId] = { dmId: dm.id, ticketId: ch.id };
    }
    
    if (command === '!edit') {
      const content = parts.join(' ').trim();
      const ids = staffMessages[userId];
      if (!ids) return;
      const ticketMsg = await message.channel.messages.fetch(ids.ticketId).catch(() => null);
      if (ticketMsg) await ticketMsg.edit({ embeds: [{ description: content }] });
      const dmChannel = await user.createDM();
      const dmMsg = await dmChannel.messages.fetch(ids.dmId).catch(() => null);
      if (dmMsg) await dmMsg.edit({ embeds: [{ description: content }] });
    }
    
    if (command === '!delete') {
      const ids = staffMessages[userId];
      if (!ids) return;
      const ticketMsg = await message.channel.messages.fetch(ids.ticketId).catch(() => null);
      if (ticketMsg) await ticketMsg.delete().catch(() => {});
      const dmChannel = await user.createDM();
      const dmMsg = await dmChannel.messages.fetch(ids.dmId).catch(() => null);
      if (dmMsg) await dmMsg.delete().catch(() => {});
      delete staffMessages[userId];
    }
  }
};
