// src/app/api/studio/[slug]/setup-status/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SetupValidationService } from '@/lib/services/setup-validation.service';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = await params;

        // Obtener studio por slug
        const studio = await prisma.studios.findUnique({
            where: { slug },
            select: { id: true, studio_name: true, slug: true }
        });

        if (!studio) {
            return NextResponse.json(
                { error: 'Studio no encontrado' },
                { status: 404 }
            );
        }

        // Obtener o generar estado de configuración
        const validationService = SetupValidationService.getInstance();
        const setupStatus = await validationService.validateStudioSetup(studio.id);

        return NextResponse.json({
            success: true,
            data: {
                studio: {
                    id: studio.id,
                    name: studio.studio_name,
                    slug: studio.slug
                },
                overallProgress: setupStatus.overallProgress,
                isFullyConfigured: setupStatus.isFullyConfigured,
                sections: setupStatus.sections.map(section => ({
                    id: section.sectionId,
                    name: section.sectionName,
                    status: section.status,
                    completionPercentage: section.completionPercentage,
                    completedFields: section.completedFields,
                    missingFields: section.missingFields,
                    errors: section.errors || [],
                    completedAt: section.completedAt,
                    lastUpdatedAt: section.lastUpdatedAt
                })),
                lastValidatedAt: setupStatus.lastValidatedAt
            }
        });
    } catch (error) {
        console.error('Error getting setup status:', error);

        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = await params;
        const { force = false } = await request.json();

        // Obtener studio por slug
        const studio = await prisma.studios.findUnique({
            where: { slug },
            select: { id: true }
        });

        if (!studio) {
            return NextResponse.json(
                { error: 'Studio no encontrado' },
                { status: 404 }
            );
        }

        // Forzar revalidación del estado
        const validationService = SetupValidationService.getInstance();
        const setupStatus = await validationService.validateStudioSetup(studio.id);

        // Log de revalidación manual
        await validationService.logSetupChange(
            studio.id,
            'updated',
            'manual',
            undefined,
            { action: 'forced_revalidation', force }
        );

        return NextResponse.json({
            success: true,
            message: 'Estado de configuración actualizado',
            data: {
                overallProgress: setupStatus.overallProgress,
                isFullyConfigured: setupStatus.isFullyConfigured,
                lastValidatedAt: setupStatus.lastValidatedAt
            }
        });
    } catch (error) {
        console.error('Error updating setup status:', error);

        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
