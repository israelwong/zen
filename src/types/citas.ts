export enum CitaTipo {
    COMERCIAL = 'COMERCIAL',
    SEGUIMIENTO = 'SEGUIMIENTO',
    CIERRE = 'CIERRE',
    POST_VENTA = 'POST_VENTA'
}

export enum CitaModalidad {
    PRESENCIAL = 'PRESENCIAL',
    VIRTUAL = 'VIRTUAL',
    TELEFONICA = 'TELEFONICA'
}

export enum CitaStatus {
    PROGRAMADA = 'PROGRAMADA',
    CONFIRMADA = 'CONFIRMADA',
    EN_CURSO = 'EN_CURSO',
    COMPLETADA = 'COMPLETADA',
    CANCELADA = 'CANCELADA',
    NO_ASISTIO = 'NO_ASISTIO'
}

export interface Cita {
    id: string
    eventoId: string
    fecha: Date
    hora: string
    tipo: CitaTipo
    modalidad: CitaModalidad
    status: CitaStatus
    asunto: string
    descripcion?: string | null
    ubicacion?: string | null
    urlVirtual?: string | null
    createdAt: Date
    updatedAt: Date
}

export interface CitaComentario {
    id: string
    citaId: string
    comentario: string
    createdAt: Date
}

export interface CitaRecordatorio {
    id: string
    citaId: string
    tiempoAnticipacion: number
    enviado: boolean
    fechaEnvio?: Date | null
    createdAt: Date
}

export interface CitaConDetalle extends Cita {
    CitaComentario: CitaComentario[]
    CitaRecordatorio: CitaRecordatorio[]
}

export interface CitaFormData {
    eventoId: string
    titulo: string
    descripcion?: string
    fechaHora: Date
    tipo: CitaTipo
    modalidad: CitaModalidad
    ubicacion?: string
    urlVirtual?: string
}
