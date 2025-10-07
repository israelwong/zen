import Stripe from "stripe";

// Función para obtener la instancia de Stripe de manera segura
function getStripeInstance() {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not set");
    }

    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-02-24.acacia",
        typescript: true,
    });
}

// Exportar una función que retorna la instancia de Stripe
export const getStripe = getStripeInstance;

// Para compatibilidad con código existente, exportar stripe como una función
export const stripe = {
    webhooks: {
        constructEvent: (body: string, signature: string, secret: string) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.webhooks.constructEvent(body, signature, secret);
        }
    },
    products: {
        create: async (params: Stripe.ProductCreateParams) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.products.create(params);
        }
    },
    prices: {
        create: async (params: Stripe.PriceCreateParams) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.prices.create(params);
        },
        list: async (params?: Stripe.PriceListParams) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.prices.list(params);
        }
    },
    subscriptions: {
        create: async (params: Stripe.SubscriptionCreateParams) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.subscriptions.create(params);
        },
        retrieve: async (id: string) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.subscriptions.retrieve(id);
        },
        update: async (id: string, params: Stripe.SubscriptionUpdateParams) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.subscriptions.update(id, params);
        },
        cancel: async (id: string) => {
            const stripeInstance = getStripeInstance();
            return stripeInstance.subscriptions.cancel(id);
        }
    }
};

// Configuración de planes de suscripción (precios en MXN)
export const SUBSCRIPTION_PLANS = {
    basic: {
        name: "Plan Básico",
        description: "Perfecto para estudios pequeños que están comenzando",
        price_monthly: 599.00,
        price_yearly: 5990.00, // 2 meses gratis
        features: [
            "5 eventos por mes",
            "Hasta 100 clientes",
            "Soporte por email",
            "Plantillas básicas",
            "1GB de almacenamiento",
        ],
        limits: {
            events_per_month: 5,
            clients_limit: 100,
            storage_gb: 1,
            users_limit: 2,
        },
    },
    pro: {
        name: "Plan Pro",
        description: "Ideal para estudios en crecimiento",
        price_monthly: 1199.00,
        price_yearly: 11990.00, // 2 meses gratis
        features: [
            "Eventos ilimitados",
            "Hasta 500 clientes",
            "Soporte prioritario",
            "Plantillas premium",
            "10GB de almacenamiento",
            "Integraciones avanzadas",
        ],
        limits: {
            events_per_month: -1, // ilimitado
            clients_limit: 500,
            storage_gb: 10,
            users_limit: 5,
        },
    },
    enterprise: {
        name: "Plan Enterprise",
        description: "Para estudios grandes con necesidades avanzadas",
        price_monthly: 1999.00,
        price_yearly: 19990.00, // 2 meses gratis
        features: [
            "Todo lo anterior",
            "Clientes ilimitados",
            "Soporte dedicado 24/7",
            "Plantillas personalizadas",
            "100GB de almacenamiento",
            "API personalizada",
            "SLA garantizado",
        ],
        limits: {
            events_per_month: -1, // ilimitado
            clients_limit: -1, // ilimitado
            storage_gb: 100,
            users_limit: -1, // ilimitado
        },
    },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;

// Función para crear productos y precios en Stripe
export async function createStripeProducts() {
    const stripeInstance = getStripeInstance();
    const products = [];

    for (const [planKey, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
        try {
            // Crear producto
            const product = await stripeInstance.products.create({
                name: plan.name,
                description: plan.description,
                metadata: {
                    plan_type: planKey,
                },
            });

            // Crear precio mensual
            const monthlyPrice = await stripeInstance.prices.create({
                product: product.id,
                unit_amount: Math.round(plan.price_monthly * 100), // Convertir a centavos
                currency: "mxn", // Cambiar a MXN
                recurring: { interval: "month" },
                metadata: {
                    plan_type: planKey,
                    billing_interval: "month",
                },
            });

            // Crear precio anual
            const yearlyPrice = await stripeInstance.prices.create({
                product: product.id,
                unit_amount: Math.round(plan.price_yearly * 100), // Convertir a centavos
                currency: "mxn", // Cambiar a MXN
                recurring: { interval: "year" },
                metadata: {
                    plan_type: planKey,
                    billing_interval: "year",
                },
            });

            products.push({
                planKey,
                product,
                monthlyPrice,
                yearlyPrice,
            });

            console.log(`✅ Producto creado: ${plan.name}`);
        } catch (error) {
            console.error(`❌ Error creando producto ${plan.name}:`, error);
        }
    }

    return products;
}

// Función para obtener precios de un plan
export async function getPlanPrices(planType: PlanType) {
    const stripeInstance = getStripeInstance();
    const prices = await stripeInstance.prices.list({
        active: true,
    });

    // Filtrar por metadata después de obtener los precios
    const filteredPrices = prices.data.filter(p => p.metadata?.plan_type === planType);

    return {
        monthly: filteredPrices.find(p => p.metadata?.billing_interval === "month"),
        yearly: filteredPrices.find(p => p.metadata?.billing_interval === "year"),
    };
}

// Función para crear suscripción
export async function createSubscription(
    customerId: string,
    priceId: string,
    studioId: string
) {
    const stripeInstance = getStripeInstance();
    const subscription = await stripeInstance.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        billing_cycle_anchor: Math.floor(Date.now() / 1000), // Fecha actual
        proration_behavior: "create_prorations",
        metadata: {
            studio_id: studioId,
        },
        expand: ["latest_invoice.payment_intent"],
    });

    return subscription;
}

// Función para actualizar suscripción
export async function updateSubscription(
    subscriptionId: string,
    newPriceId: string
) {
    const stripeInstance = getStripeInstance();
    const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripeInstance.subscriptions.update(subscriptionId, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: newPriceId,
            },
        ],
        proration_behavior: "create_prorations",
    });

    return updatedSubscription;
}

// Función para cancelar suscripción
export async function cancelSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
}

// Función para pausar suscripción
export async function pauseSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: {
            behavior: "void",
        },
    });
    return subscription;
}

// Función para reanudar suscripción
export async function resumeSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
        pause_collection: null,
    });
    return subscription;
}
