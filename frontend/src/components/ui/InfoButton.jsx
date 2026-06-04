import React, { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Reusable Info Button component that shows a tooltip on hover.
 * Used for explaining metrics, fields, and calculations.
 * 
 * @param {string} text - The explanation text to show in the tooltip.
 * @param {string} position - Tooltip position: 'top', 'bottom', 'left', 'right'.
 * @param {number} size - Size of the info icon.
 */
const InfoButton = ({ text, position = 'top', size = 13 }) => {
  const [show, setShow] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { top: '50%', right: '100%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { top: '50%', left: '100%', transform: 'translateY(-50%)', marginLeft: '8px' };
      case 'top':
      default:
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
    }
  };

  const getArrowStyles = () => {
    switch (position) {
      case 'bottom':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', borderBottomColor: 'rgba(13,13,26,0.98)' };
      case 'left':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', borderLeftColor: 'rgba(13,13,26,0.98)' };
      case 'right':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', borderRightColor: 'rgba(13,13,26,0.98)' };
      case 'top':
      default:
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', borderTopColor: 'rgba(13,13,26,0.98)' };
    }
  };

  return (
    <span 
      style={{ display: 'inline-flex', position: 'relative', verticalAlign: 'middle', marginLeft: '6px' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <button 
        type="button" 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'inherit', 
          cursor: 'help', 
          display: 'flex', 
          padding: 0,
          transition: 'color 0.2s'
        }}
        className="info-btn-trigger"
      >
        <Info size={size} />
      </button>

      {show && (
        <span 
          style={{ 
            position: 'absolute', 
            zIndex: 9999, 
            width: 'max-content', 
            maxWidth: '220px', 
            padding: '10px 12px', 
            background: 'rgba(13,13,26,0.98)', 
            border: '1px solid var(--gold-border)', 
            borderRadius: '8px', 
            color: '#fff', 
            fontSize: '0.72rem', 
            lineHeight: '1.4', 
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
            ...getPositionStyles()
          }}
        >
          {text}
          {/* Arrow */}
          <span 
            style={{ 
              position: 'absolute', 
              width: 0, 
              height: 0, 
              border: '5px solid transparent',
              ...getArrowStyles()
            }}
          />
        </span>
      )}
    </span>
  );
};

export default InfoButton;
