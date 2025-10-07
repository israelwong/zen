'use client'

import { useState, useEffect, useCallback } from 'react'

interface StudioWithMetrics {
    id: string
    name: string
    slug: string
    email: string
    phone?: string
    address?: string
    subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled'
    plan: {
        name: string
        activeProjectLimit: number
    }
    _count: {
        eventos: number
        clientes: number
        cotizaciones: number
    }
    commissionRate: number
    monthlyRevenue: number
    createdAt: string
    lastActivity: string
}

interface CreateStudioData {
    name: string
    slug: string
    email: string
    phone?: string
    address?: string
    planId: string
}

export function useStudios() {
    const [studios, setStudios] = useState<StudioWithMetrics[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStudios = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/studios')

            if (!response.ok) {
                throw new Error('Error fetching studios')
            }

            const data = await response.json()
            setStudios(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [])

    const createStudio = async (studioData: CreateStudioData) => {
        try {
            const response = await fetch('/api/admin/studios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studioData)
            })

            if (!response.ok) {
                throw new Error('Error creating studio')
            }

            const newStudio = await response.json()
            setStudios(prev => [newStudio, ...prev])
            return newStudio
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            return null
        }
    }

    const updateStudio = async (id: string, studioData: Partial<CreateStudioData>) => {
        try {
            const response = await fetch(`/api/admin/studios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(studioData)
            })

            if (!response.ok) {
                throw new Error('Error updating studio')
            }

            const updatedStudio = await response.json()
            setStudios(prev =>
                prev.map(studio =>
                    studio.id === id ? updatedStudio : studio
                )
            )
            return updatedStudio
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            return null
        }
    }

    const deleteStudio = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/studios/${id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Error deleting studio')
            }

            setStudios(prev => prev.filter(studio => studio.id !== id))
            return true
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            return false
        }
    }

    useEffect(() => {
        fetchStudios()
    }, [fetchStudios])

    return {
        studios,
        loading,
        error,
        createStudio,
        updateStudio,
        deleteStudio,
        refetch: fetchStudios
    }
}
