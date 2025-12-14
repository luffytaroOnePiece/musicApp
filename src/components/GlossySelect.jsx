import React, { useState, useRef, useEffect } from 'react';
import '../styles/GlossySelect.css';

const GlossySelect = ({ value, onChange, options, label, placeholder = "Select..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue) => {
        // Construct a fake event object to maintain compatibility with existing handlers if needed,
        // or just pass the value. The existing handlers in ZenMode use e.target.value.
        // Let's mimic that structure for minimal refactor in parent,
        // OR changing the parent handler is cleaner.
        // Let's change parent handler to accept value directly or mimic event.
        // To be safe and compatible with standard React event patterns often expected:
        const event = {
            target: {
                value: optionValue
            }
        };
        onChange(event);
        setIsOpen(false);
    };

    // Find the label for the current selected value
    const getSelectedLabel = () => {
        // If options are objects with { name, value } or similar, or just index mapping
        // based on the usage in ZenMode, options seems to be an array of objects,
        // but the value passed in is an INDEX.
        // Let's look at ZenMode usage:
        // value={selectedLwpIndex} -> this is an number
        // options mapping: <option value={idx}>{lwp.name}</option>
        // So options passed to this component should probably be the data array directly?
        // Or I can map it before passing.
        // Let's make this component flexible.
        // If options is Array of objects, we need to know which key is label and which is value.
        // Or simpler: The parent passes `options` as an array of { label, value }.

        const selectedOption = options.find(opt => opt.value === value);
        return selectedOption ? selectedOption.label : placeholder;
    };

    return (
        <div className="glossy-select-container" ref={dropdownRef}>
            {label && <label className="glossy-select-label">{label}</label>}

            <div
                className={`glossy-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="glossy-select-value">{getSelectedLabel()}</span>
                <span className="glossy-select-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className="glossy-select-dropdown">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            className={`glossy-select-option ${opt.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {opt.label}
                            {opt.value === value && (
                                <span className="glossy-check">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlossySelect;
