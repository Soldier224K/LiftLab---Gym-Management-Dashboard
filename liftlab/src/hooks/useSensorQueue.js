// hooks/useSensorQueue.ts
// FIFO sensor-data queue — implements PS requirement (c).
// Generates a new sensor reading every `intervalMs` ms, keeping at most `maxLen`
// entries. Uses useRef for the queue array, useState for rendered list,
// useEffect for setInterval, and a counter ref for ids.
import { useState, useRef, useEffect, useCallback } from "react";
import { zoneForHR } from "@/utils/heartRateZone";
const SENSOR_IDS = [
    "SNR-A12",
    "SNR-B07",
    "SNR-C34",
    "SNR-D18",
    "SNR-E22",
    "SNR-F09",
];
// Average assumed age for the simulated wearers — used purely to map HR -> zone.
const SIMULATED_AGE = 30;
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max, decimals = 1) {
    const v = Math.random() * (max - min) + min;
    return Number(v.toFixed(decimals));
}
function makeReading(counter) {
    const sensorId = SENSOR_IDS[counter % SENSOR_IDS.length];
    const heartRate = randomInt(110, 180);
    const zone = zoneForHR(heartRate, SIMULATED_AGE).zone;
    return {
        id: `RDG-${counter.toString().padStart(5, "0")}`,
        timestamp: new Date().toISOString(),
        sensor_id: sensorId,
        heart_rate: heartRate,
        calories: randomFloat(0.5, 12, 1),
        zone,
    };
}
/**
 * Simulates a live FIFO queue of sensor readings from gym floor wearables.
 *
 * - Queue lives in a ref (mutated in place to avoid re-creating on every tick).
 * - A version state counter triggers re-renders so consumers see the latest slice.
 * - `clear()` empties the queue without restarting the interval.
 */
export function useSensorQueue(intervalMs = 3000, maxLen = 12) {
    const queueRef = useRef([]);
    const counterRef = useRef(0);
    const [readings, setReadings] = useState([]);
    useEffect(() => {
        const interval = setInterval(() => {
            const next = makeReading(counterRef.current);
            counterRef.current += 1;
            // Enqueue at the tail, then dequeue from head if over capacity (FIFO).
            const nextQueue = [...queueRef.current, next];
            while (nextQueue.length > maxLen) {
                nextQueue.shift();
            }
            queueRef.current = nextQueue;
            setReadings(nextQueue.slice());
        }, intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs, maxLen]);
    const clear = useCallback(() => {
        queueRef.current = [];
        setReadings([]);
    }, []);
    return { readings, clear };
}
