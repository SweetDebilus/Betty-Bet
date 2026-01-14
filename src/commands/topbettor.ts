import { GuildMember, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMemberRoleManager, CommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';

const pointsEmoji = process.env.POINTS!;

export const command = {
    data: new SlashCommandBuilder() 
        .setName('topbettor')
        .setDescription('Show the top bettors (BetManager only)'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleTopBettor(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};

const handleTopBettor = async (interaction: ChatInputCommandInteraction) => {
    const rankBettor: { [userId: string]: number } = {}; // reset à chaque appel

    for (const userId in usersPoints) {
        for (const bet of usersPoints[userId].betHistory) {
            if (bet.result === 'win') {
                rankBettor[userId] = (rankBettor[userId] || 0) + bet.amount;
            }
            else {
                rankBettor[userId] = (rankBettor[userId] || 0) - bet.amount;
            }
        }
    }

    const sortedBettors = Object.entries(rankBettor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (sortedBettors.length === 0) {
        return interaction.reply({
            content: "Nobody has won any bets yet.",
            flags: MessageFlags.Ephemeral
        });
    }

    let replyMessage = '🏆 **Top Bettors:**\n\n';
    sortedBettors.forEach(([userId, totalBet], index) => {
        const userName = usersPoints[userId]?.name || 'Unknown User';
        replyMessage += `**${index + 1}. ${userName}** – Net Profit: ${totalBet} ${pointsEmoji} \n`;
    });

    await interaction.reply({
        content: replyMessage,
        flags: MessageFlags.Ephemeral
    });
};