import React, { useEffect, useRef, useState } from 'react';
import type { Play } from '../types';
import { calculateRowTotal } from '../utils/helpers';

// Since QRCode is loaded from a script tag, we need to declare it for TypeScript
declare const QRCode: any;

interface TicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    plays: Play[];
    selectedDate: string;
    selectedTracks: string[];
    total: number;
}

const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, plays, selectedDate, selectedTracks, total }) => {
    const qrCodeRef = useRef<HTMLDivElement>(null);
    const [ticketNumber] = useState(Math.floor(10000000 + Math.random() * 90000000).toString());
    const [transactionDate] = useState(new Date().toLocaleString());

    useEffect(() => {
        if (isOpen && qrCodeRef.current) {
            qrCodeRef.current.innerHTML = '';
            new QRCode(qrCodeRef.current, {
                text: ticketNumber,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [isOpen, ticketNumber]);

    if (!isOpen) return null;

    const displayTracks = selectedTracks.filter(t => t !== 'Venezuela').join(', ');
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white text-black rounded-lg shadow-lg w-full max-w-md max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-lg font-bold">Ticket Preview</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <svg data-lucide="x" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                
                <div id="ticket-content" className="p-4 overflow-y-auto space-y-3 text-sm font-mono">
                    <h3 className="text-center font-bold text-lg">Beast Reader Cricket</h3>
                    <div className="text-xs">
                        <p><strong>Date:</strong> {selectedDate}</p>
                        <p><strong>Tracks:</strong> {displayTracks}</p>
                        <p><strong>Ticket #:</strong> {ticketNumber}</p>
                        <p><strong>Time:</strong> {transactionDate}</p>
                    </div>

                    <div className="border-t border-b border-dashed border-gray-400 py-2">
                        <table className="w-full text-xs text-black">
                           <thead>
                                <tr className="font-bold">
                                    <td className="py-1">#</td>
                                    <td className="py-1">Bet</td>
                                    <td className="py-1">Str</td>
                                    <td className="py-1">Box</td>
                                    <td className="py-1">Com</td>
                                    <td className="py-1 text-right">Total</td>
                                </tr>
                            </thead>
                            <tbody>
                            {plays.map((play, index) => (
                                <tr key={play.id}>
                                    <td>{index + 1}</td>
                                    <td>{play.betNumber}</td>
                                    <td>{play.straightAmount?.toFixed(2) ?? '-'}</td>
                                    <td>{play.boxAmount?.toFixed(2) ?? '-'}</td>
                                    <td>{play.comboAmount?.toFixed(2) ?? '-'}</td>
                                    <td className="text-right">${calculateRowTotal(play.betNumber, play.gameMode, play.straightAmount, play.boxAmount, play.comboAmount).toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="flex justify-between items-center font-bold text-base">
                        <span>GRAND TOTAL:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-center pt-2">
                        <div ref={qrCodeRef} className="p-1 bg-white inline-block"></div>
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors">Edit</button>
                    <button onClick={() => { alert('Printing...'); onClose(); }} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">Confirm & Print</button>
                </div>
            </div>
        </div>
    );
};

export default TicketModal;