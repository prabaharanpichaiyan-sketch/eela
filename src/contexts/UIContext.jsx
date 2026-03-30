import React, { createContext, useContext, useState, useCallback } from 'react';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Processing...');
    
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    const showLoader = useCallback((text = 'Processing...') => {
        setLoadingText(text);
        setLoading(true);
    }, []);

    const hideLoader = useCallback(() => {
        setLoading(false);
    }, []);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({
            show: true,
            message,
            type
        });
        
        // Auto-hide success notifications after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 3000);
        }
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, show: false }));
    }, []);

    return (
        <UIContext.Provider value={{ showLoader, hideLoader, showNotification }}>
            {children}
            
            {/* Global Full-Screen Loader */}
            {loading && (
                <Loader fullScreen={true} text={loadingText} size={40} />
            )}

            {/* Global Success/Error Popup */}
            <Modal
                isOpen={notification.show}
                onClose={hideNotification}
                title={notification.type === 'success' ? 'Success' : 'Error'}
                maxWidth="400px"
            >
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '20px 0',
                    textAlign: 'center'
                }}>
                    {notification.type === 'success' ? (
                        <CheckCircle2 size={48} color="#22c55e" />
                    ) : (
                        <AlertCircle size={48} color="#ef4444" />
                    )}
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{notification.message}</div>
                    <button 
                        className="primary" 
                        onClick={hideNotification}
                        style={{ marginTop: '12px', width: '100px' }}
                    >
                        OK
                    </button>
                </div>
            </Modal>
        </UIContext.Provider>
    );
};
