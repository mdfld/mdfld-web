'use client';

/**
 * @file components/AddToCartButton.tsx
 * Drop-in button for ProductCard on the shop page.
 * Calls POST /api/cart/add with loading + feedback state.
 */

import { useState } from 'react';
import { ShoppingBag, Check, Loader2 } from 'lucide-react';

interface Props {
    productId: string;
    outOfStock?: boolean;
    className?: string;
    size?: number;
    label?: string;
    soldOutLabel?: string;
}

export default function AddToCartButton({ productId, outOfStock = false, className = '', size = 14, label = 'Add to Cart', soldOutLabel = 'Out of Stock' }: Props) {
    const [state, setState] = useState<'idle' | 'loading' | 'added'>('idle');

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault(); // prevent Link navigation
        e.stopPropagation();
        if (outOfStock || state !== 'idle') return;

        setState('loading');
        try {
            const res = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity: 1 }),
            });

            if (res.status === 401) {
                // Not logged in — redirect to login
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                setState('added');
                setTimeout(() => setState('idle'), 2000);
            } else {
                setState('idle');
            }
        } catch {
            setState('idle');
        }
    };

    if (outOfStock) {
        return (
            <button disabled className={className} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <ShoppingBag size={size} /> Out of Stock
            </button>
        );
    }

    return (
        <button onClick={handleAdd} disabled={state !== 'idle'} className={className}>
            <span className="flex items-center justify-center gap-3 w-full">
                {state === 'loading' && <Loader2 size={size} style={{ animation: 'spin 0.8s linear infinite' }} />}
                {state === 'added' && <Check size={size} />}
                {state === 'idle' && <ShoppingBag size={size} />}
                {state === 'loading' ? 'Adding...' : state === 'added' ? 'Added!' : label}
            </span>
        </button>
    );
}