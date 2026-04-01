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
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const pointsManager_1 = require("../services/pointsManager");
const pointsManager_2 = require("../services/pointsManager");
const interactionCreate_1 = require("../events/interactionCreate");
const log_1 = require("../utils/log");
exports.command = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('backup')
        .setDescription('Encrypt and save data from decrypted backup. (BetManager only)'),
    execute(interaction) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((0, interactionCreate_1.hasRole)('BetManager', interaction.member.roles)) {
                yield handleBackup(interaction);
            }
            else {
                yield interaction.reply({
                    content: 'You do not have permission to use this command.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                (0, log_1.log)(`WARNING: Backup command executed without proper permissions.`);
            }
        });
    }
};
const createDataDebilusDir = () => {
    if (!fs.existsSync('src/data')) {
        fs.mkdirSync('src/data');
    }
};
const handleBackup = (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    createDataDebilusDir();
    if (!fs.existsSync('src/data/decrypted_backup.json')) {
        yield interaction.reply({ content: 'No decrypted backup found.', flags: discord_js_1.MessageFlags.Ephemeral });
        (0, log_1.log)(`WARN: Backup command executed but no decrypted backup file found.`);
        return;
    }
    const decryptedData = JSON.parse(fs.readFileSync('src/data/decrypted_backup.json', 'utf-8'));
    const encryptedData = (0, pointsManager_1.encrypt)(JSON.stringify(decryptedData));
    fs.writeFileSync(pointsManager_1.filePath, JSON.stringify(encryptedData, null, 2));
    Object.assign(pointsManager_2.usersPoints, decryptedData.usersPoints);
    (0, pointsManager_1.addToDebilusCloset)(decryptedData.debilusCloset);
    (0, pointsManager_1.setStore)(decryptedData.store);
    (0, pointsManager_1.setPurchaseHistory)(decryptedData.purchaseHistory);
    (0, pointsManager_1.setLastUpdateTime)(new Date(decryptedData.lastUpdateTime));
    yield interaction.reply({
        content: 'Data from decrypted backup has been encrypted and **saved successfully** !',
        flags: discord_js_1.MessageFlags.Ephemeral
    });
    (0, log_1.log)(`INFO: Data from decrypted backup has been encrypted and saved by a BetManager.`);
});
