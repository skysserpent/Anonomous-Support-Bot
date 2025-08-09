const fs = require('fs');
const path = './moderation/StaffModeration.json';

let data = {};
if (fs.existsSync(path)) data = JSON.parse(fs.readFileSync(path));

function save() {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function getUserIdFromMention(arg) {
  return arg?.replace(/[<@!>]/g, '');
}

module.exports = {
  addStaff: async (client, message, args) => {
    const userId = getUserIdFromMention(args[0]);
    const channelId = args[1] || message.channel.id;

    data.added ??= {};
    data.added[channelId] ??= [];
    if (!data.added[channelId].includes(userId)) {
      data.added[channelId].push(userId);
      save();
      await message.reply(`<@${userId}> has been granted access to this ticket.`);
    } else {
      await message.reply(`User already added to this ticket.`);
    }

    const channel = await client.channels.fetch(channelId);
    await channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true });
  },

  removeStaff: async (client, message, args) => {
    const userId = getUserIdFromMention(args[0]);
    const channelId = args[1] || message.channel.id;

    data.added ??= {};
    if (data.added[channelId]) {
      const i = data.added[channelId].indexOf(userId);
      if (i !== -1) {
        data.added[channelId].splice(i, 1);
        save();
        await message.reply(`<@${userId}> has been removed from this ticket.`);

        const channel = await client.channels.fetch(channelId);
        await channel.permissionOverwrites.edit(userId, { ViewChannel: false });
        return;
      }
    }

    await message.reply(`User not found in staff list for this ticket.`);
  },

  lockdownStaff: async (client, message, args) => {
    const channelId = args[0] || message.channel.id;
    data.lockedStaff ??= [];
    if (!data.lockedStaff.includes(channelId)) {
      data.lockedStaff.push(channelId);
      save();
      await message.reply(`Staff messages are now hidden from being relayed in this ticket.`);
    } else {
      await message.reply(`Staff lockdown already active.`);
    }
  },

  unlockStaff: async (client, message) => {
    const channelId = message.channel.id;
    data.lockedStaff ??= [];
    const i = data.lockedStaff.indexOf(channelId);
    if (i !== -1) {
      data.lockedStaff.splice(i, 1);
      save();
      await message.reply(`Staff lockdown lifted for this ticket.`);
    } else {
      await message.reply(`This ticket is not in staff lockdown.`);
    }
  },

  lockdownServer: async (client, message) => {
    data.serverLocked = true;
    save();
    await message.reply(`Server-wide ticket creation is now disabled.`);
  },

  unlockServer: async (client, message) => {
    data.serverLocked = false;
    save();
    await message.reply(`Server-wide ticket creation is now enabled.`);
  },

  isStaffLocked: (channelId) => {
    return data.lockedStaff?.includes(channelId);
  },

  isServerLocked: () => {
    return data.serverLocked === true;
  }
};