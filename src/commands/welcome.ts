import { GuildMember, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import { hasRole } from '../events/interactionCreate';
import { log } from '../utils/log';


export const command = {
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Welcome a new member or guest.")
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("Select the type of user.")
                .setRequired(true)
                .addChoices(
                    { name: "Member", value: "member" },
                    { name: "Guest", value: "guest" }
                )
        )
        .addStringOption(option =>
            option
                .setName("name")
                .setDescription("Name of the new user.")
                .setRequired(true)
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!hasRole('Demon General', (interaction.member as GuildMember).roles as GuildMemberRoleManager)) {
            await interaction.reply({ content: "You do not have permission to use this command.", flags: MessageFlags.Ephemeral });
            return;
        }
        const type = interaction.options.getString("type");
        const name = interaction.options.getString("name");

        let message = "";

        if (type === "member") {
            message = `Welcome **${name}** \\o/

Please check ⁠the <#${process.env.CHANNEL_WELCOME_ID}> channel to get the mandatory **Dæmon Punk** role that will open access to most of the server ! 

You can also check <#${process.env.CHANNEL_ROLE_SELECTION_ID}> at any time for optional server roles that might interest you like for mount farming etc., they will open access to other sections of the server as well 😄

And please change your nickname here according to your in-game name ^^`;
        } else {
            message = `Welcome **${name}** \\o/

Please check ⁠the <#${process.env.CHANNEL_WELCOME_ID}> channel to get the mandatory **Guest** role that will open access to relevant parts of the server! 

And please change your nickname here according to your in-game name ^^`;
        }

        await interaction.reply(message);
    }
};