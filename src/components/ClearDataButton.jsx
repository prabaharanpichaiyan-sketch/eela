// src/components/ClearDataButton.jsx
import React from 'react';

const API_URL = '/api';

export const ClearDataButton = () => {
    const clearAllData = async () => {
        if (!window.confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            return;
        }

        try {
            console.log('Starting to clear all data...');
            const res = await fetch(`${API_URL}/clear-all`, { method: 'DELETE' });
            if (res.ok) {
                alert('✅ All data cleared successfully!');
                window.location.reload();
            } else {
                alert('Error clearing data. Check console.');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data. Check console.');
        }
    };

    return (
        <button 
            onClick={clearAllData}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '12px 24px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                zIndex: 9999
            }}
        >
            Clear All Data
        </button>
    );
};
