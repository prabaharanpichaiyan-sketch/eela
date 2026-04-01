import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';

const DateRangePicker = ({ startDate, endDate, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [hoverDate, setHoverDate] = useState(null);

    useEffect(() => {
        if (startDate) {
            setCurrentMonth(new Date(startDate));
        }
    }, [startDate]);

    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        clickedDate.setHours(0, 0, 0, 0);
        const dateStr = `${clickedDate.getFullYear()}-${String(clickedDate.getMonth() + 1).padStart(2, '0')}-${String(clickedDate.getDate()).padStart(2, '0')}`;

        if (!startDate || (startDate && endDate)) {
            onChange({ start: dateStr, end: '' });
        } else {
            if (dateStr < startDate) {
                onChange({ start: dateStr, end: '' });
            } else {
                onChange({ start: startDate, end: dateStr });
                // Add a small delay then close might be nice, or leave it to parent
            }
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const isStart = startDate === dateStr;
        const isEnd = endDate === dateStr;
        const isSelected = isStart || isEnd;
        const isInRange = startDate && endDate && dateStr > startDate && dateStr < endDate;

        days.push(
            <button
                key={day}
                onClick={() => handleDateClick(day)}
                style={{
                    position: 'relative',
                    height: '36px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    zIndex: 1
                }}
            >
                {isInRange && (
                    <div style={{
                        position: 'absolute',
                        top: '4px', bottom: '4px', left: 0, right: 0,
                        background: 'rgba(156, 33, 69, 0.08)',
                        zIndex: -1
                    }} />
                )}
                {isStart && endDate && (
                    <div style={{
                        position: 'absolute',
                        top: '4px', bottom: '4px', left: '50%', right: 0,
                        background: 'rgba(156, 33, 69, 0.08)',
                        zIndex: -1
                    }} />
                )}
                 {isEnd && (
                    <div style={{
                        position: 'absolute',
                        top: '4px', bottom: '4px', left: 0, right: '50%',
                        background: 'rgba(156, 33, 69, 0.08)',
                        zIndex: -1
                    }} />
                )}
                <div style={{
                    width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected ? 'white' : isInRange ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: isSelected || isInRange ? 700 : 500,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 4px 10px rgba(156, 33, 69, 0.3)' : 'none'
                }}>
                    {day}
                </div>
            </button>
        );
    }

    return (
        <div className="animate-pop-in" style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
            width: '320px',
            padding: '20px',
            userSelect: 'none',
            border: '1px solid #f1f5f9'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handlePrevMonth} className="btn-icon" style={{ width: '32px', height: '32px' }}><ChevronLeft size={16} /></button>
                    <button onClick={handleNextMonth} className="btn-icon" style={{ width: '32px', height: '32px' }}><ChevronRight size={16} /></button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '12px' }}>
                {weekDays.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{d}</div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '2px' }}>
                {days}
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                    onClick={() => onChange({ start: '', end: '' })}
                    style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                    Clear Filter
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                         onClick={() => {
                             const today = new Date();
                             const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                             onChange({ start: todayStr, end: todayStr });
                             if (onClose) onClose();
                         }}
                         style={{ background: '#f1f5f9', color: 'var(--color-text)', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                         Today
                    </button>
                    <button 
                         onClick={onClose}
                         style={{ background: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                         Apply
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;
