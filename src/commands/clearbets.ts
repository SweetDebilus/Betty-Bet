import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, CommandInteraction, GuildMemberRoleManager, GuildMember } from 'discord.js';
import { savePoints, usersPoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';
import { currentBets, setCurrentBets, setBettingOpen } from './placeyourbets';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('clearbets') 
        .setDescription('Clear all bets in case of issues. (BetManager only)'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleClearBets(interaction);
        } else {
            await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
        }
    }
};

const handleClearBets = async (interaction: CommandInteraction) => {
    for (const [userId, bet] of Object.entries(currentBets)) {
        if (usersPoints[userId]) {
            usersPoints[userId].points += bet.amount;
        }
    }

    await savePoints();
    setCurrentBets({});
    setBettingOpen(false);

    await interaction.reply('All bets were void and Gearpoints were refunded.');
};