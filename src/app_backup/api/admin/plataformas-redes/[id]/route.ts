import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry, getFriendlyErrorMessage } from '@/lib/database/retry-helper';

// GET - Obtener una plataforma específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plataforma = await withRetry(async () => {
      return await prisma.platform_social_networks.findUnique({
        where: { id: params.id }
      });
    });

    if (!plataforma) {
      return NextResponse.json(
        { error: 'Plataforma no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(plataforma);
  } catch (error) {
    console.error('Error fetching plataforma:', error);
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una plataforma
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();

    const nombre = formData.get('nombre') as string;
    const slug = formData.get('slug') as string;
    const descripcion = formData.get('descripcion') as string;
    const color = formData.get('color') as string;
    const icono = formData.get('icono') as string;
    const urlBase = formData.get('urlBase') as string;
    const orden = parseInt(formData.get('orden') as string) || 1;
    const isActive = formData.get('isActive') === 'true';

    // Validaciones
    if (!nombre || !slug) {
      return NextResponse.json(
        { error: 'Nombre y slug son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la plataforma existe
    const existingPlataforma = await prisma.platform_social_networks.findUnique({
      where: { id: params.id }
    });

    if (!existingPlataforma) {
      return NextResponse.json(
        { error: 'Plataforma no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el slug sea único (excluyendo la plataforma actual)
    const existingSlug = await prisma.platform_social_networks.findFirst({
      where: {
        slug,
        id: { not: params.id }
      }
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'El slug ya existe. Debe ser único.' },
        { status: 400 }
      );
    }

    const plataforma = await withRetry(async () => {
      return await prisma.platform_social_networks.update({
        where: { id: params.id },
        data: {
          name: nombre,
          slug,
          description: descripcion || null,
          color: color || null,
          icon: icono || null,
          base_url: urlBase || null,
          order: orden,
          is_active: isActive,
          updated_at: new Date()
        }
      });
    });

    return NextResponse.json(plataforma);
  } catch (error) {
    console.error('Error updating plataforma:', error);
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una plataforma
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la plataforma existe
    const existingPlataforma = await prisma.platform_social_networks.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            studio_redes_sociales: true
          }
        }
      }
    });

    if (!existingPlataforma) {
      return NextResponse.json(
        { error: 'Plataforma no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si la plataforma está en uso
    if (existingPlataforma._count.studio_redes_sociales > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la plataforma porque está siendo utilizada por uno o más estudios' },
        { status: 400 }
      );
    }

    await withRetry(async () => {
      return await prisma.platform_social_networks.delete({
        where: { id: params.id }
      });
    });

    return NextResponse.json({ message: 'Plataforma eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting plataforma:', error);
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error) },
      { status: 500 }
    );
  }
}