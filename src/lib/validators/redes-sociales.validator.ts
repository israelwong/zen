// src/lib/validators/redes-sociales.validator.ts

import { BaseValidator } from './base-validator';
import { ValidationResult } from '@/types/setup-validation';

export class RedesSocialesValidator extends BaseValidator {
    async validate(projectData: unknown): Promise<ValidationResult> {
        const optionalFields = ['redes_sociales'];

        // Validar campos opcionales
        const optionalValidation = this.validateOptionalFields(projectData, optionalFields);

        const completedFields = optionalValidation.completed;
        const missingFields: string[] = []; // No hay campos requeridos

        // Calcular porcentaje basado en redes sociales configuradas
        let completionPercentage = 0;

        if (projectData && typeof projectData === 'object' && 'redes_sociales' in projectData) {
            const data = projectData as Record<string, unknown>;
            const redesSociales = data.redes_sociales;

            if (Array.isArray(redesSociales)) {
                const activeRedesSociales = redesSociales.filter((red: unknown) => {
                    if (red && typeof red === 'object' && 'isActive' in red && 'url' in red) {
                        const redData = red as Record<string, unknown>;
                        const isActive = redData.isActive;
                        const url = redData.url;
                        return isActive === true &&
                            typeof url === 'string' &&
                            url.trim().length > 0;
                    }
                    return false;
                });

                if (activeRedesSociales.length >= 2) {
                    completionPercentage = 100; // Al menos 2 redes sociales
                    completedFields.push('redes_sociales');
                } else if (activeRedesSociales.length === 1) {
                    completionPercentage = 50; // Solo 1 red social
                    completedFields.push('redes_sociales');
                } else {
                    completionPercentage = 0; // Sin redes sociales configuradas
                }
            }
        }

        const errors: string[] = [];

        // Validar URLs de redes sociales si existen
        if (projectData && typeof projectData === 'object' && 'redes_sociales' in projectData) {
            const data = projectData as Record<string, unknown>;
            const redesSociales = data.redes_sociales;

            if (Array.isArray(redesSociales)) {
                for (const red of redesSociales) {
                    if (red && typeof red === 'object' && 'url' in red) {
                        const redData = red as Record<string, unknown>;
                        const url = redData.url;
                        const plataforma = redData.plataforma;

                        if (typeof url === 'string' && !this.isValidUrl(url)) {
                            const plataformaName = typeof plataforma === 'string' ? plataforma : 'Desconocida';
                            errors.push(`URL inválida para la red social: ${plataformaName}`);
                        }
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            completionPercentage,
            completedFields,
            missingFields,
            errors
        };
    }

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
