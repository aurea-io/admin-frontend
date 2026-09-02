import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        {title ? <h3 className="modal__title">{title}</h3> : null}
        <button className="modal__close" type="button" onClick={onClose} aria-label="Cerrar modal">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
