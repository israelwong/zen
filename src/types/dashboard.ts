// types/dashboard.ts
export interface EventoResumen {
    id: string
    nombre: string | null
    fecha_evento: Date
    sede: string | null
    direccion: string | null
    cliente_nombre: string
    etapa_nombre: string
    etapa_color: string | null
}

export interface BalanceFinanciero {
    totalFacturado: number
    totalPagado: number
    totalPendiente: number
    porcentajePagado: number
    pagosPendientes: PagoPendiente[]
    pagosVencidos: PagoVencido[]
}

export interface PagoPendiente {
    id: string
    monto: number
    concepto?: string
    eventoId: string
    evento_nombre: string
    cliente_nombre: string
    fecha_evento: Date
    fecha_vencimiento?: Date | null
    diasDespuesEvento?: number // Para pagos pendientes después del evento
    esPendienteRemanente?: boolean // Flag para identificar pagos remanentes
}

export interface PagoVencido extends PagoPendiente {
    diasVencido: number
}

export interface ProspectoNuevo {
    id: string
    nombre: string
    telefono: string | null
    email: string | null
    createdAt: Date
    evento_nombre: string | null
    evento_fecha: Date | null
    tipo_evento: string | null
    etapa_nombre: string | null
    canalId: string | null
    canal_nombre: string | null
}

export interface EtapaDistribucion {
    etapa_id: string
    etapa_nombre: string
    etapa_color: string | null
    total_eventos: number
    porcentaje: number
}

export interface CitaProxima {
    id: string
    fecha: Date
    hora: string
    tipo: string
    modalidad: string
    status: string
    asunto: string
    ubicacion: string | null
    urlVirtual: string | null
    eventoId: string
    evento_nombre: string | null
    cliente_nombre: string
    requiere_confirmacion: boolean
}

export interface MetricasRendimiento {
    conversionRate: number // % de cotizaciones que se convierten en ventas
    tiempoPromedioCierre: number // días promedio para cerrar
    eventoMasPopular: {
        tipo: string
        cantidad: number
        porcentaje: number
    }
    efectividadCitas: number // % de citas que resultan en avance
    tendenciaMensual: {
        cambio: number // % de cambio vs mes anterior
        direccion: 'up' | 'down' | 'stable'
    }
    fuenteLeadMasEfectiva: {
        canal: string
        conversion: number
    }
}

export interface DashboardData {
    /** Items de la agenda del mes actual */
    eventosDelMes: EventoResumen[]
    balanceFinanciero: BalanceFinanciero
    prospectosNuevos: ProspectoNuevo[]
    distribucionEtapas: EtapaDistribucion[]
    citasProximas: CitaProxima[]
    metricasRendimiento: MetricasRendimiento
    ultimaActualizacion: Date
}

export interface DashboardStats {
    totalEventosActivos: number
    totalEventosMes: number
    totalProspectosMes: number
    totalCitasSemana: number
    alertasPendientes: number
}
