import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, CommandInteraction, GuildMember, GuildMemberRoleManager, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { addToDebilusCloset, usersPoints, savePoints, debilusCloset } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';
import { AttachmentBuilder } from 'discord.js';
import { currentBets, player1Name, player2Name, setCurrentBets, setBettingOpen, setPlayerNames } from './placeyourbets';
import { log } from '../utils/log';

const debilus = process.env.DEBILUS!;
const pointsEmoji = process.env.POINTS!;

export const command = {
    data: new SlashCommandBuilder()
        .setName('win')
        .setDescription('Declare the winner and redistribute points. (BetManager only)'),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await interaction.reply({
                content: 'You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (Object.keys(currentBets).length === 0) {
            await interaction.reply({
                content: `No bets were placed, nothing to redistribute. ${debilus}`,
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('win_select')
                .setPlaceholder('Choose the winning player')
                .addOptions([
                    {
                        label: player1Name,
                        value: '1'
                    },
                    {
                        label: player2Name,
                        value: '2'
                    }
                ])
        );

        await interaction.reply({
            content: 'Select the winner:',
            components: [row],
            flags: MessageFlags.Ephemeral
        });
    }
};

export const handleWin = async (interaction: CommandInteraction | StringSelectMenuInteraction, winningPlayer: 'bet_player1' | 'bet_player2') => {
    let totalBetAmount = 0;
    let winnerBetAmount = 0;
    let loserBetAmount = 0;
    const winningPlayerName = winningPlayer === 'bet_player1' ? player1Name : player2Name;
    let loserTotalPoints = 0;

    for (const bet of Object.values(currentBets)) {
        if (bet.betOn !== winningPlayer) {
            loserTotalPoints += bet.amount;
        }
    }

    for (const bet of Object.values(currentBets)) {
        totalBetAmount += bet.amount;
        if (bet.betOn === winningPlayer) {
            winnerBetAmount += bet.amount;
        } else {
            loserBetAmount += bet.amount;
        }
    }

    if (winnerBetAmount === 0 && loserBetAmount === 0) {
        const message = `No bets, no money ! ${debilus}`;
        await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
        return;
    }

    if (winnerBetAmount === 0) {
        addToDebilusCloset(totalBetAmount);
        await savePoints();
        const file = new AttachmentBuilder('./images/crashboursier.png');
        const message2 = `Thanks for money, Debilus !\n\nAll GearPoints have been added to the **debilus closet** ! \nTotal GearPoints in debilus closet: **${debilusCloset}** ${pointsEmoji}`;
        await interaction.reply({ content: `The winner is **${winningPlayerName}** ! No bets were placed on the winner. ${message2}`, files: [file] });

        for (const [userId, bet] of Object.entries(currentBets)) {
            usersPoints[userId].losses += 1;

            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }

        setCurrentBets({});
        setBettingOpen(false);
        await savePoints();
        return;
    }

    for (const [userId, bet] of Object.entries(currentBets)) {
        if (bet.betOn === winningPlayer) {
            const gainFromLosers = Math.floor(bet.amount / winnerBetAmount * loserTotalPoints);
            usersPoints[userId].points += bet.amount + gainFromLosers;
            usersPoints[userId].wins += 1;

            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'win';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        } else {
            usersPoints[userId].losses += 1;
            const betHistory = usersPoints[userId].betHistory;
            betHistory[betHistory.length - 1].result = 'loss';
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
        }
    }

    await savePoints();
    setCurrentBets({});
    setBettingOpen(false);

    const message = `The winner is **${winningPlayerName}** ! Congratulations to all those who bet on this player, the GearPoints have been redistributed !`;
    const message2 = `The winner is **${winningPlayerName}** ! It's the stock market crash, you had to believe a little more in this player !`;
    const file = new AttachmentBuilder('./images/petitcrashboursier.png');

    if (winnerBetAmount < loserBetAmount) {
        await interaction.reply({ content: message2, files: [file] });
    } else {
        const winFile = new AttachmentBuilder('./images/victoire.png');
        await interaction.reply({ content: message, files: [winFile] });
    }

    setPlayerNames('Player 1', 'Player 2');
    log(`INFO: Win command executed. Winner: ${winningPlayerName}. Points redistributed.`);
};
