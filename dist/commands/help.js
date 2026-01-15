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
const log_1 = require("../utils/log");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('help')
        .setDescription('Present Betty Bet and its functions'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = `
Hello ! I'm **Betty Bet**, your betting bot ! You will find all my features and my source code via this link:

https://github.com/SweetDebilus/Betty-Bet?tab=readme-ov-file#betty-bet`;
            yield interaction.reply({
                content: text,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            (0, log_1.log)(`INFO: User ${interaction.user.id} accessed the help command.`);
        });
    }
};
