
import React from 'react';

interface ActionsPanelProps {
  onAddPlay: () => void;
  onReset: () => void;
  onOpenWizard: () => void;
  onOpenOcr: () => void;
  onGenerateTicket: () => void;
}

const ActionButton: React.FC<{
    icon: string;
    label: string;
    onClick: () => void;
    className?: string;
    isPrimary?: boolean;
}> = ({ icon, label, onClick, className = '', isPrimary = false }) => {
  const baseClasses = `
    flex flex-col items-center justify-center p-3 rounded-xl 
    transition-all duration-300 ease-in-out transform 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-cyan 
    focus:ring-offset-light-card dark:focus:ring-offset-dark-card
    border-2
  `;
  
  const themeClasses = isPrimary
    ? 'bg-neon-green text-black border-neon-green shadow-neon-green hover:scale-105 active:scale-95'
    : 'bg-light-surface dark:bg-dark-surface border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-neon-cyan hover:text-neon-cyan hover:scale-105 active:scale-95';

  return (
    <button onClick={onClick} className={`${baseClasses} ${themeClasses} ${className}`}>
        <svg
            className="w-7 h-7 mb-1"
            data-lucide={icon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <span className="text-xs font-semibold text-center">{label}</span>
    </button>
  );
};

const ActionsPanel: React.FC<ActionsPanelProps> = ({ 
    onAddPlay, 
    onReset, 
    onOpenWizard, 
    onOpenOcr, 
    onGenerateTicket 
}) => {
  return (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-lg animate-fade-in">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            <ActionButton icon="plus-circle" label="Add Play" onClick={onAddPlay} />
            <ActionButton icon="magic-wand-2" label="Wizard" onClick={onOpenWizard} />
            <ActionButton icon="camera" label="Scan (AI)" onClick={onOpenOcr} />
            <ActionButton icon="rotate-cw" label="Reset" onClick={onReset} className="text-red-500 hover:border-red-500 hover:text-red-500" />
            <ActionButton 
                icon="ticket" 
                label="Generate Ticket" 
                onClick={onGenerateTicket} 
                className="col-span-3 sm:col-span-1"
                isPrimary
            />
        </div>
    </div>
  );
};

export default ActionsPanel;
