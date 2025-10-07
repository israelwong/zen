'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStudioAuth } from './use-studio-auth'

interface Client {
    id: string
    nombre: string
    email: string  // Ahora requerido
    telefono: string  // Ahora requerido
    direccion?: string
    status: string
    Evento: Array<{
        id: string
        nombre: string
        status: string
        fecha_evento: string
    }>
    createdAt: string
    updatedAt: string
}

interface CreateClientData {
    nombre: string
    email: string  // Ahora requerido
    telefono: string  // Ahora requerido
    direccion?: string
}

export function useClients() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { studioUser } = useStudioAuth()

    const fetchClients = useCallback(async () => {
        if (!studioUser) return

        try {
            setLoading(true)
            const response = await fetch('/api/clients', {
                headers: {
                    'x-studio-slug': studioUser.studioSlug
                }
            })

            if (!response.ok) {
                throw new Error('Error fetching clients')
            }

            const data = await response.json()
            setClients(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [studioUser])

    const createClient = async (clientData: CreateClientData) => {
        if (!studioUser) return null

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-studio-slug': studioUser.studioSlug
                },
                body: JSON.stringify(clientData)
            })

            if (!response.ok) {
                throw new Error('Error creating client')
            }

            const newClient = await response.json()
            setClients(prev => [newClient, ...prev])
            return newClient
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            return null
        }
    }

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    return {
        clients,
        loading,
        error,
        createClient,
        refetch: fetchClients
    }
}
