import { z } from "zod";

export const IdentidadUpdateSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100, "El nombre es muy largo"),
  slogan: z.string().max(200, "El slogan es muy largo").optional(),
  descripcion: z.string().max(1000, "La descripción es muy larga").optional(),
  palabras_clave: z.string().optional(),
  logoUrl: z.string().url("URL de logo inválida").optional().or(z.literal("")),
  isotipo_url: z.string().url("URL de isotipo inválida").optional().or(z.literal("")),
});

export type IdentidadUpdateForm = z.infer<typeof IdentidadUpdateSchema>;

export const PalabrasClaveUpdateSchema = z.object({
  palabras_clave: z.string().optional(),
});

export type PalabrasClaveUpdateForm = z.infer<typeof PalabrasClaveUpdateSchema>;

export const LogoUpdateSchema = z.object({
  tipo: z.enum(["logo", "isotipo"]),
  url: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type LogoUpdateForm = z.infer<typeof LogoUpdateSchema>;
