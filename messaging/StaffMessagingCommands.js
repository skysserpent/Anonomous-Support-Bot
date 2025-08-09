const fs = require('fs');
const path = './messaging/StaffMessagingCommands.json';
let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};

function save() {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

module.exports = {
  arLater: async (client, message, args, tickets, staffMessagesState) => {
    const delay = parseInt(args[0]) * 1000;
    const content = args.slice(1).join(' ');
    if (isNaN(delay) || !content)
      return message.reply('Invalid syntax. Use `!ar_later <seconds> <message>`');

    await message.reply(`Your delayed anonymous reply has been scheduled in ${args[0]}s.`);

    setTimeout(async () => {
      try {
        // Simulate the !ar command by passing a fake message with the delayed content
        const fakeMessage = Object.assign(Object.create(message), {
          content: `!ar ${content}`,
          author: message.author
        });

        await require('./StaffResponses')
          .handleStaffCommand(client, fakeMessage, tickets, staffMessagesState);

      } catch (err) {
        console.error('Failed to send delayed AR:', err);
      }
    }, delay);
  },


  // Mark this staff member to be pinged on next user reply
  pingSetup: async (client, message, tickets) => {
    const channelId = message.channel.id;
    const ticket = Object.entries(tickets).find(([, v]) => v.channelId === channelId);
    if (!ticket) return message.reply('Ticket not found.');

    const userId = ticket[0];
    data.pingQueue ??= {};
    data.pingQueue[userId] = message.author.id;
    save();
    await message.reply('You will be pinged the next time the user responds.');
  },

  // Called from messageCreate when a customer sends a message
  handleCustomerMessagePing: async (message, tickets) => {
    const userId = message.author.id;
    if (data.pingQueue?.[userId]) {
      const staffId = data.pingQueue[userId];
      const ticket = tickets[userId];
      if (!ticket) return;

      const channel = await message.client.channels.fetch(ticket.channelId).catch(() => null);
      if (!channel) return;

      await channel.send(`<@${staffId}>, customer has replied.`);
      delete data.pingQueue[userId];
      save();
    }
  },

  // Add a keyword for auto-ping
  keywordAdd: async (client, message, args) => {
    const word = args.join(' ').toLowerCase();
    if (!word) return message.reply('Provide a keyword to add.');

    data.keywords ??= [];

    // Store as { word: 'refund', addedBy: '1234567890' }
    if (data.keywords.some(k => k.word === word)) return message.reply('Keyword already added.');

    data.keywords.push({ word, addedBy: message.author.id });
    save();
    await message.reply(`Keyword "${word}" added and will now trigger a ping for you.`);
  },
  handleKeywordTrigger: async (message, tickets) => {
      const content = message.content.toLowerCase();
      if (!data.keywords?.length) return;

      const matched = data.keywords.filter(word => content.includes(word));
      if (!matched.length) return;

      const userId = message.author.id;
      const ticket = tickets[userId];
      if (!ticket) return;

      const channel = await message.client.channels.fetch(ticket.channelId).catch(() => null);
      if (!channel) return;

      await channel.send({
          content: `@everyone Keyword(s) triggered: ${matched.join(', ')}`,
          allowedMentions: { parse: ['everyone'] }
      });
  },
  renameTicket: async (client, message, args) => {
    const newName = args.join('-').toLowerCase();
    if (!newName) return message.reply('Provide a new name.');

    try {
      await message.channel.setName(newName);
      await message.reply(`Ticket renamed to ${newName}`);
    } catch {
      await message.reply('Failed to rename the channel.');
    }
  }
};
