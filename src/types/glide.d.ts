// Declaración de tipos para @glidejs/glide
declare module '@glidejs/glide' {
    interface GlideOptions {
        type?: 'slider' | 'carousel'
        startAt?: number
        perView?: number
        focusAt?: number | 'center'
        gap?: number
        autoplay?: number | boolean
        hoverpause?: boolean
        keyboard?: boolean
        bound?: boolean
        swipeThreshold?: number | boolean
        dragThreshold?: number | boolean
        perTouch?: number | boolean
        touchRatio?: number
        touchAngle?: number
        animationDuration?: number
        animationTimingFunc?: string
        direction?: 'ltr' | 'rtl'
        peek?: number | { before?: number; after?: number }
        breakpoints?: {
            [key: number]: Partial<GlideOptions>
        }
        classes?: {
            direction?: {
                ltr?: string
                rtl?: string
            }
            slider?: string
            carousel?: string
            swipeable?: string
            dragging?: string
            cloneSlide?: string
            activeNav?: string
            activeSlide?: string
            disabledArrow?: string
        }
        throttle?: number
        data?: string
    }

    class Glide {
        constructor(selector: string | Element, options?: GlideOptions)
        mount(extensions?: object): Glide
        mutate(transformers?: Array<(Glide: Glide, Components: object, Events: object) => void>): Glide
        destroy(): void
        update(settings?: GlideOptions): void
        go(pattern: string): void
        move(distance: number): void
        disable(): void
        enable(): void
        on(event: string | Array<string>, handler: (...args: unknown[]) => void): void
        isType(name: string): boolean
        play(interval?: number | boolean): void
        pause(): void
        disable(): void
        enable(): void
        readonly index: number
        readonly type: string
        readonly disabled: boolean
        readonly settings: GlideOptions
    }

    export = Glide
}
