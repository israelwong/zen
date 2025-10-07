// src/lib/validators/base-validator.ts

import { ValidationResult } from '@/types/setup-validation';

export abstract class BaseValidator {
    abstract validate(projectData: unknown): Promise<ValidationResult>;

    protected calculateCompletionPercentage(
        completedFields: string[],
        totalFields: string[]
    ): number {
        if (totalFields.length === 0) return 100;
        return Math.round((completedFields.length / totalFields.length) * 100);
    }

    protected checkField(
        data: unknown,
        fieldPath: string,
        isRequired: boolean = false
    ): boolean {
        const value = this.getNestedValue(data, fieldPath);

        if (isRequired && (value === null || value === undefined || value === '')) {
            return false;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        return value !== null && value !== undefined;
    }

    private getNestedValue(obj: unknown, path: string): unknown {
        return path.split('.').reduce((current: unknown, key: string) => {
            if (current && typeof current === 'object' && key in current) {
                return (current as Record<string, unknown>)[key];
            }
            return undefined;
        }, obj);
    }

    protected validateRequiredFields(
        data: unknown,
        requiredFields: string[]
    ): { completed: string[], missing: string[] } {
        const completed: string[] = [];
        const missing: string[] = [];

        for (const field of requiredFields) {
            if (this.checkField(data, field, true)) {
                completed.push(field);
            } else {
                missing.push(field);
            }
        }

        return { completed, missing };
    }

    protected validateOptionalFields(
        data: unknown,
        optionalFields: string[]
    ): { completed: string[], missing: string[] } {
        const completed: string[] = [];
        const missing: string[] = [];

        for (const field of optionalFields) {
            if (this.checkField(data, field, false)) {
                completed.push(field);
            } else {
                missing.push(field);
            }
        }

        return { completed, missing };
    }
}
