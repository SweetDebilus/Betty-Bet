import dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();
import crypto from 'crypto';
import { log } from '../utils/log';
import { sendNotification, formatDate } from './notification';

export let usersPoints: { [key: string]: { points: number, name: string, wins: number, losses: number, isDebilus: boolean, inventory: number, notificationsEnabled: boolean, betHistory: { betOn: string, amount: number, result: string, date: Date  }[], inventoryShop: { name: string, quantity: number }[], winMatch: number, loseMatch: number}} = {};

const algorithm = process.env.ALGO!;
const secretKey = Buffer.from(process.env.KEY!, 'hex');

export const filePath = 'src/data/usersPoints.json';
export let store: {[key: string]: {name: string, quantity: number, unitPrice: number}} = {};
export let purchaseHistory: {[key: string]: {userId: string, userName: string, itemName: string, quantity: number, totalPrice: number, timestamp: Date}} = {};
export let lastUpdateTime: Date = new Date();
export let debilusCloset: number = 0;


export function addToDebilusCloset(amount: number) {
    debilusCloset += amount;
}

export function setStore(newStore: {[key: string]: {name: string, quantity: number, unitPrice: number}}) {
    store = newStore;
}

export function setPurchaseHistory(newHistory: {[key: string]: {userId: string, userName: string, itemName: string, quantity: number, totalPrice: number, timestamp: Date}}) {
    purchaseHistory = newHistory;
}

export function setLastUpdateTime(newTime: Date) {
    lastUpdateTime = newTime;
}

export const encrypt = (text: string) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

const decrypt = (hash: { iv: string; content: string }) => {
    if (!hash || !hash.iv || !hash.content) {
        throw new Error('Invalid data to decrypt');
    }

    const iv = Buffer.from(hash.iv, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrypted.toString();
};

const createDataDebilusDir = () => {
    if (!fs.existsSync('src/data')) {
        fs.mkdirSync('src/data');
    }
};

const saveDecryptedBackup = () => {
    try{
        createDataDebilusDir();

        const data = {
            usersPoints,
            debilusCloset,
            store,
            purchaseHistory,
            lastUpdateTime: lastUpdateTime.toISOString()
        };
        fs.writeFileSync('src/data/decrypted_backup.json', JSON.stringify(data, null, 2));
        log("INFO: Decrypted backup data saved.");
    } catch (error) {
        log(`ERROR: Error saving points: ${error}`)
    }
};

export async function savePoints() { 
    const data = {
        usersPoints,
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
            } else {
                log("WARNING: Le fichier n'existe pas, création d'un nouveau...");
            }

            fs.writeFileSync(filePath, JSON.stringify(encryptedData, null, 2));
            log("INFO: Data saved successfully.");

            saveDecryptedBackup();
        } catch (error) {
            attempts++;
            if (attempts < maxAttempts) {
                log(`WARNING: Tentative ${attempts} échouée, nouvelle tentative dans 500ms...`);
            setTimeout(tryWriteFile, 500);
            } else {
                log("ERROR: Échec après plusieurs tentatives : " + error);
            }
        }    
    }
    tryWriteFile();
};

export async function loadPoints(): Promise<void> {
    if (fs.existsSync(filePath)) {
        try {
            const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const decryptedData = JSON.parse(decrypt(encryptedData));
            usersPoints = decryptedData.usersPoints || {};
            debilusCloset = decryptedData.debilusCloset || 0;
            store = decryptedData.store || {};
            purchaseHistory = decryptedData.purchaseHistory || {}
            lastUpdateTime = new Date(decryptedData.lastUpdateTime || Date.now());
            log("INFO: Data loaded successfully.");
        } catch (error) {
            log(`ERROR: Failed to decrypt data: ${error}`);
        }
    }
};

export const addPointsToInventory = async () => {
    const now = new Date();
    const timeDifference = now.getTime() - lastUpdateTime.getTime();
    const cyclesPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 12));

    for (const userId in usersPoints) {
        if (usersPoints[userId].inventory < 15) {
            const potentialNewInventory = usersPoints[userId].inventory + cyclesPassed;
            if (potentialNewInventory > 15) { 
                const excessPoints = potentialNewInventory - 15; 
                usersPoints[userId].inventory = 15; 
                debilusCloset += excessPoints;
                log(`Added ${cyclesPassed} points to user ${userId}'s inventory. Excess points added to debilusCloset.`);
            } else { 
                usersPoints[userId].inventory = potentialNewInventory; 
                log(`Added ${cyclesPassed} points to user ${userId}'s inventory.`);
            }

            if (usersPoints[userId].inventory === 10) {
                await sendNotification(userId, 10);
                log(`Notification sent to user ${userId} for 10 points.`);
            } else if (usersPoints[userId].inventory === 15) {
                await sendNotification(userId, 15);
                log(`Notification sent to user ${userId} for 15 points.`);
            } else {
                debilusCloset += cyclesPassed;
                log(`Added ${cyclesPassed} points to debilusCloset for user ${userId}.`);
            }
        }
    }
    if (now.getHours() < 12) {
        lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        log(`Last update time set to midnight: ${formatDate(lastUpdateTime)}`);
    } else {
        lastUpdateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
        log(`Last update time set to noon: ${formatDate(lastUpdateTime)}`);
    }
    log(`INFO: Points added to inventories where applicable. Last update time is now ${formatDate(lastUpdateTime)}.`);
    await savePoints();
};