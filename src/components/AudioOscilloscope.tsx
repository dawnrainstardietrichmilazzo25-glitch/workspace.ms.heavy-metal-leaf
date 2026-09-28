import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/synthEngine';

interface AudioOscilloscopeProps {
  resonanceHz: number;
  distortionGain: number;
}

export const AudioOscilloscope: React.FC<AudioOscilloscopeProps> = ({
  resonanceHz,
  distortionGain,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Dark sci-fi backdrop with trail
      ctx.fillStyle = 'rgba(7, 10, 10, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal center
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      // Vertical quarters
      for (let x = 0; x < width; x += width / 8) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      }

      // Check if there is active audio signal
      let hasSignal = false;
      if (analyser) {
        for (let i = 0; i < bufferLength; i++) {
          if (Math.abs(dataArray[i] - 128) > 3) {
            hasSignal = true;
            break;
          }
        }
      }

      ctx.beginPath();
      ctx.lineWidth = hasSignal ? 2.5 : 1.5;
      ctx.strokeStyle = hasSignal ? '#10b981' : '#059669';
      ctx.shadowColor = hasSignal ? '#34d399' : 'transparent';
      ctx.shadowBlur = hasSignal ? 12 : 0;

      const sliceWidth = width / bufferLength;
      let x = 0;

      phase += 0.04;

      for (let i = 0; i < bufferLength; i++) {
        let v: number;
        if (hasSignal) {
          v = dataArray[i] / 128.0; // 0 to 2
        } else {
          // Idle synth bio-pulse wave
          const freqMultiplier = (resonanceHz / 40);
          v = 1.0 + Math.sin(i * 0.15 * freqMultiplier + phase) * 0.12 + Math.cos(i * 0.05 + phase * 1.5) * 0.06;
        }

        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [resonanceHz, distortionGain]);

  return (
    <div className="relative rounded-lg border border-emerald-950/80 bg-zinc-950/90 p-2.5 backdrop-blur">
      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5 px-1">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold tracking-wider">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ACOUSTIC HARMONIC ANALYZER
        </span>
        <span className="text-zinc-500">
          RESONANCE: <strong className="text-emerald-300">{resonanceHz.toFixed(1)} Hz</strong> | GAIN: <strong className="text-amber-400">{distortionGain}%</strong>
        </span>
      </div>
      <div className="relative h-20 w-full overflow-hidden rounded border border-emerald-900/40 bg-zinc-950">
        <canvas
          ref={canvasRef}
          width={480}
          height={80}
          className="w-full h-full block"
        />
        <div className="pointer-events-none absolute inset-0 scanline-overlay opacity-30" />
      </div>
    </div>
  );
};
