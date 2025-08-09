const fs = require('fs');
const path = require('path');
const { PermissionFlagsBits } = require('discord.js');

const LOG_DIR = 'C:/Users/domin/Desktop/Saved_Tickets';
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// Log env values when file loads
console.log("[DEBUG] Loaded from .env:");
console.log("  GUILD_ID:", process.env.GUILD_ID);
console.log("  CATEGORY_ID:", process.env.CATEGORY_ID);

async function getOrCreateCategory(guild) {
    console.log(`[DEBUG] getOrCreateCategory() in guild: ${guild.name} (${guild.id})`);

    const desiredId = process.env.CATEGORY_ID;
    console.log(`[DEBUG] Looking for CATEGORY_ID: ${desiredId}`);

    const categories = guild.channels.cache.filter(c => c.type === 4);
    console.log("[DEBUG] Categories in this guild:");
    categories.forEach(cat => console.log(` - ${cat.name} (${cat.id})`));

    if (desiredId) {
        const cat = categories.get(desiredId);
        console.log(`[DEBUG] Found matching category? ${!!cat}`);
        if (cat) return cat;
    }

    console.log(`[DEBUG] Category not found, creating a new one named 'tickets'...`);
    const cat = await guild.channels.create({
        name: 'tickets',
        type: 4
    });
    console.log(`[DEBUG] Created category: ${cat.name} (${cat.id})`);
    return cat;
}

function ensureTicket(tickets, userId) {
    if (!tickets[userId]) tickets[userId] = { channelId: null, messages: {}, log: [] };
}

async function open(client, dmMessageLike, tickets, guild) {
    const user = dmMessageLike.author;
    ensureTicket(tickets, user.id);
    const existing = tickets[user.id]?.channelId;
    if (existing) return;

    const theGuild = guild || client.guilds.cache.get(process.env.GUILD_ID) || client.guilds.cache.first();
    if (!theGuild) throw new Error(`Guild not found. Make sure bot is in the server with ID ${process.env.GUILD_ID}`);

    const category = await getOrCreateCategory(theGuild);
    if (!category) throw new Error(`Could not find or create ticket category in guild ${theGuild.id}`);

    const staffRole = theGuild.roles.cache.find(r => /staff/i.test(r.name));

    const channel = await theGuild.channels.create({
        name: `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, ''),
        type: 0,
        parent: category.id,
        permissionOverwrites: [
            { id: theGuild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            ...(staffRole ? [{ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : []),
            { id: theGuild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages] }
        ]
    });

    tickets[user.id] = { channelId: channel.id, messages: {}, log: [] };

    await channel.send({ content: `New ticket opened for <@${user.id}>` });
}

async function close(client, message, tickets) {
    const entry = Object.entries(tickets).find(([, v]) => v.channelId === message.channel.id);
    if (!entry) return message.reply('This is not a ticket channel.');
    const [userId, data] = entry;

    const safeName = message.channel.name.replace(/[^a-z0-9\-]/gi, '_');
    const logPath = path.join(LOG_DIR, `${safeName}.txt`);
    try {
        const content = (data.log || []).join('\n');
        fs.writeFileSync(logPath, content || 'No messages recorded.');
    } catch {}

    delete tickets[userId];
    await message.reply('Ticket closed.');
    setTimeout(() => message.channel.delete().catch(() => {}), 2000);
}

module.exports = { open, close };
