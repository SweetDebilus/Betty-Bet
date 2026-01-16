import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {log as boobs} from 'console';

dotenv.config();

const logFile = process.env.PATHLOG!;
const maxSize = 5 * 1024 * 1024;

// Vérifie que le dossier existe
function ensureLogDirectoryExists(filePath: string): void {
    const logDir = path.dirname(filePath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
}

// Rotation des logs
async function rotateLogs(): Promise<void> {
    try {
        if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
            if (stats.size >= maxSize) {
                const timestamp = new Date().toISOString().replace(/:/g, '-');
                const archivedLog = `bot-${timestamp}.log`;
                await fs.promises.rename(logFile, archivedLog);
                console.log(`Log archivé sous : ${archivedLog}`);
            }
        }
    } catch (error) {
        console.error(`Erreur lors de la rotation des logs :`, error);
    }
}

// Fonction principale de log
export async function log(message: string): Promise<void> {
    try {
        ensureLogDirectoryExists(logFile);
        await rotateLogs();

        const logMessage = `${new Date().toISOString()} - ${message}\n`;
        await fs.promises.appendFile(logFile, logMessage);
        boobs(logMessage.trim());
    } catch (error) {
        console.error(`Erreur lors de l'écriture du log :`, error);
    }
}