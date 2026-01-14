import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, GuildMemberRoleManager, MessageFlags, CommandInteraction } from 'discord.js';
import * as fs from 'fs';
import { addToDebilusCloset, encrypt, setLastUpdateTime, setPurchaseHistory, setStore, filePath } from '../services/pointsManager';
import { usersPoints} from '../services/pointsManager';
import { hasRole } from '../events/interactionCreate';

export const command = {
    data: new SlashCommandBuilder() 
        .setName('backup') 
        .setDescription('Encrypt and save data from decrypted backup. (BetManager only)'),
    async execute(interaction: ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleBackup(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.',
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};

const createDataDebilusDir = () => {
    if (!fs.existsSync('src/data')) {
        fs.mkdirSync('src/data');
    }
};

const handleBackup = async (interaction: CommandInteraction) => {
    createDataDebilusDir();

    if (!fs.existsSync('src/data/decrypted_backup.json')) {
        await interaction.reply({ content: 'No decrypted backup found.', flags: MessageFlags.Ephemeral });
        return;
    }

    const decryptedData = JSON.parse(fs.readFileSync('src/data/decrypted_backup.json', 'utf-8'));
    const encryptedData = encrypt(JSON.stringify(decryptedData));

    fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2));

    Object.assign(usersPoints, decryptedData.usersPoints);
    
    addToDebilusCloset(decryptedData.debilusCloset);
    setStore(decryptedData.store);
    setPurchaseHistory(decryptedData.purchaseHistory);
    setLastUpdateTime(new Date(decryptedData.lastUpdateTime));

    await interaction.reply({ 
        content: 'Data from decrypted backup has been encrypted and **saved successfully** !', 
        flags: MessageFlags.Ephemeral 
    });
};