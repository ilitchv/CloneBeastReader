
import React, { useState } from 'react';
import { TRACK_CATEGORIES, CUTOFF_TIMES } from '../constants';
import type { Track } from '../types';
import { getTodayDateString } from '../utils/helpers';

interface TrackSelectorProps {
  selectedTracks: string[];
  setSelectedTracks: (tracks: string[]) => void;
  selectedDate: string;
}

const TrackButton: React.FC<{
    track: Track;
    isSelected: boolean;
    onToggle: (trackName: string) => void;
    isDisabled: boolean;
}> = ({ track, isSelected, onToggle, isDisabled }) => {
    const cutoff = CUTOFF_TIMES[track.name] || '';
    return (
        <label
            className={`
                relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer
                transition-all duration-300 ease-in-out transform
                border-2
                ${isSelected 
                    ? 'bg-neon-cyan/80 dark:bg-neon-cyan text-black border-neon-cyan shadow-neon-sm' 
                    : 'bg-light-surface dark:bg-dark-surface border-gray-300 dark:border-gray-600 hover:border-neon-cyan/50'}
                ${isDisabled 
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:scale-105 active:scale-95'}
            `}
        >
            <input
                type="checkbox"
                className="absolute opacity-0 w-0 h-0"
                checked={isSelected}
                onChange={() => onToggle(track.name)}
                disabled={isDisabled}
            />
            <span className="text-xs sm:text-sm font-bold text-center leading-tight">{track.name}</span>
            {cutoff && <span className="text-[10px] sm:text-xs opacity-70 mt-1">{cutoff}</span>}
        </label>
    );
};


const TrackSelector: React.FC<TrackSelectorProps> = ({ selectedTracks, setSelectedTracks, selectedDate }) => {
    const [openCategory, setOpenCategory] = useState<string | null>('USA');

    const handleToggleTrack = (trackName: string) => {
        setSelectedTracks(
            selectedTracks.includes(trackName)
                ? selectedTracks.filter(t => t !== trackName)
                : [...selectedTracks, trackName]
        );
    };
    
    const isToday = selectedDate === getTodayDateString();
    
    const isTrackDisabled = (trackName: string): boolean => {
        if (!isToday) return false;
        
        const cutoff = CUTOFF_TIMES[trackName];
        if (!cutoff) return false;

        const now = new Date();
        const [hours, minutes] = cutoff.split(':').map(Number);
        const cutoffTime = new Date();
        cutoffTime.setHours(hours, minutes, 0, 0);

        return now > cutoffTime;
    };
    
    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-lg animate-fade-in space-y-2">
            {TRACK_CATEGORIES.map(category => (
                <div key={category.name}>
                    <button
                        onClick={() => setOpenCategory(openCategory === category.name ? null : category.name)}
                        className="w-full flex justify-between items-center p-3 bg-light-surface dark:bg-dark-surface rounded-lg font-bold text-neon-cyan transition-colors"
                    >
                        <span>{category.name}</span>
                        <svg
                            className={`w-5 h-5 transition-transform duration-300 ${openCategory === category.name ? 'rotate-180' : ''}`}
                            data-lucide="chevron-down" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    {openCategory === category.name && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 mt-2 bg-black/10 dark:bg-black/20 rounded-lg">
                            {category.tracks.map(track => (
                                <TrackButton
                                    key={track.id}
                                    track={track}
                                    isSelected={selectedTracks.includes(track.name)}
                                    onToggle={handleToggleTrack}
                                    isDisabled={isTrackDisabled(track.name)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TrackSelector;
