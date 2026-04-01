import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Check information about a user'),

    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;

        const pointsEmoji = process.env.POINTS ?? '';
        const debilus = process.env.DEBILUS ?? '';

        const userInfo = usersPoints[userId];
        if (!userInfo) {
            await interaction.reply({
                content: 'You are not registered yet. Use */register* to register.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const status = userInfo.isDebilus
            ? `you are a **Debilus** ${debilus}`
            : 'bettor';

        const notificationsEnabled = userInfo.notificationsEnabled ? 'enabled' : 'disabled';

        const betHistory = userInfo.betHistory?.length
            ? userInfo.betHistory.join(', ')
            : 'No bets placed yet.';

        await interaction.reply({
            content:
`**User Information for ${userInfo.name}**

- **Points:** ${userInfo.points} ${pointsEmoji}
- **Wins:** ${userInfo.wins}
- **Losses:** ${userInfo.losses}
- **Status:** ${status}
- **Inventory:** ${userInfo.inventory}
- **Notifications:** ${notificationsEnabled}
- **Bet History:** ${betHistory}`,
            flags: MessageFlags.Ephemeral
        });

        log(`INFO: User ${userId} checked their user information.`);
    }
};
