import { GuildMember, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMemberRoleManager, CommandInteraction } from 'discord.js';
import { savePoints, usersPoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('clearbethistory')
        .setDescription('Clear the betting history of all users. (BetManager only)'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleClearBetHistory(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};

const handleClearBetHistory = async (interaction: CommandInteraction) => {
    for (const userId in usersPoints) {
        usersPoints[userId].betHistory = [];
    }
    savePoints();
    await interaction.reply({ 
        content: '✅ All user\'s betting history has been cleared.', 
        flags: MessageFlags.Ephemeral 
    });
};