"use server";

import { prisma } from "@/lib/prisma";
import { retryDatabaseOperation } from "@/lib/actions/utils/database-retry";

export interface DashboardStudio {
  id: string;
  name: string;
  slug: string;
  email: string;
  address: string | null;
  website: string | null;
  subscriptionStatus: string;
  plan: {
    name: string;
    priceMonthly: number;
  };
  _count: {
    eventos: number;
    clientes: number;
  };
}

export interface DashboardEvento {
  id: string;
  nombre: string;
  fecha_evento: Date;
  status: string;
  cliente: {
    nombre: string;
    email: string;
  } | null;
}

export interface DashboardCliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  status: string;
}

/**
 * Obtiene los datos del dashboard del studio (modo desarrollo)
 */
export async function obtenerDashboardStudio(studioSlug: string): Promise<DashboardStudio | null> {
  return await retryDatabaseOperation(async () => {
    const studio = await prisma.studios.findUnique({
      where: { slug: studioSlug },
      select: {
        id: true,
        studio_name: true,
        slug: true,
        email: true,
        address: true,
        website: true,
        subscription_status: true,
        _count: {
          select: {
            eventos: true,
            clientes: true,
          },
        },
      },
    });

    if (!studio) {
      return null;
    }

    // En modo desarrollo, usar datos por defecto
    return {
      id: studio.id,
      name: studio.studio_name,
      slug: studio.slug,
      email: studio.email,
      address: studio.address,
      website: studio.website,
      subscriptionStatus: studio.subscription_status || "active",
      plan: {
        name: "Plan Desarrollo",
        priceMonthly: 0,
      },
      _count: studio._count,
    };
  });
}

/**
 * Obtiene los eventos recientes del studio (modo desarrollo)
 */
export async function obtenerEventosRecientes(studioSlug: string): Promise<DashboardEvento[]> {
  return await retryDatabaseOperation(async () => {
    try {
      const eventos = await prisma.studio_eventos.findMany({
        where: {
          studio: { slug: studioSlug },
        },
        select: {
          id: true,
          nombre: true,
          fecha_evento: true,
          status: true,
          clientes: {
            select: {
              nombre: true,
              email: true,
            },
          },
        },
        orderBy: { fecha_evento: "desc" },
        take: 5,
      });

      return eventos.map(evento => ({
        id: evento.id,
        nombre: evento.nombre || "Evento sin nombre",
        fecha_evento: evento.fecha_evento,
        status: evento.status,
        cliente: evento.clientes ? {
          nombre: evento.clientes.nombre,
          email: evento.clientes.email,
        } : null,
      }));
    } catch {
      // En modo desarrollo, retornar array vacío si hay error
      console.log('No hay eventos disponibles en modo desarrollo');
      return [];
    }
  });
}

/**
 * Obtiene los clientes recientes del studio (modo desarrollo)
 */
export async function obtenerClientesRecientes(studioSlug: string): Promise<DashboardCliente[]> {
  return await retryDatabaseOperation(async () => {
    try {
      const clientes = await prisma.studio_clientes.findMany({
        where: {
          studio: { slug: studioSlug },
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          status: true,
        },
        orderBy: { created_at: "desc" },
        take: 5,
      });

      return clientes;
    } catch {
      // En modo desarrollo, retornar array vacío si hay error
      console.log('No hay clientes disponibles en modo desarrollo');
      return [];
    }
  });
}
