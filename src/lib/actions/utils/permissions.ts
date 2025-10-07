import { ROLE_PERMISSIONS, hasPermission } from "../constants/roles";
import { prisma } from "@/lib/prisma";

export async function verificarPermisos(
    userId: string,
    resource: string,
    action: string
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) return false;

        return hasPermission(user.role, resource, action);
    } catch (error) {
        console.error("Error verificando permisos:", error);
        return false;
    }
}

export async function verificarStudioAcceso(
    userId: string,
    studioSlug: string
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: true,
                studio: true,
            },
        });

        if (!user) return false;

        // Super admin tiene acceso a todos los studios
        if (user.role === "super_admin") return true;

        // Agente tiene acceso a studios asignados
        if (user.role === "agente") {
            const studio = await prisma.proSocialStudio.findUnique({
                where: { slug: studioSlug },
                include: { agentes: true },
            });

            return studio?.agentes.some((agente) => agente.id === userId) || false;
        }

        // Suscriptor solo tiene acceso a su propio studio
        if (user.role === "suscriptor") {
            return user.studio?.slug === studioSlug;
        }

        return false;
    } catch (error) {
        console.error("Error verificando acceso al studio:", error);
        return false;
    }
}

export async function verificarLeadAcceso(
    userId: string,
    leadId: string
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, studio: true },
        });

        if (!user) return false;

        // Super admin tiene acceso a todos los leads
        if (user.role === "super_admin") return true;

        // Obtener el lead
        const lead = await prisma.proSocialLead.findUnique({
            where: { id: leadId },
            include: { studio: true },
        });

        if (!lead) return false;

        // Agente tiene acceso a leads de studios asignados
        if (user.role === "agente") {
            const studio = await prisma.proSocialStudio.findUnique({
                where: { id: lead.studioId },
                include: { agentes: true },
            });

            return studio?.agentes.some((agente) => agente.id === userId) || false;
        }

        // Suscriptor solo tiene acceso a leads de su studio
        if (user.role === "suscriptor") {
            return user.studio?.id === lead.studioId;
        }

        return false;
    } catch (error) {
        console.error("Error verificando acceso al lead:", error);
        return false;
    }
}

export async function verificarClienteAcceso(
    userId: string,
    clienteId: string
): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, studio: true },
        });

        if (!user) return false;

        // Super admin tiene acceso a todos los clientes
        if (user.role === "super_admin") return true;

        // Obtener el cliente
        const cliente = await prisma.proSocialCliente.findUnique({
            where: { id: clienteId },
            include: { studio: true },
        });

        if (!cliente) return false;

        // Agente tiene acceso a clientes de studios asignados
        if (user.role === "agente") {
            const studio = await prisma.proSocialStudio.findUnique({
                where: { id: cliente.studioId },
                include: { agentes: true },
            });

            return studio?.agentes.some((agente) => agente.id === userId) || false;
        }

        // Suscriptor solo tiene acceso a clientes de su studio
        if (user.role === "suscriptor") {
            return user.studio?.id === cliente.studioId;
        }

        return false;
    } catch (error) {
        console.error("Error verificando acceso al cliente:", error);
        return false;
    }
}

export async function obtenerPermisosUsuario(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) return {};

        return ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || {};
    } catch (error) {
        console.error("Error obteniendo permisos del usuario:", error);
        return {};
    }
}

export async function verificarAccesoRecurso(
    userId: string,
    resourceType: string,
    resourceId: string
): Promise<boolean> {
    switch (resourceType) {
        case "studio":
            const studio = await prisma.proSocialStudio.findUnique({
                where: { id: resourceId },
                select: { slug: true },
            });
            return studio ? verificarStudioAcceso(userId, studio.slug) : false;

        case "lead":
            return verificarLeadAcceso(userId, resourceId);

        case "cliente":
            return verificarClienteAcceso(userId, resourceId);

        default:
            return false;
    }
}
