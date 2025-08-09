module.exports = {
  create: async (client, message, args) => {
    const name = args.join(' ');
    if (!name) return;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    await guild.channels.create({
      name: name,
      type: 4
    });
  },

  move: async (client, message, args) => {
    const name = args.join(' ');
    if (!name) return;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const category = guild.channels.cache.find(
      c => c.type === 4 && c.name.toLowerCase() === name.toLowerCase()
    );
    if (!category) return;

    await message.channel.setParent(category.id);
  },

  delete: async (client, message, args) => {
    const name = args.join(' ');
    if (!name) return;

    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const category = guild.channels.cache.find(
      c => c.type === 4 && c.name.toLowerCase() === name.toLowerCase()
    );
    if (!category) return;

    await category.delete();
  }
};