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
exports.addPointsToInventory = exports.encrypt = exports.debilusCloset = exports.lastUpdateTime = exports.purchaseHistory = exports.store = exports.filePath = exports.usersPoints = void 0;
exports.addToDebilusCloset = addToDebilusCloset;
exports.setStore = setStore;
exports.setPurchaseHistory = setPurchaseHistory;
exports.setLastUpdateTime = setLastUpdateTime;
exports.savePoints = savePoints;
exports.loadPoints = loadPoints;
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const crypto_1 = __importDefault(require("crypto"));
const log_1 = require("../utils/log");
const notification_1 = require("./notification");
exports.usersPoints = {};
const algorithm = process.env.ALGO;
const secretKey = Buffer.from(process.env.KEY, 'hex');
exports.filePath = 'src/data/usersPoints.json';
exports.store = {};
exports.purchaseHistory = {};
exports.lastUpdateTime = new Date();
exports.debilusCloset = 0;
function addToDebilusCloset(amount) {
    exports.debilusCloset += amount;
}
function setStore(newStore) {
    exports.store = newStore;
}
function setPurchaseHistory(newHistory) {
    exports.purchaseHistory = newHistory;
}
function setLastUpdateTime(newTime) {
    exports.lastUpdateTime = newTime;
}
const encrypt = (text) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};
exports.encrypt = encrypt;
const decrypt = (hash) => {
    if (!hash || !hash.iv || !hash.content) {
        throw new Error('Invalid data to decrypt');
    }
    const iv = Buffer.from(hash.iv, 'hex');
    const decipher = crypto_1.default.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
};
const createDataDebilusDir = () => {
    if (!fs.existsSync('src/data')) {
        fs.mkdirSync('src/data');
    }
};
const saveDecryptedBackup = () => {
    try {
        createDataDebilusDir();
        const data = {
            usersPoints: exports.usersPoints,
            debilusCloset: exports.debilusCloset,
            store: exports.store,
            purchaseHistory: exports.purchaseHistory,
            lastUpdateTime: exports.lastUpdateTime.toISOString()
        };
        fs.writeFileSync('src/data/decrypted_backup.json', JSON.stringify(data, null, 2));
        (0, log_1.log)("INFO: Decrypted backup data saved.");
    }
    catch (error) {
        (0, log_1.log)(`ERROR: Error saving points: ${error}`);
    }
};
function savePoints() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            usersPoints: exports.usersPoints,
            debilusCloset: exports.debilusCloset,
            store: exports.store,
            purchaseHistory: exports.purchaseHistory,
            lastUpdateTime: exports.lastUpdateTime.toISOString()
        };
        const encryptedData = (0, exports.encrypt)(JSON.stringify(data));
        const maxAttempts = 3;
        let attempts = 0;
        function tryWriteFile() {
            try {
                if (fs.existsSync(exports.filePath)) {
                    fs.accessSync(exports.filePath, fs.constants.W_OK);
                }
                else {
                    (0, log_1.log)("WARNING: Le fichier n'existe pas, création d'un nouveau...");
                }
                fs.writeFileSync(exports.filePath, JSON.stringify(encryptedData, null, 2));
                (0, log_1.log)("INFO: Data saved successfully.");
                saveDecryptedBackup();
            }
            catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    (0, log_1.log)(`WARNING: Tentative ${attempts} échouée, nouvelle tentative dans 500ms...`);
                    setTimeout(tryWriteFile, 500);
                }
                else {
                    (0, log_1.log)("ERROR: Échec après plusieurs tentatives : " + error);
                }
            }
        }
        tryWriteFile();
    });
}
;
function loadPoints() {
    return __awaiter(this, void 0, void 0, function* () {
        if (fs.existsSync(exports.filePath)) {
            try {
                const encryptedData = JSON.parse(fs.readFileSync(exports.filePath, 'utf-8'));
                const decryptedData = JSON.parse(decrypt(encryptedData));
                exports.usersPoints = decryptedData.usersPoints || {};
                exports.debilusCloset = decryptedData.debilusCloset || 0;
                exports.store = decryptedData.store || {};
                exports.purchaseHistory = decryptedData.purchaseHistory || {};
                exports.lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
                (0, log_1.log)("INFO: Data loaded successfully.");
            }
            catch (error) {
                (0, log_1.log)(`ERROR: Failed to decrypt data: ${error}`);
            }
        }
    });
}
;
const addPointsToInventory = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const timeDifference = now.getTime() - exports.lastUpdateTime.getTime();
    const cyclesPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 12));
    for (const userId in exports.usersPoints) {
        if (exports.usersPoints[userId].inventory < 15) {
            const potentialNewInventory = exports.usersPoints[userId].inventory + cyclesPassed;
            if (potentialNewInventory > 15) {
                const excessPoints = potentialNewInventory - 15;
                exports.usersPoints[userId].inventory = 15;
                exports.debilusCloset += excessPoints;
                (0, log_1.log)(`Added ${cyclesPassed} points to user ${userId}'s inventory. Excess points added to debilusCloset.`);
            }
            else {
                exports.usersPoints[userId].inventory = potentialNewInventory;
                (0, log_1.log)(`Added ${cyclesPassed} points to user ${userId}'s inventory.`);
            }
            if (exports.usersPoints[userId].inventory === 10) {
                yield (0, notification_1.sendNotification)(userId, 10);
                (0, log_1.log)(`Notification sent to user ${userId} for 10 points.`);
            }
            else if (exports.usersPoints[userId].inventory === 15) {
                yield (0, notification_1.sendNotification)(userId, 15);
                (0, log_1.log)(`Notification sent to user ${userId} for 15 points.`);
            }
            else {
                exports.debilusCloset += cyclesPassed;
                (0, log_1.log)(`Added ${cyclesPassed} points to debilusCloset for user ${userId}.`);
            }
        }
    }
    if (now.getHours() < 12) {
        exports.lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        (0, log_1.log)(`Last update time set to midnight: ${(0, notification_1.formatDate)(exports.lastUpdateTime)}`);
    }
    else {
        exports.lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
        (0, log_1.log)(`Last update time set to noon: ${(0, notification_1.formatDate)(exports.lastUpdateTime)}`);
    }
    (0, log_1.log)(`INFO: Points added to inventories where applicable. Last update time is now ${(0, notification_1.formatDate)(exports.lastUpdateTime)}.`);
    yield savePoints();
});
exports.addPointsToInventory = addPointsToInventory;
