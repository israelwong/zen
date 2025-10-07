/**
 * Pricing Utilities - Cálculo dinámico de precios
 * 
 * Estos helpers calculan precios al vuelo usando la configuración del estudio.
 * Los valores NO se almacenan en project_servicios, solo se calculan cuando se necesitan.
 * 
 * Para cotizaciones, los precios SÍ se congelan al momento de crear la cotización.
 */

/**
 * FACTOR DE SEGURIDAD: Porcentaje adicional para garantizar utilidad mínima
 * 
 * Este factor compensa la pérdida de utilidad cuando se aplican descuentos máximos.
 * Con descuento máximo (sobreprecio) + comisión, la utilidad puede bajar ~1.3%.
 * Este factor asegura que la utilidad se mantenga en el porcentaje deseado.
 * 
 * Ajustar este valor si cambias los porcentajes de comisión o sobreprecio.
 */
const FACTOR_SEGURIDAD_UTILIDAD = 0.045; // 4.5% adicional para garantizar 30% mínimo

export interface PricingConfig {
    utilidad_servicio: number;
    utilidad_producto: number;
    sobreprecio: number;
    comision_venta: number;
}

export interface PricingResult {
    utilidad: number;
    precio_publico: number;
}

/**
 * Calcula utilidad y precio público de un servicio
 * 
 * @param costo - Costo base del servicio
 * @param gasto - Suma de gastos fijos
 * @param tipoUtilidad - Tipo de utilidad a aplicar ("servicio" o "producto")
 * @param config - Configuración de precios del estudio
 * @returns Objeto con utilidad y precio_publico calculados
 * 
 * @example
 * const precios = calcularPrecios(1000, 0, 'servicio', {
 *   utilidad_servicio: 30,
 *   utilidad_producto: 10,
 *   sobreprecio: 10,
 *   comision_venta: 5
 * });
 * // => { utilidad: 300.00, precio_publico: 1505.26 }
 * 
 * NOTA: El sobreprecio se aplica DESPUÉS de garantizar utilidad + comisión.
 * Esto permite dar descuentos hasta el sobreprecio sin afectar la utilidad del 30%.
 */
export function calcularPrecios(
    costo: number,
    gasto: number,
    tipoUtilidad: 'servicio' | 'producto',
    config: PricingConfig
): PricingResult {
    // 1. Determinar porcentaje de utilidad según tipo
    // Los valores vienen como porcentajes (30, 10, etc.), necesitamos fracciones (0.30, 0.10)
    const utilidadPorcentaje =
        tipoUtilidad === 'servicio'
            ? config.utilidad_servicio / 100
            : config.utilidad_producto / 100;

    const comisionPorcentaje = config.comision_venta / 100;
    const sobreprecioPorcentaje = config.sobreprecio / 100;

    // 2. Calcular utilidad base (en pesos)
    const utilidadBase = costo * utilidadPorcentaje;

    // 3. Calcular subtotal (costo + gastos + utilidad)
    const subtotal = costo + gasto + utilidadBase;

    // 4. Calcular precio base que cubre utilidad + comisión
    // Este precio GARANTIZA la utilidad incluso después de descuentos
    const denominador = 1 - comisionPorcentaje;
    const precioBase = denominador > 0
        ? subtotal / denominador
        : Infinity;

    // 5. Aplicar factor de seguridad para garantizar utilidad mínima
    // Compensa la pérdida cuando se aplican descuentos máximos + comisión
    const precioConSeguridad = precioBase * (1 + FACTOR_SEGURIDAD_UTILIDAD);

    // 6. Aplicar sobreprecio como margen de descuento
    // El sobreprecio se agrega DESPUÉS de asegurar utilidad + comisión + factor de seguridad
    // Esto permite dar descuentos hasta el sobreprecio sin afectar la utilidad del 30%
    const precioPublico = precioConSeguridad * (1 + sobreprecioPorcentaje);

    return {
        utilidad: Number(utilidadBase.toFixed(2)),
        precio_publico: Number(precioPublico.toFixed(2)),
    };
}

/**
 * Formatea un número como moneda mexicana
 * @param amount - Monto a formatear
 * @param includeDecimals - Si debe incluir decimales (default: true)
 */
export function formatCurrency(amount: number, includeDecimals = true): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: includeDecimals ? 2 : 0,
        maximumFractionDigits: includeDecimals ? 2 : 0,
    }).format(amount);
}
