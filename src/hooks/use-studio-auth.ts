'use client'

import { useEffect, useState } from 'react'
import { createClientSupabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface StudioUser {
    id: string
    email: string
    name?: string
    avatar?: string
    studioId: string
    studioSlug: string
    studioName: string
    role: 'ADMIN' | 'EDITOR' | 'VIEWER'
    plan: {
        name: string
        type: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
        price: number
    }
}

export function useStudioAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [studioUser, setStudioUser] = useState<StudioUser | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClientSupabase()

    useEffect(() => {
        // Obtener sesión inicial
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)

            if (session?.user) {
                await fetchStudioUser(session.user.email!)
            }
            setLoading(false)
        }

        getSession()

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchStudioUser(session.user.email!)
                } else {
                    setStudioUser(null)
                }
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const fetchStudioUser = async (email: string) => {
        try {
            const response = await fetch(`/api/auth/studio-user?email=${email}`)
            if (response.ok) {
                const data = await response.json()
                setStudioUser(data)
            }
        } catch (error) {
            console.error('Error fetching studio user:', error)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { data, error }
    }

    const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })
        return { data, error }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        setStudioUser(null)
        return { error }
    }

    return {
        user,
        studioUser,
        loading,
        signIn,
        signUp,
        signOut,
    }
}
