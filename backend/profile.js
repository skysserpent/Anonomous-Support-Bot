const fs = require('fs');
const path = './backend/profile.json';

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, '{}');
}
let profileData = JSON.parse(fs.readFileSync(path));

module.exports = {
  handle: async (client, message, command, args) => {
    const content = args.join(' ');
    const botUser = client.user;

    switch (command) {
      case '!profile_username':
        if (!content) return message.channel.send('Usage: !profile_username <name>');
        const member = message.guild?.members?.me;
        if (member) {
          await member.setNickname(content);
          profileData.username = content;
          message.channel.send(`Username changed to: ${content}`);
        }
        break;

      case '!admin_profile_username':
        if (!content) return message.channel.send('Usage: !admin_profile_username <name>');
        await botUser.setUsername(content);
        profileData.global_username = content;
        message.channel.send(`Global username changed to: ${content}`);
        break;

      case '!profile_picture':
        if (!content) return message.channel.send('Usage: !profile_picture <image_url>');
        await botUser.setAvatar(content).catch(() => message.channel.send('Failed to update avatar.'));
        profileData.avatar = content;
        message.channel.send('Profile picture updated.');
        break;

      case '!profile_bio':
        if (!content) return message.channel.send('Usage: !profile_bio <bio>');
        await botUser.setPresence({ activities: [{ name: content }], status: 'online' });
        profileData.bio = content;
        message.channel.send('Bio updated (via presence).');
        break;
    }

    fs.writeFileSync(path, JSON.stringify(profileData, null, 2));
  }
};