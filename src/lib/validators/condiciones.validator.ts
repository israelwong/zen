// src/lib/validators/condiciones.validator.ts

import { BaseValidator } from './base-validator';
import { ValidationResult } from '@/types/setup-validation';

export class CondicionesValidator extends BaseValidator {
    async validate(projectData: unknown): Promise<ValidationResult> {
        const completedFields: string[] = [];
        const missingFields: string[] = [];
        const errors: string[] = [];

        let completionPercentage = 0;

        // Validar condiciones comerciales
        if (projectData && typeof projectData === 'object' && 'condiciones_comerciales' in projectData) {
            const data = projectData as Record<string, unknown>;
            const condiciones = data.condiciones_comerciales;

            if (Array.isArray(condiciones)) {
                const activeCondiciones = condiciones.filter((condicion: unknown) => {
                    if (condicion && typeof condicion === 'object' && 'status' in condicion) {
                        return (condicion as Record<string, unknown>).status === 'active';
                    }
                    return false;
                });

                if (activeCondiciones.length > 0) {
                    completedFields.push('condiciones_comerciales');
                    completionPercentage = 100;

                    // Validar que al menos una condición tenga configuración válida
                    let validCondiciones = 0;

                    for (const condicion of activeCondiciones) {
                        const condicionData = condicion as Record<string, unknown>;
                        const nombre = condicionData.nombre;

                        if (nombre && typeof nombre === 'string' && nombre.trim().length > 0) {
                            validCondiciones++;
                        }

                        // Validar porcentajes si existen
                        const porcentajeDescuento = condicionData.porcentaje_descuento;
                        if (typeof porcentajeDescuento === 'number' &&
                            (porcentajeDescuento < 0 || porcentajeDescuento > 100)) {
                            errors.push(`Porcentaje de descuento inválido en: ${nombre || 'condición sin nombre'}`);
                        }

                        const porcentajeAnticipo = condicionData.porcentaje_anticipo;
                        if (typeof porcentajeAnticipo === 'number' &&
                            (porcentajeAnticipo < 0 || porcentajeAnticipo > 100)) {
                            errors.push(`Porcentaje de anticipo inválido en: ${nombre || 'condición sin nombre'}`);
                        }
                    }

                    if (validCondiciones === 0) {
                        errors.push('No hay condiciones comerciales válidas configuradas');
                        completionPercentage = 50;
                    }
                } else {
                    missingFields.push('condiciones_comerciales_activas');
                    completionPercentage = 25; // Configurado pero sin condiciones activas
                }
            } else {
                missingFields.push('condiciones_comerciales');
                completionPercentage = 0;
            }
        } else {
            missingFields.push('condiciones_comerciales');
            completionPercentage = 0;
        }

        return {
            isValid: errors.length === 0 && completionPercentage >= 80,
            completionPercentage,
            completedFields,
            missingFields,
            errors
        };
    }
}
