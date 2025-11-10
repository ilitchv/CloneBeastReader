
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Play, Track, WizardPlay } from './types';
import { TRACK_CATEGORIES, MAX_PLAYS } from './constants';
import { determineGameMode, calculateRowTotal, fileToBase64, getTodayDateString } from './utils/helpers';
import Header from './components/Header';
import TrackSelector from './components/TrackSelector';
import ActionsPanel from './components/ActionsPanel';
import PlaysTable from './components/PlaysTable';
import TotalDisplay from './components/TotalDisplay';
import OcrModal from './components/OcrModal';
import WizardModal from './components/WizardModal';
import TicketModal from './components/TicketModal';
import { interpretTicketImage } from './services/geminiService';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
    const [selectedTracks, setSelectedTracks] = useState<string[]>(['New York Evening', 'Venezuela']);
    const [plays, setPlays] = useState<Play[]>([]);
    const [isOcrModalOpen, setOcrModalOpen] = useState(false);
    const [isWizardModalOpen, setWizardModalOpen] = useState(false);
    const [isTicketModalOpen, setTicketModalOpen] = useState(false);
    
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = (savedTheme as 'dark' | 'light') || (prefersDark ? 'dark' : 'light');
        setTheme(initialTheme);
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        loadState();
    }, []);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const handleAddPlay = useCallback(() => {
        if (plays.length >= MAX_PLAYS) {
            alert(`You have reached the limit of ${MAX_PLAYS} plays.`);
            return;
        }
        const newPlay: Play = {
            id: Date.now() + Math.random(),
            betNumber: '',
            gameMode: '-',
            straightAmount: null,
            boxAmount: null,
            comboAmount: null,
        };
        setPlays(prev => [...prev, newPlay]);
    }, [plays.length]);
    
    const handleUpdatePlay = useCallback((id: number, field: keyof Play, value: string | number | null) => {
        setPlays(prevPlays => {
            const newPlays = prevPlays.map(p => p.id === id ? { ...p, [field]: value } : p);
            const targetPlay = newPlays.find(p => p.id === id);
            if (targetPlay && field === 'betNumber') {
                 targetPlay.gameMode = determineGameMode(targetPlay.betNumber, selectedTracks);
            }
            return newPlays;
        });
    }, [selectedTracks]);
    
    const handleRemovePlay = useCallback((id: number) => {
        setPlays(prev => prev.filter(p => p.id !== id));
    }, []);

    const handleRemoveMultiplePlays = useCallback((ids: number[]) => {
        setPlays(prev => prev.filter(p => !ids.includes(p.id)));
    }, []);

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset the form? All plays will be lost.")) {
            setPlays([]);
            setSelectedDate(getTodayDateString());
            setSelectedTracks(['New York Evening', 'Venezuela']);
        }
    };
    
    const handlePasteAmounts = useCallback((amounts: { straight: number | null, box: number | null, combo: number | null }, ids: number[]) => {
        setPlays(prevPlays => 
            prevPlays.map(p => {
                if (ids.includes(p.id)) {
                    return {
                        ...p,
                        straightAmount: amounts.straight ?? p.straightAmount,
                        boxAmount: amounts.box ?? p.boxAmount,
                        comboAmount: amounts.combo ?? p.comboAmount,
                    };
                }
                return p;
            })
        );
    }, []);

    const grandTotal = useMemo(() => {
        const playsTotal = plays.reduce((sum, play) => {
            const rowTotal = calculateRowTotal(play.betNumber, play.gameMode, play.straightAmount, play.boxAmount, play.comboAmount);
            return sum + rowTotal;
        }, 0);
        
        const effectiveTracks = selectedTracks.filter(t => t !== "Venezuela").length || 1;
        // Date selection is single, so days count is 1.
        return playsTotal * effectiveTracks;
    }, [plays, selectedTracks]);

    const saveState = useCallback(() => {
        try {
            const stateToSave = {
                plays,
                selectedDate,
                selectedTracks,
            };
            localStorage.setItem('beastReaderState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state:", error);
        }
    }, [plays, selectedDate, selectedTracks]);

    const loadState = () => {
        try {
            const savedState = localStorage.getItem('beastReaderState');
            if (savedState) {
                const { plays, selectedDate, selectedTracks } = JSON.parse(savedState);
                if(plays) setPlays(plays);
                if(selectedDate) setSelectedDate(selectedDate);
                if(selectedTracks) setSelectedTracks(selectedTracks);
            }
        } catch (error) {
            console.error("Failed to load state:", error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(saveState, 500); // Debounce save operations
        return () => clearTimeout(timer);
    }, [plays, selectedDate, selectedTracks, saveState]);

    const handleAddPlaysFromWizard = (wizardPlays: WizardPlay[]) => {
        if (plays.length + wizardPlays.length > MAX_PLAYS) {
            alert(`Cannot add all plays. The maximum of ${MAX_PLAYS} would be exceeded.`);
            return;
        }
        const newPlays: Play[] = wizardPlays.map(wp => ({
            id: Date.now() + Math.random(),
            betNumber: wp.betNumber,
            gameMode: wp.gameMode,
            straightAmount: wp.straight,
            boxAmount: wp.box,
            comboAmount: wp.combo
        }));
        setPlays(prev => [...prev, ...newPlays]);
        setWizardModalOpen(false);
    };

    const handleAddPlaysFromOcr = (ocrPlays: Omit<Play, 'id' | 'gameMode'>[]) => {
         if (plays.length + ocrPlays.length > MAX_PLAYS) {
            alert(`Cannot add all plays. The maximum of ${MAX_PLAYS} would be exceeded.`);
            return;
        }
        const newPlays: Play[] = ocrPlays.map(op => ({
            id: Date.now() + Math.random(),
            betNumber: op.betNumber,
            gameMode: determineGameMode(op.betNumber, selectedTracks),
            straightAmount: op.straightAmount,
            boxAmount: op.boxAmount,
            comboAmount: op.comboAmount
        }));
        setPlays(prev => [...prev, ...newPlays]);
        setOcrModalOpen(false);
    };

    const handleGenerateTicket = () => {
        if (plays.length === 0) {
            alert("Please add at least one play.");
            return;
        }
        if (plays.some(p => !p.betNumber || p.gameMode === '-')) {
            alert("Please ensure all plays have a valid bet number.");
            return;
        }
        setTicketModalOpen(true);
    };
    
    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                <Header theme={theme} toggleTheme={toggleTheme} />
                
                <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-lg animate-fade-in">
                           <label htmlFor="bet-date" className="block text-sm font-bold text-neon-cyan mb-2">BET DATE</label>
                           <input 
                                id="bet-date"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-light-surface dark:bg-dark-surface p-3 rounded-lg border-2 border-transparent focus:border-neon-cyan focus:ring-0 focus:outline-none transition-all"
                           />
                        </div>

                        <TrackSelector selectedTracks={selectedTracks} setSelectedTracks={setSelectedTracks} selectedDate={selectedDate} />
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <ActionsPanel
                           onAddPlay={handleAddPlay}
                           onReset={handleReset}
                           onOpenWizard={() => setWizardModalOpen(true)}
                           onOpenOcr={() => setOcrModalOpen(true)}
                           onGenerateTicket={handleGenerateTicket}
                        />
                        
                        <PlaysTable 
                            plays={plays}
                            onUpdatePlay={handleUpdatePlay}
                            onRemovePlay={handleRemovePlay}
                            onRemoveMultiplePlays={handleRemoveMultiplePlays}
                            onPasteAmounts={handlePasteAmounts}
                            selectedTracks={selectedTracks}
                        />

                        <TotalDisplay total={grandTotal} />
                    </div>
                </main>
            </div>
            {isOcrModalOpen && (
                <OcrModal 
                    isOpen={isOcrModalOpen}
                    onClose={() => setOcrModalOpen(false)}
                    onAddPlays={handleAddPlaysFromOcr}
                    interpretTicketImage={interpretTicketImage}
                    fileToBase64={fileToBase64}
                />
            )}
            {isWizardModalOpen && (
                <WizardModal
                    isOpen={isWizardModalOpen}
                    onClose={() => setWizardModalOpen(false)}
                    onAddPlays={handleAddPlaysFromWizard}
                    selectedTracks={selectedTracks}
                />
            )}
            {isTicketModalOpen && (
                <TicketModal
                    isOpen={isTicketModalOpen}
                    onClose={() => setTicketModalOpen(false)}
                    plays={plays}
                    selectedDate={selectedDate}
                    selectedTracks={selectedTracks}
                    total={grandTotal}
                />
            )}
        </div>
    );
};

export default App;
