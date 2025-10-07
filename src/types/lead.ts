export interface Lead {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
    nombreEstudio?: string;
    slugEstudio?: string;

    // Ciclo de vida CRM
    etapaId?: string; // ID de la etapa del pipeline
    prioridad: 'baja' | 'media' | 'alta';
    fechaUltimoContacto?: Date;
    notasConversacion?: string;

    // Plan de interés
    planInteres?: string;
    presupuestoMensual?: number;
    fechaProbableInicio?: Date;

    // Asignación comercial
    agentId?: string;
    agent?: {
        id: string;
        nombre: string;
        email: string;
    };

    // Metadatos
    createdAt: Date;
    updatedAt: Date;
}

export interface LeadFormData {
    nombre: string;
    email: string;
    telefono: string;
    nombreEstudio?: string;
    slugEstudio?: string;
    planInteres?: string;
    presupuestoMensual?: number;
    fechaProbableInicio?: Date;
    notasConversacion?: string;
}

export interface LeadUpdateData {
    etapaId?: string;
    prioridad?: Lead['prioridad'];
    agentId?: string;
    fechaUltimoContacto?: Date;
    notasConversacion?: string;
    planInteres?: string;
    presupuestoMensual?: number;
    fechaProbableInicio?: Date;
}
