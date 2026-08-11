import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  id: string | number;
  name: string;
  tokenPrefix?: string;
  counterName?: string;
  status?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search & select PF issue...",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id.toString() === value);

  const filteredOptions = options.filter((opt) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const matchName = opt.name.toLowerCase().includes(query);
    const matchPrefix = opt.tokenPrefix ? opt.tokenPrefix.toLowerCase().includes(query) : false;
    const matchCounter = opt.counterName ? opt.counterName.toLowerCase().includes(query) : false;
    return matchName || matchPrefix || matchCounter;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Hidden native select for form validation requirement */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required={required}
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }}
        />
      )}

      {/* Main Select Button Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          border: isOpen ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
          borderRadius: '0.6rem',
          padding: '12px 16px',
          color: '#0f172a',
          fontSize: '0.92rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: isOpen ? '0 0 0 3px rgba(29, 78, 216, 0.15)' : 'none',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? (
            <span>
              {selectedOption.tokenPrefix && (
                <strong style={{ color: '#1d4ed8', marginRight: '6px' }}>
                  [{selectedOption.tokenPrefix}]
                </strong>
              )}
              {selectedOption.name}
              {selectedOption.counterName && (
                <span style={{ color: '#64748b', fontSize: '0.82rem', marginLeft: '6px' }}>
                  → ({selectedOption.counterName})
                </span>
              )}
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>{placeholder}</span>
          )}
        </span>
        <ChevronDown size={18} style={{ color: '#64748b', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </div>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div
          className="animate-fade"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 500,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            boxShadow: '0 15px 35px rgba(15, 23, 42, 0.15)',
            padding: '10px',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* Search Filter Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search PF Issue by name or prefix..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                padding: '8px 12px 8px 34px',
                fontSize: '0.85rem',
                backgroundColor: '#f8fafc',
                borderRadius: '6px'
              }}
            />
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No PF issues match "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id.toString() === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      onChange(opt.id.toString());
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#1e40af' : '#0f172a',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {opt.tokenPrefix && (
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace' }}>
                          {opt.tokenPrefix}
                        </span>
                      )}
                      <span style={{ fontWeight: isSelected ? 700 : 500 }}>{opt.name}</span>
                      {opt.counterName && (
                        <span style={{ color: '#64748b', fontSize: '0.78rem' }}>({opt.counterName})</span>
                      )}
                    </div>
                    {isSelected && <Check size={16} style={{ color: '#1d4ed8', flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
