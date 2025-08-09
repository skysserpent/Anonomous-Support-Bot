module.exports = {
  joinServer: async (client, message, args) => {
    if (!args[0]) return;

    const inviteLink = args[0];

    const instructions = `
**How to Add the Bot to Your Server**
You provided: \`${inviteLink}\`

1. Click the link below to invite the bot:
   edit this here

2. Select your server (you must have the **Manage Server** permission).

3. Grant these permissions:
   - View Channels  
   - Send Messages  
   - Embed Links  
   - Read Message History  
   - Manage Webhooks

Need help? Dm me to Create a Support Ticket.
`;

    await message.channel.send(instructions);
  }
};
