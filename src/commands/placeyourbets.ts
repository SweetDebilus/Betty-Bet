import { ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildMember, GuildMemberRoleManager, CommandInteraction, TextChannel, ButtonInteraction, SlashCommandBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle, ModalBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
import { MessageFlags } from 'discord.js';
import { log } from '../utils/log';
import { usersPoints, savePoints } from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';

const betyEmoji = process.env.BETTY!;
const pointsEmoji = process.env.POINTS!;

export let player1Name = 'Player 1';
export let player2Name = 'Player 2';
export let currentBets: { [key: string]: { amount: number, betOn: 'bet_player1' | 'bet_player2' } } = {};
export let bettingOpen = false;

export function setPlayerNames(name1: string, name2: string) {
    player1Name = name1;
    player2Name = name2;
}

export function setCurrentBets(bets: { [key: string]: { amount: number, betOn: 'bet_player1' | 'bet_player2' } }) {
    currentBets = bets;
}

export function setBettingOpen(isOpen: boolean) {
    bettingOpen = isOpen;
}

export const command = {
    data: new SlashCommandBuilder()
        .setName('placeyourbets')
        .setDescription('Place your bets! (BetManager only)')
        .addStringOption(option =>
            option.setName('player1name')
                .setDescription('Name of the first player')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('player2name')
                .setDescription('Name of the second player')
                .setRequired(true)),

    async execute(interaction: CommandInteraction) {
        
        if (!hasRole(process.env.ROLE!, (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await interaction.reply({ 
                content: `Only users with the role *${process.env.ROLE}* are allowed to use Betty Bet`, 
                flags: MessageFlags.Ephemeral 
            });
            log(`WARNING: PlaceYourBets command executed without proper permissions.`);
            return;
        }
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handlePlaceYourBets(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.',  
                flags: MessageFlags.Ephemeral 
            });
            log(`WARNING: PlaceYourBets command executed without proper permissions.`);
        }
    }
};

const handlePlaceYourBets = async (interaction: CommandInteraction) => {
    bettingOpen = true;
    currentBets = {};

    if (!interaction.isChatInputCommand()) {
        return interaction.reply('An error has occurred. Please try again.');
    }
    const player1Option = interaction.options.get('player1name');
    const player2Option = interaction.options.get('player2name');
    

    player1Name = player1Option ? player1Option.value as string : 'Player 1';
    player2Name = player2Option ? player2Option.value as string : 'Player 2';

    log(`Bets are open for ${player1Name} and ${player2Name}`);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('bet_player1')
                .setLabel('Bet on ' + player1Name)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('bet_player2')
                .setLabel('Bet on ' + player2Name)
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.reply({
        content: `## The bets are open!!!\n\nYou have **60 seconds** to choose between **${player1Name}** and **${player2Name}**.\n\n`,
        components: [actionRow]
    });
    log(`INFO: Bets are now open for ${player1Name} vs ${player2Name}`);

    const replyMessage = await interaction.fetchReply();

    const channel = interaction.channel as TextChannel;
    if (channel) {
        channel.send(`${betyEmoji}    ${betyEmoji}    ${betyEmoji}    ${betyEmoji}`);
    }

    setTimeout(async () => {
        try {
            bettingOpen = false;

            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('bet_player1')
                        .setLabel('Bet on ' + player1Name)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true), 
                    new ButtonBuilder()
                        .setCustomId('bet_player2')
                        .setLabel('Bet on ' + player2Name)
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true) 
                );

            await replyMessage.edit({
                content: `## Bets are now closed!`,
                components: [disabledRow],
            });

            if (channel) {
                channel.send('*Thanks for the money!*');
            }
            log('INFO: Bets are now closed.');
        } catch (error) {
            log(`ERROR: Error closing bets: ${error}`);
        }
    }, 60000);
};

export const handleBetSelection = async (interaction: ButtonInteraction) => {
    if (!['bet_player1', 'bet_player2'].includes(interaction.customId)) return;
    if (!bettingOpen) {
        await interaction.reply({
            content: 'Bets are now closed.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    const userId = interaction.user.id;
    const customId = interaction.customId;

    if (!usersPoints[userId]) {
        await interaction.reply({
            content: 'You are not registered yet. Use */register* to register.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (currentBets[userId] && currentBets[userId].betOn !== customId) {
        await interaction.reply({
            content: 'You have already placed a bet on the other player.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    if (currentBets[userId]) {
        await interaction.reply({
            content: 'You have already placed a bet on this player.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const playerName = customId === 'bet_player1' ? player1Name : player2Name;

    const modal = new ModalBuilder()
        .setCustomId(`bet_modal_${customId}`)
        .setTitle(`Bet on ${playerName}`);

    const betAmountInput = new TextInputBuilder()
        .setCustomId('bet_amount')
        .setLabel(`You have ${usersPoints[userId].points} ! Enter your bet amount`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. 100')
        .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(betAmountInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
    log(`INFO: User ${interaction.user.displayName} is placing a bet on ${playerName}`)
};

export const handleBetModal = async (interaction: ModalSubmitInteraction) => {
    try {
        const userId = interaction.user.id;
        const betAmountStr = interaction.fields.getTextInputValue('bet_amount');

        if (!/^\d+$/.test(betAmountStr)) {
        await interaction.reply({
            content: 'Invalid input. Please enter only numbers.',
            flags: MessageFlags.Ephemeral,
        });
        return;
        }

        const betAmount = parseInt(betAmountStr);

        if (betAmount <= 0) {
            await interaction.reply({
                content: 'Invalid bet amount. Please enter a positive number.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const customId = interaction.customId.replace('bet_modal_', ''); 
        const chosenPlayerName = customId === 'bet_player1' ? player1Name : player2Name;

        if (!usersPoints[userId]) {
            await interaction.reply({
                content: 'You are not registered yet. Use */register* to register.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        if (usersPoints[userId].points < betAmount) {
            await interaction.reply({
                content: `${pointsEmoji} Not enough points. Try a lower amount.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        usersPoints[userId].points -= betAmount;
        currentBets[userId] = { amount: betAmount, betOn: customId as 'bet_player1' | 'bet_player2' };
        usersPoints[userId].betHistory.push({
        betOn: chosenPlayerName,
        amount: betAmount,
        result: 'pending',
        date: new Date(),
        });

        await savePoints();

        await interaction.reply({
            content: `You successfully placed a bet of **${betAmount}** ${pointsEmoji} on **${chosenPlayerName}**!`,
            flags: MessageFlags.Ephemeral,
        });
        log(`INFO: User ${interaction.user.displayName} placed a bet of ${betAmount} on ${chosenPlayerName}`);
        log(`INFO: Current Bets: ${JSON.stringify(currentBets)}`);
    } catch (error) {
        console.error('Error in handleBetModal:', error);
        await interaction.reply({
            content: 'An error occurred while processing your bet. Please try again.',
            flags: MessageFlags.Ephemeral,
        });
        log(`ERROR: Error in handleBetModal: ${error}`);
    }
};