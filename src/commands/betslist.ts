import { GuildMember, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMemberRoleManager, CommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';
import { currentBets, player1Name, player2Name } from './placeyourbets';

const pointsEmoji = process.env.POINTS!;
const debilus = process.env.DEBILUS!;

export const command = {
    data: new SlashCommandBuilder() 
        .setName('betslist') 
        .setDescription('View the list of players who bet on player 1 and player 2. (BetManager only)'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleBetsList(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};

const handleBetsList = async (interaction: CommandInteraction) => {
    let totalPlayer1Bets = 0;
    let totalPlayer2Bets = 0;

    if (player1Name === undefined && player2Name === undefined) {
        await interaction.reply({ 
            content: `no bets, no game ${debilus}`, 
            flags: MessageFlags.Ephemeral 
        });
        return;
    }

    const player1Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'bet_player1')
        .map(([userId, bet]) => {
            totalPlayer1Bets += bet.amount;
            return `${usersPoints[userId].name.padEnd(32)}\t${bet.amount}`;
        });

    const player2Bets = Object.entries(currentBets)
        .filter(([, bet]) => bet.betOn === 'bet_player2')
        .map(([userId, bet]) => {
            totalPlayer2Bets += bet.amount;
            return `${usersPoints[userId].name.padEnd(32)}\t${bet.amount}`;
        });

    const totalBets = totalPlayer1Bets + totalPlayer2Bets;

    const player1HasHigherBet = totalPlayer1Bets >= totalPlayer2Bets;

    const ratio = totalPlayer1Bets === 0 || totalPlayer2Bets === 0
        ? 'N/A'
        : player1HasHigherBet
        ? `${(totalPlayer1Bets / totalPlayer2Bets).toFixed(2)}:1`
        : `${(totalPlayer2Bets / totalPlayer1Bets).toFixed(2)}:1`;

    const formattedNames = player1HasHigherBet
        ? `(${player1Name} / ${player2Name})`
        : `(${player2Name} / ${player1Name})`;

    await interaction.reply(
        `## Bets List:\n\n\`\`\`Player\t\tName\t\t                       Amount\n${player1Name}:\n              ${player1Bets.join('\n') || 'No bets'}\n\n${player2Name}:\n              ${player2Bets.join('\n') || 'No bets'}\`\`\`\n\n` +
        `Total bet on **${player1Name}**: **${totalPlayer1Bets}** ${pointsEmoji}\n` +
        `Total bet on **${player2Name}**: **${totalPlayer2Bets}** ${pointsEmoji}\n` +
        `Total bet overall: **${totalBets}** ${pointsEmoji}\n\n` +
        `Betting Ratio ${formattedNames}: **${ratio}**`
    );
};