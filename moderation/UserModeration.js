const fs = require('fs');
const PATH = './moderation/UserModeration.json';

let data = fs.existsSync(PATH) ? JSON.parse(fs.readFileSync(PATH)) : {
  blacklistedUsers: [],
  mutedUsers: [],
  trollBlacklist: {} // userId -> [channelIds]
};

function save() { fs.writeFileSync(PATH, JSON.stringify(data, null, 2)); }

function idFrom(arg) { return arg?.replace(/[<@!>]/g, ''); }

module.exports = {
  // Self or targeted blacklist
  async blacklist(client, message, args, tickets) {
    const targetId = idFrom(args[0]) || message.author.id;
    if (!data.blacklistedUsers.includes(targetId)) data.blacklistedUsers.push(targetId);
    save();
    await message.reply(`<@${targetId}> has been blacklisted from creating tickets.`);
  },
  
  async unblacklist(client, message, args, tickets) {
    const targetId = idFrom(args[0]) || message.author.id;
    data.blacklistedUsers = data.blacklistedUsers.filter(id => id !== targetId);
    save();
    await message.reply(`<@${targetId}> removed from blacklist.`);
  },
  
  async mute(client, message, args, tickets) {
    const entry = Object.entries(tickets).find(([, v]) => v.channelId === message.channel.id);
    if (!entry) return message.reply('Not a ticket channel.');
    const [userId] = entry;
    if (!data.mutedUsers.includes(userId)) data.mutedUsers.push(userId);
    save();
    await message.reply(`Muted <@${userId}> for this ticket.`);
  },
  
  async unmute(client, message, args, tickets) {
    const entry = Object.entries(tickets).find(([, v]) => v.channelId === message.channel.id);
    if (!entry) return message.reply('Not a ticket channel.');
    const [userId] = entry;
    data.mutedUsers = data.mutedUsers.filter(id => id !== userId);
    save();
    await message.reply(`Unmuted <@${userId}> for this ticket.`);
  },
  
  isMuted(userId) { return data.mutedUsers.includes(userId); },
  isBlacklisted(userId) { return data.blacklistedUsers.includes(userId); },
  async handleDelete(message) {
    try {
      const channelId = message.channel?.id;
      if (!channelId) return;
      const userId = message.author?.id;
      if (!userId) return;
      const channels = data.trollBlacklist[userId] || [];
      if (channels.includes(channelId)) await message.delete().catch(() => {});
    } catch {}
  }
};
