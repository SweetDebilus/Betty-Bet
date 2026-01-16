import { SlashCommandBuilder, GuildMember, GuildMemberRoleManager, MessageFlags, CommandInteraction, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { hasRole } from '../events/interactionCreate';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { log } from '../utils/log';
dotenv.config();

const roleName = process.env.ROLE!;

export const command = {
    data: new SlashCommandBuilder()
        .setName('veteranlist')
        .setDescription('Displays and adds veteran users to a list (BetManager only)'),
    
    async execute(interaction:  ChatInputCommandInteraction) {
        if (hasRole('BetManager', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await handleVeteranList(interaction);
        } else {
            await interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                flags: MessageFlags.Ephemeral 
            });
            log(`ERROR: Veteran list command executed without proper permissions.`);
        }   
    }
};

const handleVeteranList = async (interaction: CommandInteraction) => {
    try {
        const guild = interaction.guild;
        const channel = interaction.channel;

        if (!guild || !channel || channel.type !== 0) {
            await interaction.reply({
                content: '❌ This command must be used in a server text channel.',
                flags: MessageFlags.Ephemeral
            });
            log('ERROR: Veteran list command used in invalid context.');
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
        const members = await guild.members.fetch();

        const daemonPunkRole = guild.roles.cache.find(role => role.name === roleName);
        if (!daemonPunkRole) {
            await interaction.editReply({
                content: '⚠️ The "Dæmon Punk" role is not found on this server.'
            });
            log('ERROR: "Dæmon Punk" role not found.');
            return;
        }

        const previousVeterans = loadVeteranIds();

        const veterans = members.filter(member =>
            member.roles.cache.has(daemonPunkRole.id) &&
            member.joinedTimestamp &&
            member.joinedTimestamp < oneYearAgo &&
            !previousVeterans.has(member.id)
        );

        if (veterans.size === 0) {
            await interaction.editReply({
                content: '✅ No new veteran to promote.'
            });
            log('INFO: No new veterans found for promotion.');
            return;
        }

        const sortedVeterans = [...veterans.values()].sort((a, b) =>
            a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
        );

        const veteranLines = sortedVeterans.map(member =>
            `• ${member.displayName} — since ${new Date(member.joinedTimestamp!).toLocaleDateString(
                'en-US',
                {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            )}`
        );

        const header = '👑 New "Dæmon Punk" veterans to promote:\n';
        const chunks: string[] = [];
        let currentChunk = header;

        for (const line of veteranLines) {
            if ((currentChunk + line + '\n').length > 2000) {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
            } else {
                currentChunk += line + '\n';
            }
        }
        if (currentChunk.length > 0) chunks.push(currentChunk);

        for (const chunk of chunks) {
            await (channel as TextChannel).send(chunk);
        }

        sortedVeterans.forEach(member => previousVeterans.add(member.id));
        saveVeteranIds(previousVeterans);

        await interaction.editReply({
            content: `✅ ${chunks.length} message(s) sent with ${sortedVeterans.length} new veteran(s).`
        });
        log(`INFO: Veteran list generated with ${sortedVeterans.length} new veterans.`);
    } catch (error) {
        console.error('Erreur dans handleVeteranList :', error);
        await interaction.editReply({
            content: '⚠️ An error occurred while generating the veterans list.'
        });
        log(`ERROR: handleVeteranList failed - ${error}`);
    }
};

const veteranFilePath = path.join('src/data', 'veterans.json');

const ensureVeteranFile = () => {
    if (!fs.existsSync('src/data')) fs.mkdirSync('src/data', { recursive: true });
    if (!fs.existsSync(veteranFilePath)) fs.writeFileSync(veteranFilePath, JSON.stringify([]));
};

const loadVeteranIds = (): Set<string> => {
    ensureVeteranFile();
    const data = JSON.parse(fs.readFileSync(veteranFilePath, 'utf-8'));
    return new Set(data);
};

const saveVeteranIds = (ids: Set<string>) => {
    fs.writeFileSync(veteranFilePath, JSON.stringify([...ids], null, 2));
};