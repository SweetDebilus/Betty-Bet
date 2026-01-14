import { 
    SlashCommandBuilder, 
    MessageFlags, 
    ChatInputCommandInteraction, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ButtonInteraction, 
    CommandInteraction
} from 'discord.js';
import { savePoints, usersPoints } from '../services/pointsManager';
import { log } from '../utils/log';

const pointsEmoji = process.env.POINTS!;
const highlowGames: { [key: string]: { visibleCard: number, hiddenCard: number } } = {};
const debilus = process.env.DEBILUS!;

export const command = {
    data: new SlashCommandBuilder()
        .setName('higherlower')
        .setDescription('Play a game of Higher or Lower'),
    
    async execute(interaction: ChatInputCommandInteraction) {

        const userId = interaction.user.id;
        if (!usersPoints[userId]) {
            await interaction.reply({
                content: 'You are not registered yet. Use `/register` to sign up.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if (usersPoints[userId].points < 40) {
            await interaction.reply({
                content: 'You do not have enough points to play this game.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        await handleHighLow(interaction);
    }
}

const handleHighLow = async (interaction: CommandInteraction) => {

    const userId = interaction.user.id;

    let randomCardVisible = Math.floor(Math.random() * 9) + 1; 
    let randomCardHidden = Math.floor(Math.random() * 9) + 1; 

    while (randomCardVisible === randomCardHidden) {
        randomCardHidden = Math.floor(Math.random() * 9) + 1;
    }

    highlowGames[userId] = {
        visibleCard: randomCardVisible,
        hiddenCard: randomCardHidden,
    };

    const createHighLowActionRow = () => {
        return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('highlow_higher') 
            .setLabel('Higher') 
            .setStyle(ButtonStyle.Success), 
            new ButtonBuilder()
            .setCustomId('highlow_lower') 
            .setLabel('Lower') 
            .setStyle(ButtonStyle.Danger)
        );
    };

    // Message initial du jeu
    await interaction.reply({
        content: `# High-Low Game\n\n## |${randomCardVisible}| |?|\n\nDo you think the hidden card is higher or lower?`,
        components: [createHighLowActionRow()], 
        flags: MessageFlags.Ephemeral, 
    });

    usersPoints[userId].points -= 40;
    usersPoints[userId].isDebilus = usersPoints[userId].points <= 0; 
    await savePoints();
};

export const handleHighLowButton = async (interaction: ButtonInteraction) => {
    const userId = interaction.user.id;
    const customId = interaction.customId;

    if (!highlowGames[userId]) {
        await interaction.reply({ content: 'No active game found. Please start a new game using the High-Low command.', flags: MessageFlags.Ephemeral });
        return;
    }

    const { visibleCard, hiddenCard } = highlowGames[userId];
    let resultMessage;

    const calculateReward = (visibleCard: number) => {
        if (visibleCard <= 2 || visibleCard >= 8) {
        return 48; 
        } else if (visibleCard >= 4 && visibleCard <= 6) {
        return 60; 
        } else {
        return 50; 
        }
    };

    const reward: number = calculateReward(visibleCard); 

    if (customId === 'highlow_higher') {
        if (hiddenCard > visibleCard) {
        usersPoints[userId].points += reward; 
        usersPoints[userId].isDebilus = usersPoints[userId].points <= 0; 
        await savePoints(); 
        resultMessage = `**Congratulations!** The hidden card **|${hiddenCard}|** is higher than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        } else {
        resultMessage = `**Sorry**, the hidden card **|${hiddenCard}|** is not higher than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        }
    } else if (customId === 'highlow_lower') {
        if (hiddenCard < visibleCard) {
            usersPoints[userId].points += reward; 
            usersPoints[userId].isDebilus = usersPoints[userId].points <= 0;
            await savePoints(); 
            resultMessage = `**Congratulations!** The hidden card **|${hiddenCard}|** is lower than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        } else {
            resultMessage = `**Sorry**, the hidden card **|${hiddenCard}|** is not lower than **|${visibleCard}|**.\n\nYou have **${usersPoints[userId].points}${pointsEmoji}** !`;
        }
    }

    if (usersPoints[userId].isDebilus) {
        resultMessage += `\n\nYou have ${usersPoints[userId].points}${pointsEmoji} ! You're now a Debilus. Play wisely next time! ${debilus}`;
    }

    await interaction.update({
        content: `# High-Low Game\n\n## |${visibleCard}| |${hiddenCard}|\n\n`+ resultMessage,
        components: [],
    });

    delete highlowGames[userId];
    log(`User ${userId} has finished the game: high-low`);
};