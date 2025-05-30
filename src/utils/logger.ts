interface Logger {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
}

const createLogger = (): Logger => {
    const log = (level: string, message: string, ...args: any[]) => {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (args.length > 0) {
            console.log(formattedMessage, ...args);
        } else {
            console.log(formattedMessage);
        }
    };

    return {
        info: (message: string, ...args: any[]) => log('info', message, ...args),
        error: (message: string, ...args: any[]) => log('error', message, ...args),
        warn: (message: string, ...args: any[]) => log('warn', message, ...args),
        debug: (message: string, ...args: any[]) => log('debug', message, ...args)
    };
};

export const logger = createLogger();
