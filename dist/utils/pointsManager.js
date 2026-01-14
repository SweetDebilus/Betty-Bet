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
exports.usersPoints = void 0;
exports.savePoints = savePoints;
exports.loadPoints = loadPoints;
const dotenv_1 = __importDefault(require("dotenv"));
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const crypto_1 = __importDefault(require("crypto"));
const log_1 = require("./log");
exports.usersPoints = {};
const algorithm = process.env.ALGO;
const secretKey = Buffer.from(process.env.KEY, 'hex');
const filePath = 'usersPoints.json';
let debilusCloset = 0;
let store = {};
let purchaseHistory = {};
let lastUpdateTime = new Date();
const encrypt = (text) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};
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
    if (!fs.existsSync('DataDebilus')) {
        fs.mkdirSync('DataDebilus');
    }
};
const saveDecryptedBackup = () => {
    try {
        createDataDebilusDir();
        const data = {
            usersPoints: exports.usersPoints,
            debilusCloset,
            store,
            purchaseHistory,
            lastUpdateTime: lastUpdateTime.toISOString()
        };
        fs.writeFileSync('DataDebilus/decrypted_backup.json', JSON.stringify(data, null, 2));
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
            debilusCloset,
            store,
            purchaseHistory,
            lastUpdateTime: lastUpdateTime.toISOString()
        };
        const encryptedData = encrypt(JSON.stringify(data));
        const maxAttempts = 3;
        let attempts = 0;
        function tryWriteFile() {
            try {
                if (fs.existsSync(filePath)) {
                    fs.accessSync(filePath, fs.constants.W_OK);
                }
                else {
                    (0, log_1.log)("WARNING: Le fichier n'existe pas, création d'un nouveau...");
                }
                fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2));
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
        if (fs.existsSync(filePath)) {
            try {
                const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const decryptedData = JSON.parse(decrypt(encryptedData));
                exports.usersPoints = decryptedData.usersPoints || {};
                debilusCloset = decryptedData.debilusCloset || 0;
                store = decryptedData.store || {};
                purchaseHistory = decryptedData.purchaseHistory || {};
                lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
                (0, log_1.log)("INFO: Data loaded successfully.");
            }
            catch (error) {
                (0, log_1.log)(`ERROR: Failed to decrypt data: ${error}`);
            }
        }
    });
}
;
