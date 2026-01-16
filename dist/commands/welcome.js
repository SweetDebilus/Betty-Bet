"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const interactionCreate_1 = require("../events/interactionCreate");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Welcome a new member or guest.")
        .addStringOption(option => option
        .setName("type")
        .setDescription("Select the type of user.")
        .setRequired(true)
        .addChoices({ name: "Member", value: "member" }, { name: "Guest", value: "guest" }))
        .addStringOption(option => option
        .setName("name")
        .setDescription("Name of the new user.")
        .setRequired(true)),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, interactionCreate_1.hasRole)('Demon General', interaction.member.roles)) {
                yield interaction.reply({ content: "You do not have permission to use this command.", flags: discord_js_1.MessageFlags.Ephemeral });
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
            }
            else {
                message = `Welcome **${name}** \\o/

Please check ⁠the <#${process.env.CHANNEL_WELCOME_ID}> channel to get the mandatory **Guest** role that will open access to relevant parts of the server! 

And please change your nickname here according to your in-game name ^^`;
            }
            yield interaction.reply(message);
        });
    }
};
