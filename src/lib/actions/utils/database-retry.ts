import { APP_CONFIG } from "../constants/config";

export interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
}

export async function retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = APP_CONFIG.MAX_RETRIES,
        baseDelay = APP_CONFIG.BASE_DELAY,
        maxDelay = APP_CONFIG.MAX_DELAY
    } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                console.error(
                    `Operación falló después de ${maxRetries} intentos:`,
                    error
                );
                throw error;
            }

            // Backoff exponencial
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
            await new Promise((resolve) => setTimeout(resolve, delay));

            console.warn(`Intento ${attempt} falló, reintentando en ${delay}ms...`);
        }
    }

    throw new Error("Operación falló después de todos los reintentos");
}

// Función para operaciones críticas con logging
export async function retryCriticalOperation<T>(
    operation: () => Promise<T>,
    context: string,
    options: RetryOptions = {}
): Promise<T> {
    const startTime = Date.now();

    try {
        const result = await retryDatabaseOperation(operation, options);
        const duration = Date.now() - startTime;

        console.log(`✅ Operación crítica exitosa: ${context} (${duration}ms)`);
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Operación crítica falló: ${context} (${duration}ms)`, error);
        throw error;
    }
}

// Función para operaciones en lote
export async function retryBatchOperation<T>(
    operations: (() => Promise<T>)[],
    options: RetryOptions = {}
): Promise<T[]> {
    const results: T[] = [];

    for (const operation of operations) {
        try {
            const result = await retryDatabaseOperation(operation, options);
            results.push(result);
        } catch (error) {
            console.error("Error en operación de lote:", error);
            throw error;
        }
    }

    return results;
}
