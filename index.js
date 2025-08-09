require('dotenv').config();
const fs = require('fs');
const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const auth                 = require('./backend/Authentication');
const commandsMenu         = require('./backend/commands');
const profile              = require('./backend/profile');
const serverInvite         = require('./backend/server'); 
const catTools             = require('./backend/create_move_category');
const staffExtra           = require('./messaging/StaffMessagingCommands');
const customerHandlers     = require('./messaging/customersend_edit');
const staffResponses       = require('./staffresponses');
const moderation           = require('./moderation/UserModeration');
const staffMod             = require('./moderation/StaffModeration');
const openClose            = require('./server/open_close');
const saveWebhooks         = require('./server/Save_Webhooks'); 
const logMsgs              = require('./server/Log_Messages');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});
const TICKETS_PATH = './server/tickets.json';
if (!fs.existsSync('./server')) fs.mkdirSync('./server', { recursive: true });
const tickets = fs.existsSync(TICKETS_PATH) ? JSON.parse(fs.readFileSync(TICKETS_PATH, 'utf8')) : {};
const staffMessagesState = {};

function saveTickets() {
  fs.writeFileSync(TICKETS_PATH, JSON.stringify(tickets, null, 2));
}
function parseCmd(content) {
  const parts = content.trim().split(/\s+/);
  const command = (parts.shift() || '').toLowerCase();
  return { command, args: parts };
}
function ensureTicketGuild() {
  const guildId = process.env.GUILD_ID;
  return client.guilds.cache.get(guildId) || client.guilds.cache.first();
}
function sendEmbed(message, title, lines) {
  const embed = new EmbedBuilder().setTitle(title).setDescription(lines.join('\n'));
  return message.reply({ embeds: [embed] });
}
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;

    await moderation.handleDelete(message).catch(() => {});


    try { if (message.guild && logMsgs?.handleLogging) logMsgs.handleLogging(message); } catch {}

    if (message.channel?.type === ChannelType.DM) {
        if (moderation.isBlacklisted(message.author.id)) return;

        if (!tickets[message.author.id]) {
            const guild = ensureTicketGuild();
            await openClose.open(client, message, tickets, guild);
            saveTickets();
        }

        if (moderation.isMuted(message.author.id)) return;
        await staffExtra.handleKeywordTrigger(message, tickets);
        await staffExtra.handleCustomerMessagePing(message, tickets);
        await customerHandlers.handleCustomerMessage(client, message, tickets);

        saveTickets();
        return;
    }
    if (!message.guild) return;
    if (!message.content.startsWith('!')) return;

    const { command, args } = parseCmd(message.content);

    if (command === '!help')               return commandsMenu.help(client, message);
    if (command === '!staff_commands')     return commandsMenu.staff(client, message);
    if (command === '!admin_commands')     return commandsMenu.admin(client, message);
    if (command === '!profile_commands')   return commandsMenu.profile(client, message);
    if (command === '!server_commands')    return commandsMenu.server(client, message);
    if (command === '!moderation_commands')return commandsMenu.moderation(client, message);

    const isStaff = auth.isStaff(message.author.id) || auth.isAdmin(message.author.id) || auth.isOwner(message.author.id);
    const isAdmin = auth.isAdmin(message.author.id) || auth.isOwner(message.author.id);

    /* ===== Staff: Ticket messaging & utilities ===== */
    // Core AR actions (staff + admins allowed via isStaff)
    // Core AR actions (both staff and admins allowed via isStaff)
    if (['!ar', '!edit', '!delete'].includes(command)) {
      if (!isStaff) return;
      await staffResponses.handleStaffCommand(client, message, tickets, staffMessagesState);
      saveTickets();
      return;
    }
    if (command === '!ar_later') {
      if (!isStaff) return;
      return staffExtra.arLater(client, message, args, tickets, staffMessagesState);
    }
    if (command === '!ping') {
      if (!isStaff) return;
      return staffExtra.pingSetup(client, message, tickets);
    }
    if (command === '!keyword_add') {
      if (!isStaff) return;
      return staffExtra.keywordAdd(client, message, args);
    }

    if (command === '!rename_ticket') {
      if (!isStaff) return;
      return staffExtra.renameTicket(client, message, args);
    }
    if (command === '!close') {
      if (!isStaff) return;
      await openClose.close(client, message, tickets);
      saveTickets();
      return;
    }
    if (command === '!open') {
      if (!isStaff) return;
      const target = message.mentions.users.first();
      if (!target) return message.reply('Mention a user to open a ticket for.');
      const guild = ensureTicketGuild();
      await openClose.open(client, { author: target }, tickets, guild);
      saveTickets();
      return;
    }

    /* ===== Admin Tools (category, webhook, staff mgmt, lockdowns, join) ===== */
    // Categories (backend/create_move_category.js)
    if (command === '!create_category')  { if (!isAdmin) return; return catTools.create(client, message, args); }
    if (command === '!move_category')    { if (!isAdmin) return; return catTools.move(client, message, args); }
    if (command === '!delete_category')  { if (!isAdmin) return; return catTools.delete(client, message, args); }

    // Saved webhooks (server/Save_Webhooks.js)
    if (command === '!save_webhook')     { if (!isAdmin) return; return saveWebhooks.save(client, message, args); }
    if (command === '!webhooks')         { if (!isAdmin) return; return saveWebhooks.list(client, message); }
    if (command === '!webhook')          { if (!isAdmin) return; return saveWebhooks.send(client, message, args); }

    // Staff management & lockdown (moderation/StaffModeration.js)
    if (command === '!add_staff')        { if (!isAdmin) return; return staffMod.addStaff(client, message, args); }
    if (command === '!remove_staff')     { if (!isAdmin) return; return staffMod.removeStaff(client, message, args); }

    if (command === '!lockdown_staff')   { if (!isAdmin) return; return staffMod.lockdownStaff(client, message, args); }
    if (command === '!unlock_staff')     { if (!isAdmin) return; return staffMod.unlockStaff(client, message, args); }
    if (command === '!lockdown_server')  { if (!isAdmin) return; return staffMod.lockdownServer(client, message, args); }
    if (command === '!unlock_server')    { if (!isAdmin) return; return staffMod.unlockServer(client, message, args); }
    if (command === '!join_server')      { return serverInvite.joinServer(client, message, args); }

    if (['!profile_username','!profile_picture','!profile_bio','!profile_pronouns','!profile_note'].includes(command)) {
      if (!isStaff) return;
      return profile.handle(client, message, command, args);
    }

    if (command === '!admin_profile_username') {
      if (!isAdmin) return;
      return profile.handle(client, message, command, args);
    }

    /* ===== Moderation ===== */
    if (command === '!blacklist')      { await moderation.blacklist(client, message, args, tickets); saveTickets(); return; }
    if (command === '!unblacklist')    { await moderation.unblacklist(client, message, args, tickets); saveTickets(); return; }
    if (command === '!mute_ticket')    { await moderation.mute(client, message, args, tickets); saveTickets(); return; }
    if (command === '!unmute_ticket')  { await moderation.unmute(client, message, args, tickets); saveTickets(); return; }
    if (command === '!log_messages')                 { if (!isAdmin) return; return logMsgs.toggle(message, 'user',   true); }
    if (command === '!stop_log_messages')            { if (!isAdmin) return; return logMsgs.toggle(message, 'user',   false); }
    if (command === '!log_messages_anonomously')      { if (!isAdmin) return; return logMsgs.toggle(message, 'anon',   true); }
    if (command === '!stop_log_messages_anonomously'){ if (!isAdmin) return; return logMsgs.toggle(message, 'anon',   false); }
    if (command === '!log_messages_server')          { if (!isAdmin) return; return logMsgs.toggle(message, 'server', true); }
    if (command === '!stop_log_messages_server')     { if (!isAdmin) return; return logMsgs.toggle(message, 'server', false); }

  } catch (err) {
    console.error('messageCreate error', err);
  }
});
client.on('messageUpdate', async (oldMsg, newMsg) => {
  try {
    if (newMsg.partial || oldMsg.partial || (newMsg.author && newMsg.author.bot)) return;
    if (newMsg.channel?.type !== ChannelType.DM) return;

    await customerHandlers.handleCustomerEdit(client, oldMsg, newMsg, tickets);
    saveTickets();
  } catch (err) {
    console.error('messageUpdate error', err);
  }
});

client.login(process.env.TOKEN);
