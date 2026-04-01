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
exports.commands = exports.client = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
dotenv_1.default.config();
const dns_1 = __importDefault(require("dns"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const log_1 = require("./utils/log");
const pointsManager_1 = require("./services/pointsManager");
(0, log_1.log)(`\n` +
    `   =============================\n` +
    `   ||        BETTY BET        ||\n` +
    `   =============================\n` +
    `   ||       By Selena V       ||\n` +
    `   =============================`);
exports.client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers
    ]
});
exports.commands = new Map();
// -----------------------------
// COMMANDS LOADING
// -----------------------------
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { command } = require(filePath);
    exports.commands.set(command.data.name, command);
}
const commandData = [...exports.commands.values()].map(cmd => cmd.data.toJSON());
(0, log_1.log)(`INFO: Loaded ${commandData.length} commands.`);
// -----------------------------
// EVENTS LOADING
// -----------------------------
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath).default;
    if (event.once) {
        exports.client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        exports.client.on(event.name, (...args) => event.execute(...args));
    }
}
node_schedule_1.default.scheduleJob('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pointsManager_1.addPointsToInventory)();
    (0, log_1.log)('Scheduled Task: Added points to all users\' inventories.');
}));
node_schedule_1.default.scheduleJob('0 12 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, pointsManager_1.addPointsToInventory)();
    (0, log_1.log)('Scheduled Task: Added points to all users\' inventories.');
}));
// -----------------------------
// READY EVENT
// -----------------------------
exports.client.once(discord_js_1.Events.ClientReady, () => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    yield (0, pointsManager_1.loadPoints)();
    yield (0, pointsManager_1.addPointsToInventory)();
    (0, log_1.log)(`INFO: Logged in as ${(_a = exports.client.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
    (_b = exports.client.user) === null || _b === void 0 ? void 0 : _b.setActivity('/help | Gearbot', {
        type: discord_js_1.ActivityType.Playing
    });
    const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        (0, log_1.log)('INFO: Started refreshing application (/) commands.');
        yield rest.put(discord_js_1.Routes.applicationCommands(exports.client.user.id), { body: commandData });
        (0, log_1.log)('INFO: Successfully reloaded application (/) commands.');
    }
    catch (error) {
        (0, log_1.log)(`ERROR: ${error}`);
    }
}));
// -----------------------------
// BOT CONNECTION
// -----------------------------
function waitForDiscord() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const checkConnection = () => {
                dns_1.default.lookup('discord.com', (err) => {
                    if (!err) {
                        (0, log_1.log)('INFO: Connection to Discord servers detected!');
                        resolve(undefined);
                    }
                    else {
                        (0, log_1.log)('WARNING: No connection to Discord yet, waiting...');
                        setTimeout(checkConnection, 5000);
                    }
                });
            };
            checkConnection();
        });
    });
}
function startBot() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield waitForDiscord();
            (0, log_1.log)('INFO: Discord connection established!');
            (0, log_1.log)('INFO: Connecting to Discord...');
            yield exports.client.login(process.env.DISCORD_TOKEN);
            (0, log_1.log)('INFO: Bot successfully connected!');
        }
        catch (error) {
            (0, log_1.log)(`ERROR: Bot connection failed: ${error}`);
            yield exports.client.destroy();
            (0, log_1.log)('ERROR: Process exited due to critical failure.');
            process.exit(1);
        }
    });
}
startBot();
