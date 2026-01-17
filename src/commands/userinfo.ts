import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('userinfo')
        .setDescription('Check information about a user'),

    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;
        const pointsEmoji = process.env.POINTS!;
        const debilus = process.env.DEBILUS!;
        if (!usersPoints[userId]) {
            await interaction.reply({content:'You are not registered yet. Use */register* to register.', flags: MessageFlags.Ephemeral});
            return;
        }
        const userInfo = usersPoints[userId];
        const status = userInfo.isDebilus ? `you are a **Debilus** ${debilus}` : 'bettor';
        const notificationsEnabled = userInfo.notificationsEnabled ? 'enabled' : 'disabled';
        const betHistory = userInfo.betHistory ? userInfo.betHistory.join(', ') : 'No bets placed yet.';
        await interaction.reply({ content: `**User Information for ${userInfo.name}**\n\n- **Points:** ${userInfo.points} ${pointsEmoji}\n- **Wins:** ${userInfo.wins}\n- **Losses:** ${userInfo.losses}\n- **Status:** ${status}\n - **Inventory:** ${userInfo.inventory}\n - Notifications: ${notificationsEnabled}\n - Bet History: ${betHistory}`, flags: MessageFlags.Ephemeral });
        log(`INFO: User ${userId} checked their user information.`);
    }
};