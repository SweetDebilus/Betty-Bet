"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const interactionCreate_1 = require("../events/interactionCreate");
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv_1.default.config();
const roleName = process.env.ROLE;
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('veteranlist')
        .setDescription('View the list of veteran users. (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleVeteranList(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
            }
        });
    }
};
const handleVeteranList = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guild = interaction.guild;
        const channel = interaction.channel;
        if (!guild || !channel || channel.type !== 0) {
            yield interaction.reply({
                content: '❌ This command must be used in a server text channel.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        yield interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
        const members = yield guild.members.fetch();
        const daemonPunkRole = guild.roles.cache.find(role => role.name === roleName);
        if (!daemonPunkRole) {
            yield interaction.editReply({
                content: '⚠️ The "Dæmon Punk" role is not found on this server.'
            });
            return;
        }
        const previousVeterans = loadVeteranIds();
        const veterans = members.filter(member => member.roles.cache.has(daemonPunkRole.id) &&
            member.joinedTimestamp &&
            member.joinedTimestamp < oneYearAgo &&
            !previousVeterans.has(member.id));
        if (veterans.size === 0) {
            yield interaction.editReply({
                content: '✅ No new veteran to promote.'
            });
            return;
        }
        const sortedVeterans = [...veterans.values()].sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' }));
        const veteranLines = sortedVeterans.map(member => `• ${member.displayName} — since ${new Date(member.joinedTimestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`);
        const header = '👑 New "Dæmon Punk" veterans to promote:\n';
        const chunks = [];
        let currentChunk = header;
        for (const line of veteranLines) {
            if ((currentChunk + line + '\n').length > 2000) {
                chunks.push(currentChunk);
                currentChunk = line + '\n';
            }
            else {
                currentChunk += line + '\n';
            }
        }
        if (currentChunk.length > 0)
            chunks.push(currentChunk);
        for (const chunk of chunks) {
            yield channel.send(chunk);
        }
        sortedVeterans.forEach(member => previousVeterans.add(member.id));
        saveVeteranIds(previousVeterans);
        yield interaction.editReply({
            content: `✅ ${chunks.length} message(s) sent with ${sortedVeterans.length} new veteran(s).`
        });
    }
    catch (error) {
        console.error('Erreur dans handleVeteranList :', error);
        yield interaction.editReply({
            content: '⚠️ An error occurred while generating the veterans list.'
        });
    }
});
const veteranFilePath = path.join('src/data', 'veterans.json');
const ensureVeteranFile = () => {
    if (!fs.existsSync('src/data'))
        fs.mkdirSync('src/data', { recursive: true });
    if (!fs.existsSync(veteranFilePath))
        fs.writeFileSync(veteranFilePath, JSON.stringify([]));
};
const loadVeteranIds = () => {
    ensureVeteranFile();
    const data = JSON.parse(fs.readFileSync(veteranFilePath, 'utf-8'));
    return new Set(data);
};
const saveVeteranIds = (ids) => {
    fs.writeFileSync(veteranFilePath, JSON.stringify([...ids], null, 2));
};
