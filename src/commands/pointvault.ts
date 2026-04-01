import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { usersPoints } from '../services/pointsManager';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('pointvault') 
        .setDescription('Check the total points in the vault'),
    
    async execute(interaction: ChatInputCommandInteraction) {
    const pointsEmoji = process.env.POINTS!;

    const userId = interaction.user.id;

    if (!usersPoints[userId]) {
        await interaction.reply({ 
            content:`You are not registered yet. Use */register* to register.`, 
            flags: MessageFlags.Ephemeral 
        })
        log(`WARN: Unregistered user ${userId} attempted to access Point Vault.`);
        return;
    }
    const inventoryPoints = usersPoints[userId].inventory;
    await interaction.reply({ 
        content: `You have **${inventoryPoints}** ${pointsEmoji} in your Point Vault.`, 
        flags: MessageFlags.Ephemeral 
    })
    log(`INFO: User ${userId} checked their Point Vault balance of ${inventoryPoints} points.`);
    }
};