import { useState, useEffect, useRef } from 'react';

export default function RiddleTimer({ riddleExpiresAt, onExpired }) {
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [expired, setExpired] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!riddleExpiresAt) {
            setSecondsLeft(0);
            setExpired(true);
            return;
        }

        const calcRemaining = () => {
            const diff = Math.floor((new Date(riddleExpiresAt).getTime() - Date.now()) / 1000);
            return Math.max(0, diff);
        };

        setSecondsLeft(calcRemaining());
        setExpired(calcRemaining() <= 0);

        intervalRef.current = setInterval(() => {
            const remaining = calcRemaining();
            setSecondsLeft(remaining);
            if (remaining <= 0) {
                setExpired(true);
                clearInterval(intervalRef.current);
                if (onExpired) onExpired();
            }
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [riddleExpiresAt, onExpired]);

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const isUrgent = secondsLeft > 0 && secondsLeft < 60;

    return (
        <div className={`riddle-timer ${isUrgent ? 'riddle-timer-urgent' : ''} ${expired ? 'riddle-timer-expired' : ''}`}>
            <span className="riddle-timer-icon">{expired ? '🔓' : '⏱️'}</span>
            <span className="riddle-timer-display">
                {expired
                    ? 'Timer expired — you can change your riddle!'
                    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                }
            </span>
        </div>
    );
}
