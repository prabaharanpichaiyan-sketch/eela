import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 24, text = 'Loading...', fullScreen = false }) => {
    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--color-primary)' }}>
            <Loader2 className="spin" size={size} />
            {text && <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#6b7280' }}>{text}</div>}
        </div>
    );

    if (fullScreen) {
        return (
            <div style={{ 
                position: 'fixed', 
                top: 0, left: 0, right: 0, bottom: 0, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 9999
            }}>
                {content}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            {content}
        </div>
    );
};

export default Loader;
