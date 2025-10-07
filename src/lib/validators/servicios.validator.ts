// src/lib/validators/servicios.validator.ts

import { BaseValidator } from './base-validator';
import { ValidationResult } from '@/types/setup-validation';

export class ServiciosValidator extends BaseValidator {
    async validate(projectData: unknown): Promise<ValidationResult> {

        const completedFields: string[] = [];
        const missingFields: string[] = [];
        const errors: string[] = [];

        let completionPercentage = 0;

        // Validar servicios
        if (projectData && typeof projectData === 'object' && 'servicios' in projectData) {
            const data = projectData as Record<string, unknown>;
            const servicios = data.servicios;

            if (Array.isArray(servicios)) {
                const activeServicios = servicios.filter((servicio: unknown) => {
                    if (servicio && typeof servicio === 'object' && 'status' in servicio) {
                        const servicioData = servicio as Record<string, unknown>;
                        return servicioData.status === 'active';
                    }
                    return false;
                });

                if (activeServicios.length > 0) {
                    completedFields.push('servicios');

                    let validServicios = 0;

                    for (const servicio of activeServicios) {
                        let isValidServicio = true;
                        const servicioData = servicio as Record<string, unknown>;
                        const nombre = servicioData.nombre;
                        const precio = servicioData.precio;

                        // Validar campos básicos
                        if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
                            errors.push('Servicio sin nombre configurado');
                            isValidServicio = false;
                        }

                        // Validar precio
                        if (typeof precio !== 'number' || precio <= 0) {
                            const nombreServicio = typeof nombre === 'string' ? nombre : 'Sin nombre';
                            errors.push(`Precio inválido para el servicio: ${nombreServicio}`);
                            isValidServicio = false;
                        }

                        if (isValidServicio) {
                            validServicios++;
                        }
                    }

                    // Calcular porcentaje basado en servicios válidos
                    if (validServicios > 0) {
                        completionPercentage = Math.min(100, 50 + (validServicios * 10)); // Base 50% + 10% por servicio válido
                    } else {
                        completionPercentage = 25; // Configurado pero sin servicios válidos
                    }
                } else {
                    missingFields.push('servicios_activos');
                    completionPercentage = 10; // Configurado pero sin servicios activos
                }
            } else {
                missingFields.push('servicios');
                completionPercentage = 0;
            }
        } else {
            missingFields.push('servicios');
            completionPercentage = 0;
        }

        return {
            isValid: errors.length === 0 && completionPercentage >= 50,
            completionPercentage,
            completedFields,
            missingFields,
            errors
        };
    }
}
