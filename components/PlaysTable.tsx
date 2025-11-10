
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Play } from '../types';
import { calculateRowTotal } from '../utils/helpers';

interface PlayRowProps {
    play: Play;
    index: number;
    isSelected: boolean;
    isDuplicate: boolean;
    onToggleSelect: (id: number) => void;
    onUpdate: (id: number, field: keyof Play, value: string | number | null) => void;
    onRemove: (id: number) => void;
}

const PlayRow: React.FC<PlayRowProps> = React.memo(({ play, index, isSelected, isDuplicate, onToggleSelect, onUpdate, onRemove }) => {
    const rowTotal = useMemo(() => calculateRowTotal(play.betNumber, play.gameMode, play.straightAmount, play.boxAmount, play.comboAmount), [play]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = value === '' ? null : parseFloat(value);
        onUpdate(play.id, name as keyof Play, name === 'betNumber' ? value : parsedValue);
    };

    return (
        <tr className={`transition-colors duration-200 ${isSelected ? 'bg-neon-cyan/20' : 'odd:bg-light-surface/50 odd:dark:bg-dark-surface/50'}`}>
            <td className="p-1.5 text-center">
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(play.id)} className="w-4 h-4 rounded accent-neon-cyan bg-transparent border-gray-400 dark:border-gray-600" />
            </td>
            <td className="p-1.5 text-center font-mono text-sm">{index + 1}</td>
            <td className="p-1.5">
                <input
                    type="text"
                    name="betNumber"
                    value={play.betNumber}
                    onChange={handleInputChange}
                    className={`w-full bg-transparent text-center font-mono text-sm p-1 rounded border-2 ${isDuplicate ? 'border-red-500' : 'border-transparent focus:border-neon-cyan/50'} focus:outline-none`}
                    maxLength={5}
                />
            </td>
            <td className="p-1.5 text-center font-mono text-xs">{play.gameMode}</td>
            {['straightAmount', 'boxAmount', 'comboAmount'].map(field => (
                 <td key={field} className="p-1.5">
                    <input
                        type="number"
                        name={field}
                        value={play[field as keyof Play] as number ?? ''}
                        onChange={handleInputChange}
                        className="w-full bg-transparent text-center font-mono text-sm p-1 rounded border-2 border-transparent focus:border-neon-cyan/50 focus:outline-none"
                        step="0.01"
                    />
                </td>
            ))}
            <td className="p-1.5 text-center font-mono text-sm font-bold">${rowTotal.toFixed(2)}</td>
            <td className="p-1.5 text-center">
                <button onClick={() => onRemove(play.id)} className="text-red-500 hover:text-red-400 transition-colors">
                    <svg data-lucide="trash-2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
            </td>
        </tr>
    );
});


interface PlaysTableProps {
    plays: Play[];
    onUpdatePlay: (id: number, field: keyof Play, value: string | number | null) => void;
    onRemovePlay: (id: number) => void;
    onRemoveMultiplePlays: (ids: number[]) => void;
    onPasteAmounts: (amounts: { straight: number | null, box: number | null, combo: number | null }, ids: number[]) => void;
    selectedTracks: string[];
}

const PlaysTable: React.FC<PlaysTableProps> = ({ plays, onUpdatePlay, onRemovePlay, onRemoveMultiplePlays, onPasteAmounts, selectedTracks }) => {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [copiedAmounts, setCopiedAmounts] = useState<{ straight: number | null, box: number | null, combo: number | null } | null>(null);

    const duplicateBetNumbers = useMemo(() => {
        const counts = new Map<string, number>();
        plays.forEach(p => {
            if (p.betNumber) {
                counts.set(p.betNumber, (counts.get(p.betNumber) || 0) + 1);
            }
        });
        return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([betNumber]) => betNumber));
    }, [plays]);

    const handleToggleSelect = useCallback((id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }, []);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedIds(e.target.checked ? plays.map(p => p.id) : []);
    };
    
    useEffect(() => {
        if(selectedIds.length > 0 && selectedIds.every(id => !plays.some(p => p.id === id))) {
            setSelectedIds([]);
        }
    }, [plays, selectedIds]);

    const handleCopy = () => {
        if (selectedIds.length === 0) {
            alert("Select a row to copy amounts from.");
            return;
        }
        const lastSelectedPlay = plays.find(p => p.id === selectedIds[selectedIds.length - 1]);
        if (lastSelectedPlay) {
            setCopiedAmounts({
                straight: lastSelectedPlay.straightAmount,
                box: lastSelectedPlay.boxAmount,
                combo: lastSelectedPlay.comboAmount
            });
            alert("Amounts copied!");
        }
    };
    
    const handlePaste = () => {
        if (!copiedAmounts) {
            alert("Copy amounts first.");
            return;
        }
        if (selectedIds.length === 0) {
            alert("Select rows to paste amounts to.");
            return;
        }
        onPasteAmounts(copiedAmounts, selectedIds);
    };
    
    const handleBulkDelete = () => {
        if (selectedIds.length === 0) {
            alert("Select rows to delete.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected plays?`)) {
            onRemoveMultiplePlays(selectedIds);
            setSelectedIds([]);
        }
    };

    const isAllSelected = plays.length > 0 && selectedIds.length === plays.length;

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-lg animate-fade-in">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className="font-bold text-lg text-neon-cyan">PLAYS ({plays.length})</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopy} disabled={selectedIds.length === 0} className="p-2 rounded-md bg-light-surface dark:bg-dark-surface disabled:opacity-50"><svg data-lucide="copy" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button>
                    <button onClick={handlePaste} disabled={!copiedAmounts || selectedIds.length === 0} className="p-2 rounded-md bg-light-surface dark:bg-dark-surface disabled:opacity-50"><svg data-lucide="clipboard-paste" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M16 2v4a2 2 0 0 1-2 2H8"/><path d="M9 14h2"/><path d="M13 18h2"/><path d="M9 18v-4h6v4"/></svg></button>
                    <button onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="p-2 rounded-md bg-red-500/20 text-red-500 disabled:opacity-50"><svg data-lucide="trash-2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="p-1.5 font-semibold text-center w-8"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-4 h-4 rounded accent-neon-cyan bg-transparent border-gray-400 dark:border-gray-600" /></th>
                            <th className="p-1.5 font-semibold text-center w-8">#</th>
                            <th className="p-1.5 font-semibold text-left w-24">Bet</th>
                            <th className="p-1.5 font-semibold text-left w-20">Mode</th>
                            <th className="p-1.5 font-semibold text-left w-20">Str</th>
                            <th className="p-1.5 font-semibold text-left w-20">Box</th>
                            <th className="p-1.5 font-semibold text-left w-20">Com</th>
                            <th className="p-1.5 font-semibold text-left w-24">Total</th>
                            <th className="p-1.5 font-semibold text-center w-12">Del</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plays.map((play, index) => (
                            <PlayRow
                                key={play.id}
                                play={play}
                                index={index}
                                isSelected={selectedIds.includes(play.id)}
                                isDuplicate={duplicateBetNumbers.has(play.betNumber)}
                                onToggleSelect={handleToggleSelect}
                                onUpdate={onUpdatePlay}
                                onRemove={onRemovePlay}
                            />
                        ))}
                    </tbody>
                </table>
                 {plays.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p>No plays added yet.</p>
                        <p className="text-sm">Click "Add Play" or use the "Wizard" to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaysTable;
