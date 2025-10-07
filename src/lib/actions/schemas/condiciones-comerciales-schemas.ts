// Ruta: src/lib/actions/schemas/condiciones-comerciales-schemas.ts

import { z } from 'zod';

export const CondicionComercialSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    descripcion: z.string().nullable().optional(),

    // Tratamos los números como strings para el formulario
    porcentaje_descuento: z.string().nullable().optional(),
    porcentaje_anticipo: z.string().nullable().optional(),

    status: z.enum(['active', 'inactive']),
    orden: z.number(),
});

// Schema con validaciones personalizadas que requiere sobreprecio
export const CondicionComercialWithValidationSchema = z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    descripcion: z.string().nullable().optional(),

    // Tratamos los números como strings para el formulario
    porcentaje_descuento: z.string().nullable().optional(),
    porcentaje_anticipo: z.string().nullable().optional(),

    status: z.enum(['active', 'inactive']),
    orden: z.number(),
}).refine((data) => {
    // Validar que el descuento no sea mayor al sobreprecio
    if (data.porcentaje_descuento) {
        const descuento = parseFloat(data.porcentaje_descuento);
        return descuento >= 0 && descuento <= 100;
    }
    return true;
}, {
    message: "El descuento debe estar entre 0 y 100%",
    path: ["porcentaje_descuento"]
}).refine((data) => {
    // Validar que el anticipo no sea mayor a 100%
    if (data.porcentaje_anticipo) {
        const anticipo = parseFloat(data.porcentaje_anticipo);
        return anticipo >= 0 && anticipo <= 100;
    }
    return true;
}, {
    message: "El anticipo debe estar entre 0 y 100%",
    path: ["porcentaje_anticipo"]
});

// Schema con validación de sobreprecio (para usar en el componente)
export const createCondicionComercialSchema = (sobreprecio: number) => z.object({
    id: z.string().optional(),
    nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
    descripcion: z.string().nullable().optional(),

    // Tratamos los números como strings para el formulario
    porcentaje_descuento: z.string().nullable().optional(),
    porcentaje_anticipo: z.string().nullable().optional(),

    status: z.enum(['active', 'inactive']),
    orden: z.number(),
}).refine((data) => {
    // Validar que el descuento no sea mayor al sobreprecio
    if (data.porcentaje_descuento) {
        const descuento = parseFloat(data.porcentaje_descuento);
        const maxDescuento = sobreprecio > 0 ? Math.round(sobreprecio * 100) : 100;
        return descuento >= 0 && descuento <= maxDescuento;
    }
    return true;
}, {
    message: `El descuento no puede ser mayor al ${sobreprecio > 0 ? Math.round(sobreprecio * 100) : 100}% (sobreprecio configurado)`,
    path: ["porcentaje_descuento"]
}).refine((data) => {
    // Validar que el anticipo no sea mayor a 100%
    if (data.porcentaje_anticipo) {
        const anticipo = parseFloat(data.porcentaje_anticipo);
        return anticipo >= 0 && anticipo <= 100;
    }
    return true;
}, {
    message: "El anticipo debe estar entre 0 y 100%",
    path: ["porcentaje_anticipo"]
});

export type CondicionComercialForm = z.infer<typeof CondicionComercialSchema>;

// Schema para actualización masiva
export const CondicionesComercialesBulkSchema = z.object({
    condiciones: z.array(CondicionComercialSchema),
});

export type CondicionesComercialesBulkForm = z.infer<typeof CondicionesComercialesBulkSchema>;
