import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const plans = await prisma.platform_plans.findMany({
            include: {
                _count: {
                    select: {
                        projects: true,
                        subscriptions: true
                    }
                }
            },
            orderBy: [
                { active: 'desc' },
                { orden: 'asc' },
                { name: 'asc' }
            ]
        });

        // Convertir Decimal a number para el frontend
        const plansFormatted = plans.map(plan => ({
            ...plan,
            price_monthly: plan.price_monthly ? Number(plan.price_monthly) : null,
            price_yearly: plan.price_yearly ? Number(plan.price_yearly) : null
        }));

        return NextResponse.json(plansFormatted);
    } catch (error) {
        console.error("Error fetching plans:", error);
        return NextResponse.json(
            { error: "Error al cargar los planes" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log("Creating plan with data:", JSON.stringify(body, null, 2));

        // Validar campos requeridos
        if (!body.name || !body.slug) {
            console.log("Validation failed: missing name or slug");
            return NextResponse.json(
                { error: "Nombre y slug son requeridos" },
                { status: 400 }
            );
        }

        // Parsear JSON fields si vienen como strings
        const planData = {
            ...body,
            features: typeof body.features === 'string' ?
                JSON.parse(body.features || '[]') : body.features,
            limits: typeof body.limits === 'string' ?
                JSON.parse(body.limits || '{}') : body.limits
        };

        console.log("Processed plan data:", JSON.stringify(planData, null, 2));

        const plan = await prisma.platform_plans.create({
            data: planData,
            include: {
                _count: {
                    select: {
                        projects: true,
                        subscriptions: true
                    }
                }
            }
        });

        console.log("Plan created successfully:", plan.id);

        // Convertir Decimal a number para el frontend
        const planFormatted = {
            ...plan,
            price_monthly: plan.price_monthly ? Number(plan.price_monthly) : null,
            price_yearly: plan.price_yearly ? Number(plan.price_yearly) : null
        };

        return NextResponse.json(planFormatted, { status: 201 });
    } catch (error) {
        console.error("Error creating plan:", error);

        // Manejo de errores específicos
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            if (error.message.includes('Unique constraint')) {
                return NextResponse.json(
                    { error: "Ya existe un plan con ese slug" },
                    { status: 409 }
                );
            }
            
            if (error.message.includes('Invalid value')) {
                return NextResponse.json(
                    { error: "Datos inválidos en el plan" },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json(
            { error: "Error al crear el plan" },
            { status: 500 }
        );
    }
}
