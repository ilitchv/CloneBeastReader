
import React, { useEffect, useState } from 'react';

interface TotalDisplayProps {
  total: number;
}

const TotalDisplay: React.FC<TotalDisplayProps> = ({ total }) => {
    const [displayTotal, setDisplayTotal] = useState(total);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => {
            setDisplayTotal(total);
            setIsAnimating(false);
        }, 300); // Animation duration
        return () => clearTimeout(timer);
    }, [total]);

    return (
        <div className="bg-gradient-to-br from-neon-cyan to-neon-pink p-1 rounded-xl shadow-lg animate-fade-in">
            <div className="bg-light-card dark:bg-dark-card rounded-lg p-4 flex justify-between items-center">
                <h3 className="font-bold text-lg uppercase">Grand Total</h3>
                <div 
                    key={total}
                    className={`text-2xl font-bold transition-transform duration-300 ease-out ${isAnimating ? 'scale-110' : 'scale-100'}`}
                >
                    ${displayTotal.toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default TotalDisplay;
