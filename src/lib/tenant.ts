import { createContext, useContext } from "react";
import { studios, platform_plans } from "@prisma/client";

// Usar los tipos generados por Prisma
type StudioWithPlan = studios & {
    plan: platform_plans;
    _count?: {
        eventos: number;
    };
};

interface TenantContextType {
    studio: StudioWithPlan | null;
    isLoading: boolean;
    canCreateProject: boolean;
    projectsRemaining: number;
}

export const TenantContext = createContext<TenantContextType>({
    studio: null,
    isLoading: true,
    canCreateProject: false,
    projectsRemaining: 0,
});

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
};

export async function getStudioBySlug(
    slug: string
): Promise<StudioWithPlan | null> {
    try {
        const { prisma } = await import("@/lib/prisma");

        const studio = await prisma.studios.findUnique({
            where: { slug },
            include: {
                plan: true,
                _count: {
                    select: {
                        eventos: {
                            where: {
                                status: "active",
                            },
                        },
                    },
                },
            },
        });

        return studio as StudioWithPlan;
    } catch (error) {
        console.error("Error fetching studio:", error);
        return null;
    }
}
