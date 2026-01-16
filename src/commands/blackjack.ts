import { 
    SlashCommandBuilder, 
    MessageFlags, 
    ChatInputCommandInteraction, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ButtonInteraction 
} from 'discord.js';

import { addToDebilusCloset, savePoints, usersPoints } from '../services/pointsManager';
import { log } from '../utils/log';

const pointsEmoji = process.env.POINTS!;

const blackjackGames: { 
    [key: string]: { 
        playerHand: string[], 
        dealerHand: string[], 
        bet: number 
    } 
} = {};

const cardValues: { [key: string]: number } = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10, 'A': 11
};

const suits = ['♠️', '♥️', '♦️', '♣️'];
const cards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const command = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of blackjack'),

    async execute(interaction: ChatInputCommandInteraction) {
        const userId = interaction.user.id;

        if (!usersPoints[userId]) {
            await interaction.reply({
                content: 'You are not registered yet. Use `/register` to sign up.',
                flags: MessageFlags.Ephemeral
            });
            log(`WARN: Unregistered user ${userId} attempted to start a blackjack game.`);
            return;
        }

        if (blackjackGames[userId]) {
            await interaction.reply({
                content: 'You already have an ongoing blackjack game.',
                flags: MessageFlags.Ephemeral
            });
            log(`WARN: User ${userId} already has an ongoing blackjack game.`);
            return;
        }

        if (usersPoints[userId].points < 40) {
            await interaction.reply({
                content: 'You need at least 40 points to play blackjack.',
                flags: MessageFlags.Ephemeral
            });
            log(`WARN: User ${userId} attempted to start blackjack game with insufficient points.`);
            return;
        }

        const { playerHand, dealerHand } = startBlackjackGame(userId, 40);
        const playerValue = calculateHandValue(playerHand);

        usersPoints[userId].points -= 40;
        await savePoints();

        await interaction.reply({
            content: `\n# *Betty Bet's visible card*: 
## **|${dealerHand[0]}| |??|**

# *Your hand*: 
## **|${playerHand.join('| |')}|**
## = **${playerValue}**`,
            components: [createBlackjackActionRow()],
            flags: MessageFlags.Ephemeral
        });
        log(`INFO: User ${userId} started a blackjack game with a bet of 40 points.`);
    }
};

// ----------------------
// HANDLERS
// ----------------------

export const handleBlackjackInteraction = async (interaction: ButtonInteraction) => {
    if (!['blackjack_hit', 'blackjack_stand'].includes(interaction.customId)) return;

    const userId = interaction.user.id;
    const game = blackjackGames[userId];

    if (!game) {
        await interaction.reply({
            content: 'No active blackjack game found. Start a new game with /blackjack',
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    if (interaction.customId === 'blackjack_hit') {
        game.playerHand.push(drawCard());
        const playerValue = calculateHandValue(game.playerHand);

        if (playerValue > 21) {
            delete blackjackGames[userId];
            addToDebilusCloset(40);
            log(`INFO: User ${userId} busted in blackjack game and added 40 points to Debilus Closet.`);
            await savePoints();

            await interaction.update({
                content: `\n# *Your hand*: 
## **|${game.playerHand.join('| |')}|**
## = **${playerValue}**

## **You bust!** *Betty Bet wins.*`,
                components: []
            });
            return;
        }

        await interaction.update({
            content: `\n# *Betty Bet's visible card*: 
## **|${game.dealerHand[0]}| |??|**

# *Your hand*: 
## **|${game.playerHand.join('| |')}|**
## = **${playerValue}**`,
            components: [createBlackjackActionRow()]
        });

    } else if (interaction.customId === 'blackjack_stand') {
        let dealerValue = calculateHandValue(game.dealerHand);

        while (dealerValue < 17) {
            game.dealerHand.push(drawCard());
            dealerValue = calculateHandValue(game.dealerHand);
        }

        const playerValue = calculateHandValue(game.playerHand);

        let resultMessage = `\n# *Betty Bet's hand*: 
## **|${game.dealerHand.join('| |')}|**
### = **${dealerValue}**

# *Your hand*: 
## **|${game.playerHand.join('| |')}|**
## = **${playerValue}**\n\n`;

        if (dealerValue > 21 || playerValue > dealerValue) {
            usersPoints[userId].points += game.bet * 2;
            resultMessage += '## **You win!**';
            log(`INFO: User ${userId} won the blackjack game.`);
        } else if (playerValue < dealerValue) {
            addToDebilusCloset(40);
            resultMessage += '## **Betty Bet wins!**';
            log(`INFO: User ${userId} lost the blackjack game.`);
        } else {
            usersPoints[userId].points += game.bet;
            resultMessage += '## **It\'s a tie!**';
            log(`INFO: User ${userId} tied the blackjack game.`);
        }

        delete blackjackGames[userId];
        log(`INFO: Blackjack game for user ${userId} concluded.`);
        await savePoints();

        await interaction.update({
            content: resultMessage + `\n## You now have **${usersPoints[userId].points}** ${pointsEmoji}`,
            components: []
        });
    }
};

// ----------------------
// UTILITAIRES
// ----------------------

const createBlackjackActionRow = () => {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('blackjack_hit')
                .setLabel('Hit')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('blackjack_stand')
                .setLabel('Stand')
                .setStyle(ButtonStyle.Success)
        );
};

const startBlackjackGame = (userId: string, bet: number) => {
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];

    blackjackGames[userId] = { playerHand, dealerHand, bet };

    log(`INFO: Blackjack game started for user ${userId}`);
    return { playerHand, dealerHand };
};

const drawCard = () => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const card = cards[Math.floor(Math.random() * cards.length)];
    return `${card}${suit}`;
};

const calculateHandValue = (hand: string[]) => {
    let value = 0;
    let aces = 0;

    hand.forEach(card => {
        const match = card.match(/[0-9]+|[JQKA]/);
        const cardValue = match ? match[0] : null;

        if (cardValue) {
            value += cardValues[cardValue];
            if (cardValue === 'A') aces++;
        } else {
            log(`ERROR: Invalid card format encountered: ${card}`);
        }
    });

    while (value > 21 && aces) {
        value -= 10;
        aces--;
    }

    return value;
};