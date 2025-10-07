// src/lib/validators/contacto.validator.ts

import { BaseValidator } from './base-validator';
import { ValidationResult } from '@/types/setup-validation';

export class ContactoValidator extends BaseValidator {
    async validate(projectData: unknown): Promise<ValidationResult> {
        const requiredFields = ['email'];
        const optionalFields = ['phone', 'address', 'website'];
        const allFields = [...requiredFields, ...optionalFields];

        // Validar campos requeridos
        const requiredValidation = this.validateRequiredFields(projectData, requiredFields);

        // Validar campos opcionales
        const optionalValidation = this.validateOptionalFields(projectData, optionalFields);

        // Combinar resultados
        const completedFields = [...requiredValidation.completed, ...optionalValidation.completed];
        const missingFields = requiredValidation.missing;

        // Calcular porcentaje: campos requeridos (70%) + opcionales (30%)
        const requiredPercentage = this.calculateCompletionPercentage(
            requiredValidation.completed,
            requiredFields
        );

        const optionalPercentage = Math.round((optionalValidation.completed.length / optionalFields.length) * 30);
        const finalPercentage = Math.min(100, requiredPercentage + optionalPercentage);

        const errors: string[] = [];

        // Validaciones específicas
        if (projectData && typeof projectData === 'object' && 'email' in projectData) {
            const data = projectData as Record<string, unknown>;
            const email = data.email;
            if (email && typeof email === 'string' && !this.isValidEmail(email)) {
                errors.push('El formato del email no es válido');
            }
        }

        if (projectData && typeof projectData === 'object' && 'phone' in projectData) {
            const data = projectData as Record<string, unknown>;
            const phone = data.phone;
            if (phone && typeof phone === 'string' && !this.isValidPhone(phone)) {
                errors.push('El formato del teléfono no es válido');
            }
        }

        if (projectData && typeof projectData === 'object' && 'website' in projectData) {
            const data = projectData as Record<string, unknown>;
            const website = data.website;
            if (website && typeof website === 'string' && !this.isValidUrl(website)) {
                errors.push('El formato del sitio web no es válido');
            }
        }

        // Si hay errores, el porcentaje se ajusta pero no se fuerza a 99%
        const hasErrors = errors.length > 0;
        const adjustedPercentage = hasErrors ? Math.min(95, finalPercentage) : finalPercentage;

        return {
            isValid: missingFields.length === 0 && errors.length === 0,
            completionPercentage: adjustedPercentage,
            completedFields,
            missingFields,
            errors
        };
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPhone(phone: string): boolean {
        // Validar teléfono mexicano (10 dígitos) o internacional
        const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
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
