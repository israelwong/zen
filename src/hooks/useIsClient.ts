import { useState, useEffect } from 'react';

/**
 * Hook para detectar si estamos en el cliente (post-hidratación)
 * Útil para evitar errores de hidratación con componentes que generan IDs dinámicos
 */
export function useIsClient() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
}
