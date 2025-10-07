import { z } from "zod";
import { IdSchema } from "./shared-schemas";

// Constantes para días de la semana
export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo"
] as const;

// Schema para crear horario
export const HorarioCreateSchema = z.object({
  dia_semana: z.enum(DIAS_SEMANA, {
    message: "Día de la semana inválido"
  }),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  hora_fin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)"
  }),
  activo: z.boolean().default(true),
}).refine((data) => {
  // Validar que la hora de fin sea mayor que la hora de inicio
  const [horaInicio, minutoInicio] = data.hora_inicio.split(':').map(Number);
  const [horaFin, minutoFin] = data.hora_fin.split(':').map(Number);

  const minutosInicio = horaInicio * 60 + minutoInicio;
  const minutosFin = horaFin * 60 + minutoFin;

  return minutosFin > minutosInicio;
}, {
  message: "La hora de fin debe ser mayor que la hora de inicio",
  path: ["hora_fin"]
});

// Schema para actualizar horario
export const HorarioUpdateSchema = HorarioCreateSchema.partial().extend({
  id: IdSchema,
});

// Schema para actualizar múltiples horarios
export const HorariosBulkUpdateSchema = z.object({
  horarios: z.array(HorarioUpdateSchema),
});

// Schema para toggle de estado
export const HorarioToggleSchema = z.object({
  id: IdSchema,
  activo: z.boolean(),
});

// Schema para eliminar horario
export const HorarioDeleteSchema = z.object({
  id: IdSchema,
});

// Schema para filtros de horarios
export const HorariosFiltersSchema = z.object({
  activo: z.boolean().optional(),
  dia_semana: z.enum(DIAS_SEMANA).optional(),
});

// Schema para estadísticas de horarios
export const HorariosStatsSchema = z.object({
  periodo: z.enum(["dia", "semana", "mes", "trimestre", "año"]).default("semana"),
});

// Schema para configuración de horarios especiales
export const HorariosEspecialesSchema = z.object({
  fecha_inicio: z.string().min(1, "Fecha de inicio requerida"),
  fecha_fin: z.string().min(1, "Fecha de fin requerida"),
  descripcion: z.string().max(200, "Descripción muy larga").optional(),
  horarios: z.array(HorarioCreateSchema),
}).refine((data) => {
  // Validar que la fecha de fin sea mayor que la fecha de inicio
  const fechaInicio = new Date(data.fecha_inicio);
  const fechaFin = new Date(data.fecha_fin);

  return fechaFin > fechaInicio;
}, {
  message: "La fecha de fin debe ser mayor que la fecha de inicio",
  path: ["fecha_fin"]
});

// Schema para zona horaria
export const ZonaHorariaSchema = z.object({
  zona_horaria: z.string().default("America/Mexico_City"),
});

// Tipos derivados
export type DiaSemana = (typeof DIAS_SEMANA)[number];
export type HorarioCreateForm = z.infer<typeof HorarioCreateSchema>;
export type HorarioUpdateForm = z.infer<typeof HorarioUpdateSchema>;
export type HorariosBulkUpdateForm = z.infer<typeof HorariosBulkUpdateSchema>;
export type HorarioToggleForm = z.infer<typeof HorarioToggleSchema>;
export type HorarioDeleteForm = z.infer<typeof HorarioDeleteSchema>;
export type HorariosFiltersForm = z.infer<typeof HorariosFiltersSchema>;
export type HorariosStatsForm = z.infer<typeof HorariosStatsSchema>;
export type HorariosEspecialesForm = z.infer<typeof HorariosEspecialesSchema>;
export type ZonaHorariaForm = z.infer<typeof ZonaHorariaSchema>;

// Constantes para días de la semana con labels
export const DIAS_SEMANA_LABELS = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo"
} as const;

// Función para obtener label del día
export function getDiaSemanaLabel(dia: DiaSemana): string {
  return DIAS_SEMANA_LABELS[dia];
}

// Función para validar horario
export function validateHorario(horaInicio: string, horaFin: string): boolean {
  const [horaInicioNum, minutoInicio] = horaInicio.split(':').map(Number);
  const [horaFinNum, minutoFin] = horaFin.split(':').map(Number);

  const minutosInicio = horaInicioNum * 60 + minutoInicio;
  const minutosFin = horaFinNum * 60 + minutoFin;

  return minutosFin > minutosInicio;
}

// Función para formatear hora
export function formatHora(hora: string): string {
  const [horaNum, minuto] = hora.split(':');
  const horaFormateada = horaNum.padStart(2, '0');
  return `${horaFormateada}:${minuto}`;
}
