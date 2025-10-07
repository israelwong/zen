// ZEN Design System - Exports centralizados
// Importa y exporta todos los componentes ZEN para uso consistente

// =============================================================================
// BASE COMPONENTS (DISPONIBLES)
// =============================================================================
export { ZenButton, zenButtonVariants } from './base/ZenButton';
export { ZenInput } from './base/ZenInput';
export { ZenCard, ZenCardHeader, ZenCardContent, ZenCardTitle, ZenCardDescription } from './base/ZenCard';
export { ZenBadge } from './base/ZenBadge';
export { ZenLabel } from './base/ZenLabel';
export { SeparadorZen } from './SeparadorZen';

// =============================================================================
// FORM COMPONENTS (DISPONIBLES)
// =============================================================================
export { ZenTextarea } from './forms/ZenTextarea';

// =============================================================================
// MEDIA COMPONENTS (DISPONIBLES)
// =============================================================================
export { ZenAvatar, ZenAvatarImage, ZenAvatarFallback } from './media/ZenAvatar';

// =============================================================================
// LAYOUT COMPONENTS (DISPONIBLES)
// =============================================================================
export {
  ZenSidebarProvider,
  ZenSidebar,
  ZenSidebarTrigger,
  ZenSidebarContent,
  ZenSidebarHeader,
  ZenSidebarFooter,
  ZenSidebarGroup,
  ZenSidebarGroupLabel,
  ZenSidebarGroupContent,
  ZenSidebarMenu,
  ZenSidebarMenuItem,
  ZenSidebarMenuButton,
  ZenSidebarMenuSub,
  ZenSidebarMenuSubItem,
  ZenSidebarMenuSubButton,
  ZenSidebarOverlay,
  useZenSidebar
} from './layout/ZenSidebar';

export { ZenHeader } from './layout/ZenHeader';

// =============================================================================
// DESIGN TOKENS
// =============================================================================
export { ZEN_COLORS } from './tokens/colors';
export { ZEN_SPACING } from './tokens/spacing';
export { ZEN_TYPOGRAPHY } from './tokens/typography';

// =============================================================================
// TYPES (DISPONIBLES)
// =============================================================================
export type { ZenButtonProps } from './base/ZenButton';
export type { ZenInputProps } from './base/ZenInput';
export type { ZenCardProps, ZenCardHeaderProps, ZenCardContentProps, ZenCardTitleProps, ZenCardDescriptionProps } from './base/ZenCard';
export type { ZenBadgeProps } from './base/ZenBadge';
export type { ZenLabelProps } from './base/ZenLabel';
export type { ZenTextareaProps } from './forms/ZenTextarea';
export type { SeparadorZenProps } from './SeparadorZen';

// =============================================================================
// COMPONENTES PENDIENTES (comentados hasta implementación)
// =============================================================================
// export { ZenBadge } from './base/ZenBadge';
// export { ZenFormSection } from './forms/ZenFormSection';
// export { ZenSelect } from './forms/ZenSelect';
// export { ZenCheckbox } from './forms/ZenCheckbox';
// export { ZenSwitch } from './forms/ZenSwitch';
// export { ZenSidebar } from './layout/ZenSidebar';
// export { ZenNavbar } from './layout/ZenNavbar';
// export { ZenModal } from './layout/ZenModal';
// export { ZenProgressHeader } from './specialized/ZenProgressHeader';
// export { ZenConfigGrid } from './specialized/ZenConfigGrid';
// export { ZenLoadingState } from './specialized/ZenLoadingState';
// export { useZenTheme } from './hooks/useZenTheme';
// export { useZenForm } from './hooks/useZenForm';

// TYPES PENDIENTES:
// export type { ZenBadgeProps } from './base/ZenBadge';
// export type { ZenFormSectionProps } from './forms/ZenFormSection';
// export type { ZenSelectProps } from './forms/ZenSelect';
// export type { ZenCheckboxProps } from './forms/ZenCheckbox';
// export type { ZenSwitchProps } from './forms/ZenSwitch';
// export type { ZenSidebarProps } from './layout/ZenSidebar';
// export type { ZenNavbarProps } from './layout/ZenNavbar';
// export type { ZenModalProps } from './layout/ZenModal';
// export type { ZenProgressHeaderProps } from './specialized/ZenProgressHeader';
// export type { ZenConfigGridProps } from './specialized/ZenConfigGrid';
// export type { ZenLoadingStateProps } from './specialized/ZenLoadingState';
