module.exports = {
  handleStaffCommand: async (client, message, tickets, staffMessages) => {
    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();
    const channel = message.channel;
    const ticketEntry = Object.entries(tickets).find(([_, data]) => data.channelId === channel.id);
    if (!ticketEntry) return;

    const [userId] = ticketEntry;
    const user = await client.users.fetch(userId);
    if (!user) return;

    if (command === '!ar') {
      const content = args.join(' ');
      const userMsg = await user.send({ embeds: [{ description: content }] });
      const ticketMsg = await channel.send({ embeds: [{ description: content }] });
      staffMessages[userId] = { ticketId: ticketMsg.id, dmId: userMsg.id };
    }

    if (command === '!edit') {
      const newContent = args.join(' ');
      const msgIds = staffMessages[userId];
      if (!msgIds) return;

      const ticketMsg = await channel.messages.fetch(msgIds.ticketId).catch(() => null);
      if (ticketMsg) ticketMsg.edit({ embeds: [{ description: newContent }] });

      const dmChannel = await user.createDM();
      const dmMsg = await dmChannel.messages.fetch(msgIds.dmId).catch(() => null);
      if (dmMsg) dmMsg.edit({ embeds: [{ description: newContent }] });
    }

    if (command === '!delete') {
      const msgIds = staffMessages[userId];
      if (!msgIds) return;

      const ticketMsg = await channel.messages.fetch(msgIds.ticketId).catch(() => null);
      if (ticketMsg) await ticketMsg.delete();

      const dmChannel = await user.createDM();
      const dmMsg = await dmChannel.messages.fetch(msgIds.dmId).catch(() => null);
      if (dmMsg) await dmMsg.delete();

      delete staffMessages[userId];
    }
  }
};