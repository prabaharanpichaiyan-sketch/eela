import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, footer, zIndex, closeOnOverlayClick = false, maxWidth }) => {
    if (!isOpen) return null;
    
    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: zIndex || 1000 }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: maxWidth || '500px' }}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="nav-item" style={{ width: 'auto', padding: '4px' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
