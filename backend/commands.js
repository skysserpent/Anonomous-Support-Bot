// backend/commands.js
const { EmbedBuilder } = require('discord.js');

function replyEmbed(message, title, lines) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(lines.join('\n'));
  return message.reply({ embeds: [embed] });
}

module.exports = {
  help: (_client, message) => {
    return replyEmbed(message, 'Help', [
      '!help',
      '!staff_commands – Staff functions',
      '!admin_commands – Admin-only actions',
      '!profile_commands – Bot profile editing',
      '!server_commands – Server tools',
      '!moderation_commands – User moderation'
    ]);
  },

  staff: (_client, message) => {
    return replyEmbed(message, 'Staff Commands', [
      '!ar <message> – Anonymous reply',
      '!edit <new message> – Edit last anonymous reply',
      '!delete – Delete last anonymous reply',
      '!close – Close the ticket and log it',
      '!ar_later <time> <message> – Send delayed message',
      '!ping – Ping staff next customer reply',
      '!keyword_add <word> – Add keyword to ping staff',
      '!rename_ticket <new_name> – Rename current ticket'
    ]);
  },

  admin: (_client, message) => {
    return replyEmbed(message, 'Admin Commands', [
      '!create_category <name>',
      '!move_category <name>',
      '!delete_category <name>',
      '!save_webhook <name> <content>',
      '!webhooks',
      '!webhook <name>',
      '!webhook <name> <channelId>',
      '!add_staff <user> [channelId]',
      '!remove_staff <user> [channelId]',
      '!lockdown_staff [channelId]',
      '!unlock_staff',
      '!lockdown_server',
      '!unlock_server'
    ]);
  },

  profile: (_client, message) => {
    return replyEmbed(message, 'Profile Commands', [
      '!profile_username <name>',
      '!admin_profile_username <name>',
      '!profile_picture <url>',
      '!profile_bio <text>',
      '!profile_pronouns <text>',
      '!profile_note <text>'
    ]);
  },

  server: (_client, message) => {
    return replyEmbed(message, 'Server Commands', [
      '!create_category <name>',
      '!move_category <name>',
      '!delete_category <name>',
      '!close',
      '!save_webhook <name> <content>',
      '!webhook <name> [channelid]',
      '!webhooks',
      '!log_messages',
      '!stop_log_messages',
      '!log_messages_anonomously',
      '!stop_log_messages_anonomously',
      '!log_messages_server',
      '!stop_log_messages_server',
      '!join_server <invite>'
    ]);
  },

  moderation: (_client, message) => {
    return replyEmbed(message, 'Moderation Commands', [
      '!blacklist – Blacklist yourself from creating tickets',
      '!blacklist <user> <channel> – Blacklist user in a specific channel (auto-delete)',
      '!unblacklist – Remove yourself from blacklist',
      '!unblacklist <user> <channel> – Unblacklist user from a specific channel',
      '!unblacklist <user> all – Remove user from all blacklist channels and tickets',
      '!mute_ticket – Mute the user from sending DM messages to ticket',
      '!unmute_ticket – Unblock user DM relay in current ticket'
    ]);
  }
};
