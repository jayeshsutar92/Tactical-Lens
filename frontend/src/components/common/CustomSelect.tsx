import {
  type FC,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  description?: string
}

export interface CustomSelectProps {
  label?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  error?: string
}

export const CustomSelect: FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  id,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('li')
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          block: 'nearest',
        })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleToggle = () => {
    if (disabled) return
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) {
      const currentIdx = options.findIndex((opt) => opt.value === value)
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0)
    }
  }

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    setIsOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(0)
      } else {
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : 0,
        )
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        setHighlightedIndex(options.length - 1)
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : options.length - 1,
        )
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        handleSelect(options[highlightedIndex].value)
      } else {
        handleToggle()
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`pl-field-group ${className}`}
      style={{ position: 'relative', width: '100%', marginBottom: '16px' }}
    >
      {label && (
        <label
          htmlFor={id}
          className="pl-label"
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          width: '100%',
          height: '42px',
          padding: '8px 14px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          color: selectedOption ? '#f8fafc' : 'var(--text-dim)',
          backgroundColor: '#0c1322',
          border: isOpen
            ? '1px solid var(--border-focus)'
            : error
              ? '1px solid var(--color-danger)'
              : '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          boxShadow: isOpen
            ? '0 0 0 2px var(--color-pitch-glow)'
            : 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginRight: '8px',
            fontWeight: selectedOption ? 500 : 400,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          color="var(--text-secondary)"
          style={{
            flexShrink: 0,
            transition: 'transform var(--transition-fast)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: '240px',
            overflowY: 'auto',
            margin: 0,
            padding: '6px',
            listStyle: 'none',
            backgroundColor: '#0d1527',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.75)',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border-strong) transparent',
          }}
        >
          {options.length === 0 ? (
            <li
              style={{
                padding: '10px 12px',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              No options available
            </li>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.value === value
              const isHighlighted = idx === highlightedIndex

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    backgroundColor: isSelected
                      ? 'rgba(16, 185, 129, 0.16)'
                      : isHighlighted
                        ? 'rgba(59, 130, 246, 0.18)'
                        : 'transparent',
                    color: isSelected
                      ? 'var(--color-pitch-light)'
                      : isHighlighted
                        ? '#ffffff'
                        : '#f8fafc',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: isSelected
                          ? 'var(--color-pitch-light)'
                          : isHighlighted
                            ? '#ffffff'
                            : '#f8fafc',
                      }}
                    >
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: isSelected ? '#34d399' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      size={16}
                      color="var(--color-pitch)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </li>
              )
            })
          )}
        </ul>
      )}

      {error && (
        <span
          className="pl-error-text"
          style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-danger)' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
