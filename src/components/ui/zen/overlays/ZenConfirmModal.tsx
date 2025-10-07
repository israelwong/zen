'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { ZenButton } from '@/components/ui/zen';
import { AlertTriangle } from 'lucide-react';

interface ZenConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
    loading?: boolean;
}

export function ZenConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'destructive',
    loading = false
}: ZenConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700">
                <DialogHeader>
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${variant === 'destructive'
                            ? 'bg-red-900/20 text-red-400'
                            : 'bg-blue-900/20 text-blue-400'
                            }`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-white">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                {description}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <ZenButton
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        fullWidth
                        className="sm:w-auto border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    >
                        {cancelText}
                    </ZenButton>
                    <ZenButton
                        variant={variant === 'destructive' ? 'destructive' : 'primary'}
                        onClick={handleConfirm}
                        loading={loading}
                        loadingText="Procesando..."
                        fullWidth
                        className={`sm:w-auto ${variant === 'destructive'
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {confirmText}
                    </ZenButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
