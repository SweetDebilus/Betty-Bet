import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from 'discord.js';
import { log } from '../utils/log';

export const command = {
    data: new SlashCommandBuilder()  
        .setName('help') 
        .setDescription('Present Betty Bet and its functions'),
    
    async execute(interaction: ChatInputCommandInteraction) {
        const text = `
Hello ! I'm **Betty Bet**, your betting bot ! You will find all my features and my source code via this link:

https://github.com/SweetDebilus/Betty-Bet?tab=readme-ov-file#betty-bet`;
        await interaction.reply({ 
            content: text, 
            flags: MessageFlags.Ephemeral 
        });
        log(`INFO: User ${interaction.user.id} accessed the help command.`);
    }
};