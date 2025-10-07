// src/lib/validators/identidad.validator.ts

import { BaseValidator } from './base-validator';
import { ValidationResult } from '@/types/setup-validation';

export class IdentidadValidator extends BaseValidator {
    async validate(projectData: unknown): Promise<ValidationResult> {
        const requiredFields = ['name', 'slug'];
        const optionalFields = ['logoUrl', 'slogan', 'descripcion'];
        const allFields = [...requiredFields, ...optionalFields];

        // Validar campos requeridos
        const requiredValidation = this.validateRequiredFields(projectData, requiredFields);

        // Validar campos opcionales
        const optionalValidation = this.validateOptionalFields(projectData, optionalFields);

        // Combinar resultados
        const completedFields = [...requiredValidation.completed, ...optionalValidation.completed];
        const missingFields = requiredValidation.missing; // Solo campos requeridos cuentan como faltantes

        // Calcular porcentaje (solo campos requeridos son obligatorios)
        const completionPercentage = this.calculateCompletionPercentage(
            requiredValidation.completed,
            requiredFields
        );

        // Agregar bonus por campos opcionales completados
        const optionalBonus = Math.round((optionalValidation.completed.length / optionalFields.length) * 20);
        const finalPercentage = Math.min(100, completionPercentage + optionalBonus);

        const errors: string[] = [];

        // Validaciones específicas
        if (projectData && typeof projectData === 'object' && 'name' in projectData) {
            const data = projectData as Record<string, unknown>;
            const name = data.name;
            if (name && typeof name === 'string' && name.length < 3) {
                errors.push('El nombre del estudio debe tener al menos 3 caracteres');
            }
        }

        if (projectData && typeof projectData === 'object' && 'slug' in projectData) {
            const data = projectData as Record<string, unknown>;
            const slug = data.slug;
            if (slug && typeof slug === 'string' && !/^[a-z0-9-]+$/.test(slug)) {
                errors.push('El slug solo puede contener letras minúsculas, números y guiones');
            }
        }

        return {
            isValid: missingFields.length === 0 && errors.length === 0,
            completionPercentage: finalPercentage,
            completedFields,
            missingFields,
            errors
        };
    }
}
