// src/lib/validators/precios.validator.ts

import { BaseValidator } from './base-validator';
import { ValidationResult } from '@/types/setup-validation';

export class PreciosValidator extends BaseValidator {
    async validate(projectData: unknown): Promise<ValidationResult> {
        const completedFields: string[] = [];
        const missingFields: string[] = [];
        const errors: string[] = [];

        let completionPercentage = 0;

        // Validar configuraciones de precios
        if (projectData && typeof projectData === 'object' && 'configuraciones' in projectData) {
            const data = projectData as Record<string, unknown>;
            const configuraciones = data.configuraciones;

            if (Array.isArray(configuraciones)) {
                const preciosConfig = configuraciones.find((config: unknown) => {
                    if (config && typeof config === 'object' && 'tipo' in config) {
                        const configData = config as Record<string, unknown>;
                        const tipo = configData.tipo;
                        return tipo === 'precios' || tipo === 'precios_utilidad';
                    }
                    return false;
                });

                if (preciosConfig) {
                    completedFields.push('configuraciones');

                    // Validar campos específicos de precios
                    const preciosConfigData = preciosConfig as Record<string, unknown>;
                    const configuracion = preciosConfigData.configuracion;
                    const configData = (configuracion && typeof configuracion === 'object')
                        ? configuracion as Record<string, unknown>
                        : {};
                    let fieldsValidated = 0;
                    const totalFields = 3; // utilidad_base, sobreprecio, descuento_maximo

                    const utilidadBase = configData.utilidad_base;
                    if (typeof utilidadBase === 'number' && utilidadBase > 0) {
                        fieldsValidated++;
                    } else {
                        errors.push('La utilidad base debe ser mayor a 0');
                    }

                    const sobreprecio = configData.sobreprecio;
                    if (typeof sobreprecio === 'number' && sobreprecio >= 0) {
                        fieldsValidated++;
                    }

                    const descuentoMaximo = configData.descuento_maximo;
                    if (typeof descuentoMaximo === 'number' && descuentoMaximo >= 0) {
                        fieldsValidated++;
                    }

                    completionPercentage = Math.round((fieldsValidated / totalFields) * 100);
                } else {
                    missingFields.push('configuracion_precios');
                    completionPercentage = 0;
                }
            } else {
                missingFields.push('configuraciones');
                completionPercentage = 0;
            }
        } else {
            missingFields.push('configuraciones');
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
