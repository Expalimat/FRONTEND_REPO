import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const RowActionMenu = ({ actions, label = 'More actions' }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return undefined;

    const updatePosition = () => {
      const trigger = triggerRef.current.getBoundingClientRect();
      const menu = menuRef.current.getBoundingClientRect();
      const gap = 4;
      const edge = 8;
      const left = Math.max(edge, Math.min(trigger.right - menu.width, window.innerWidth - menu.width - edge));
      const top = trigger.bottom + menu.height + gap <= window.innerHeight - edge
        ? trigger.bottom + gap
        : Math.max(edge, trigger.top - menu.height - gap);
      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, actions.length]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-sm btn-light border row-action-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <i className="bi bi-three-dots-vertical" aria-hidden="true"></i>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="dropdown-menu show row-action-menu"
          role="menu"
          style={{ top: position.top, left: position.left }}
        >
          {actions.map(({ label: actionLabel, icon, onClick, variant = '' }) => (
            <button
              key={actionLabel}
              type="button"
              className={`dropdown-item d-flex align-items-center gap-2 ${variant}`}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
            >
              {icon && <i className={`bi ${icon}`} aria-hidden="true"></i>}
              {actionLabel}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};
