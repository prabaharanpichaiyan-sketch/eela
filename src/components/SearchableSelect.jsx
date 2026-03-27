import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown } from 'lucide-react';

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    onSearchChange, 
    placeholder = "Select...",
    label,
    icon: Icon = Search,
    renderOption,
    className = "",
    disabled = false,
    required = false,
    name
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Initialize search term from known value or if it matches an option
    useEffect(() => {
        // If we have a value...
        if (value !== undefined && value !== null) {
            // Check if it matches an option
            const selectedOption = options.find(opt => {
                const optVal = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
                return String(optVal) === String(value);
            });
            
            if (selectedOption) {
                 const label = (typeof selectedOption === 'object' && selectedOption !== null) ? selectedOption.label : selectedOption;
                 setSearchTerm(label);
            } else if (onSearchChange) {
                // If custom input allowed and strictly no match, show raw value
                setSearchTerm(value);
            } else {
                setSearchTerm(''); 
            }
        } else {
            setSearchTerm('');
        }
    }, [value, options, onSearchChange]);

    const updatePosition = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside the wrapper AND outside the portal dropdown (if we could ref it, but portal clicks propagate to React tree so wrapperRef.contains might actually work if we wrap the portal content right? No, physically separate.)
            // Actually, we need to check if the target is NOT within the wrapper.
            // But clicks in the portal don't physically bubble to wrapperRef for `contains` check unless we are careful.
            // Since we rely on portal event bubbling in React, `wrapperRef.current.contains(event.target)` might return false for portal elements if checking DOM.
            // So we need to ensure clicks on the dropdown don't close it.
            
            // We can prevent this by stopping propagation on the dropdown itself.
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                 // But wait, if we click in the dropdown (in portal), it is NOT in wrapperRef.
                 // So we must handle this.
                 
                 // Solution: We don't need to check portal status if we stop propagation on the dropdown click.
                 // Then valid clicks inside dropdown won't reach this document listener? 
                 // No, document listener gets everything.
                 
                 // Better: Add a ref to the dropdown content and check that too.
            }
        };
        // Changing strategy: We will use a separate listener for document clicks that checks solely exclusion.
    }, [options, value, onSearchChange]);

    // Better Click Outside Logic for Portal
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
             const isClickInWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
             const isClickInDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
             
             if (!isClickInWrapper && !isClickInDropdown) {
                 setIsOpen(false);
                 handleBlurEffect();
             }
        };
        
        if (isOpen) {
             document.addEventListener('mousedown', handleClickOutside);
             // Also Listen to scroll/resize to close/update
             window.addEventListener('scroll', handleScrollClose, true);
             window.addEventListener('resize', handleScrollClose);
        }
        
        return () => {
             document.removeEventListener('mousedown', handleClickOutside);
             window.removeEventListener('scroll', handleScrollClose, true);
             window.removeEventListener('resize', handleScrollClose);
        };
    }, [isOpen, options, value, onSearchChange]);

    const handleScrollClose = () => {
        setIsOpen(false);
        inputRef.current?.blur(); // Simplify by blurring
    };

    const handleBlurEffect = () => {
        if (!onSearchChange) {
             const selectedOption = options.find(opt => {
                const optVal = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
                return String(optVal) === String(value);
            });
            if (selectedOption) {
                setSearchTerm((typeof selectedOption === 'object' && selectedOption !== null) ? selectedOption.label : selectedOption);
            } else {
                setSearchTerm('');
            }
        }
    };

    const filteredOptions = options.filter(opt => {
        const label = (typeof opt === 'object' && opt !== null) ? opt.label : opt;
        return String(label).toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setSearchTerm(newVal);
        setIsOpen(true);
        updatePosition(); // Update on type just in case
        
        if (onSearchChange) {
            onSearchChange(newVal);
        }
    };

    const handleInputFocus = () => {
        updatePosition();
        setIsOpen(true);
    };

    const handleOptionSelect = (opt) => {
        const val = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
        const lbl = (typeof opt === 'object' && opt !== null) ? opt.label : opt;
        
        onChange(val);
        if (onSearchChange) {
             onSearchChange(lbl);
        }
        setSearchTerm(lbl);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setSearchTerm('');
        onChange('');
        if (onSearchChange) onSearchChange('');
        inputRef.current?.focus();
        setIsOpen(true); // Re-open on clear to show options
        updatePosition();
    };

    return (
        <div className={`form-group ${className}`} ref={wrapperRef} style={{ position: 'relative', marginBottom: label ? '16px' : '0' }}>
            {label && <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem', color: '#374151' }}>{label}</label>}
            <div style={{ position: 'relative' }}>
                <Icon 
                    size={18} 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} 
                />
                
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onClick={handleInputFocus} // Also trigger on click
                    disabled={disabled}
                    required={required}
                    autoComplete="off"
                    style={{
                        width: '100%',
                        padding: '10px 36px 10px 40px', // Left for icon, Right for clear/chevron
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.95rem',
                        outline: 'none',
                        background: disabled ? '#f9fafb' : 'white',
                        cursor: disabled ? 'not-allowed' : 'text',
                        color: '#111827',
                        transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsOpen(false);
                    }}
                />
                
                <div 
                    onClick={(e) => {
                         // Toggle open if clicking the icon area
                         if (!disabled) {
                             if (isOpen) setIsOpen(false);
                             else {
                                 inputRef.current?.focus();
                                 handleInputFocus();
                             }
                         }
                    }}
                    style={{ position: 'absolute', right: '0', top: '0', bottom: '0', width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    {searchTerm && !disabled ? (
                        <button 
                            type="button"
                            onClick={handleClear}
                            tabIndex={-1}
                            style={{ 
                                background: '#e5e7eb', border: 'none', cursor: 'pointer', color: '#6b7280', 
                                padding: '2px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '18px', height: '18px'
                            }}
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                    ) : (
                         <ChevronDown size={16} style={{ color: '#9ca3af' }} />
                    )}
                </div>

                {isOpen && !disabled && createPortal(
                    <div 
                        ref={dropdownRef}
                        className="animate-fade-in" 
                        style={{
                            position: 'absolute',
                            top: dropdownPosition.top + 5,
                            left: dropdownPosition.left,
                            width: dropdownPosition.width,
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            maxHeight: '240px',
                            overflowY: 'auto',
                            zIndex: 9999, // High z-index to sit on top of modals
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                    >
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => {
                                const val = (typeof opt === 'object' && opt !== null) ? opt.value : opt;
                                const lbl = (typeof opt === 'object' && opt !== null) ? opt.label : opt;
                                const isSelected = String(val) === String(value);
                                
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleOptionSelect(opt)}
                                        style={{
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            borderBottom: idx === filteredOptions.length - 1 ? 'none' : '1px solid #f3f4f6',
                                            backgroundColor: isSelected ? '#eff6ff' : 'white',
                                            color: isSelected ? 'var(--color-primary)' : '#374151',
                                            fontWeight: isSelected ? 500 : 400,
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f9fafb';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) e.currentTarget.style.backgroundColor = 'white';
                                        }}
                                    >
                                        {renderOption ? renderOption(opt) : (
                                            <span>{lbl}</span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '16px', color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center' }}>
                                {onSearchChange ? (
                                    <span>Press Enter or click elsewhere to use "<strong>{searchTerm}</strong>"</span>
                                ) : (
                                    'No results found'
                                )}
                            </div>
                        )}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default SearchableSelect;
