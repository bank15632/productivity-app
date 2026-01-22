'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message?: string;
    isLoading: boolean;
}

export default function LoadingOverlay({ message = 'Loading...', isLoading }: LoadingOverlayProps) {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-2xl">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-blue-400 opacity-20" />
                </div>
                <p className="text-lg font-medium text-gray-700">{message}</p>
            </div>
        </div>
    );
}
