import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoverDate, setHoverDate] = useState(null);

    // Initialize current month to start date if exists, otherwise current date
    useEffect(() => {
        if (startDate) {
            setCurrentMonth(new Date(startDate));
        }
    }, []);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        clickedDate.setHours(0, 0, 0, 0);
        
        // Manual formatting to avoid timezone offset issues (ISO uses UTC)
        const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`;

        if (!startDate || (startDate && endDate)) {
            // Start new range
            onChange({ start: dateStr, end: '' });
        } else if (startDate && !endDate) {
            if (dateStr < startDate) {
                // Clicked date is before start, set as new start
                onChange({ start: dateStr, end: '' });
            } else {
                // Complete range
                onChange({ start: startDate, end: dateStr });
            }
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ width: '32px', height: '32px' }}></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
             const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
             date.setHours(0, 0, 0, 0);
             
             // Manual formatting
             const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
             
             let isSelected = false;
             let isRange = false;
             let isStart = false;
             let isEnd = false;

             if (startDate === dateStr) { isSelected = true; isStart = true; }
             if (endDate === dateStr) { isSelected = true; isEnd = true; }
             
             if (startDate && endDate) {
                if (dateStr > startDate && dateStr < endDate) isRange = true;
             }

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    style={{
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', background: 'none', cursor: 'pointer',
                        borderRadius: isStart || isEnd ? '50%' : '0',
                        backgroundColor: isSelected ? 'var(--color-primary)' : isRange ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: isSelected ? 'white' : isRange ? 'var(--color-primary)' : '#374151',
                        fontWeight: isSelected || isRange ? 600 : 400,
                        fontSize: '0.85rem'
                    }}
                    onMouseEnter={() => setHoverDate(date)}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div style={{ padding: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '300px' }}>
            {/* Header / Inputs Display */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>From</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{startDate ? new Date(startDate).toLocaleDateString() : 'dd/mm/yyyy'}</div>
                </div>
                <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>To</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{endDate ? new Date(endDate).toLocaleDateString() : 'dd/mm/yyyy'}</div>
                </div>
            </div>

            {/* Calendar Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ChevronLeft size={18} color="#6b7280" /></button>
                    <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ChevronRight size={18} color="#6b7280" /></button>
                </div>
            </div>

            {/* Week Days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px', textAlign: 'center' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{d}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '4px' }}>
                {renderCalendar()}
            </div>
            
             {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                <button 
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}
                    onClick={() => onChange({ start: '', end: '' })}
                >
                    Clear
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                     <button 
                         style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                         onClick={() => {
                             const today = new Date();
                             const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                             onChange({ start: todayStr, end: todayStr });
                         }}
                     >
                         Today
                     </button>
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;
