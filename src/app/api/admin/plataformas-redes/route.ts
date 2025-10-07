import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry, getFriendlyErrorMessage } from '@/lib/database/retry-helper';

// GET - Obtener todas las plataformas de redes sociales
export async function GET() {
  try {
    const plataformas = await withRetry(async () => {
      return await prisma.platform_social_networks.findMany({
        orderBy: {
          order: 'asc'
        }
      });
    });

    return NextResponse.json(plataformas);
  } catch (error) {
    console.error('Error fetching plataformas redes sociales:', error);
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST - Crear nueva plataforma de red social
export async function POST(request: NextRequest) {
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

    // Verificar que el slug sea único
    const existingSlug = await prisma.platform_social_networks.findUnique({
      where: { slug }
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'El slug ya existe. Debe ser único.' },
        { status: 400 }
      );
    }

    const plataforma = await withRetry(async () => {
      return await prisma.platform_social_networks.create({
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

    return NextResponse.json(plataforma, { status: 201 });
  } catch (error) {
    console.error('Error creating plataforma red social:', error);
    return NextResponse.json(
      { error: getFriendlyErrorMessage(error) },
      { status: 500 }
    );
  }
}