import { SOUND_URLS, type AppSoundName } from './soundCatalog';
import {
    getLegacySoftSoundRecipeName,
    getSoftSoundRecipeName,
    SOFT_SOUND_RECIPES,
    type LegacySoftSoundName,
    type SoftSoundRecipeName,
    type SoftSoundTimbre,
} from './soundThemeModel';

type AudioContextCtor = new () => AudioContext;

let sharedAudioContext: AudioContext | null = null;
const periodicWaveCache = new WeakMap<AudioContext, Partial<Record<SoftSoundTimbre, PeriodicWave>>>();

const SOFT_TIMBRE_PARTIALS: Record<SoftSoundTimbre, number[]> = {
    feltPluck: [1, 0.22, 0.08, 0.03, 0.01],
    glassBell: [1, 0.44, 0.18, 0.06, 0.025],
    airFlute: [1, 0.08, 0.035, 0.015],
    bubbleTone: [1, 0.3, 0.16, 0.05, 0.02],
};

const getAudioContextConstructor = (): AudioContextCtor | null => {
    const runtime = globalThis as typeof globalThis & {
        AudioContext?: AudioContextCtor;
        webkitAudioContext?: AudioContextCtor;
    };

    return runtime.AudioContext ?? runtime.webkitAudioContext ?? null;
};

const ensureAudioContext = (): AudioContext | null => {
    if (sharedAudioContext) {
        return sharedAudioContext;
    }

    const AudioContextClass = getAudioContextConstructor();
    if (!AudioContextClass) {
        return null;
    }

    sharedAudioContext = new AudioContextClass();
    return sharedAudioContext;
};

const clampVolume = (volume: number) => Math.min(Math.max(volume, 0), 100);

const getPeriodicWave = (audioContext: AudioContext, timbre: SoftSoundTimbre) => {
    const cachedWaves = periodicWaveCache.get(audioContext) ?? {};
    const cachedWave = cachedWaves[timbre];
    if (cachedWave) {
        return cachedWave;
    }

    const partials = SOFT_TIMBRE_PARTIALS[timbre];
    const real = new Float32Array(partials.length + 1);
    const imag = new Float32Array(partials.length + 1);

    partials.forEach((amplitude, index) => {
        imag[index + 1] = amplitude;
    });

    const wave = audioContext.createPeriodicWave(real, imag, { disableNormalization: false });
    cachedWaves[timbre] = wave;
    periodicWaveCache.set(audioContext, cachedWaves);
    return wave;
};

const playFallbackAudio = async (src: string, volume: number) => {
    if (typeof Audio === 'undefined') {
        return false;
    }

    const audio = new Audio(src);
    audio.volume = clampVolume(volume) / 100;
    await audio.play();
    return true;
};

const scheduleRecipe = async (recipeName: SoftSoundRecipeName, volume: number) => {
    const audioContext = ensureAudioContext();
    if (!audioContext) {
        return false;
    }

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const recipe = SOFT_SOUND_RECIPES[recipeName];
    const startAt = audioContext.currentTime + 0.01;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(recipe.lowpassHz, startAt);
    filter.Q.setValueAtTime(0.6, startAt);

    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime((clampVolume(volume) / 100) * recipe.masterGain, startAt);

    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    let echoGainNode: GainNode | null = null;
    let echoDelayNode: DelayNode | null = null;
    if (recipe.echoDelayMs && recipe.echoGain) {
        echoDelayNode = audioContext.createDelay(0.4);
        echoDelayNode.delayTime.setValueAtTime(recipe.echoDelayMs / 1000, startAt);
        echoGainNode = audioContext.createGain();
        echoGainNode.gain.setValueAtTime(recipe.echoGain, startAt);

        filter.connect(echoDelayNode);
        echoDelayNode.connect(echoGainNode);
        echoGainNode.connect(audioContext.destination);
    }

    let lastToneEnd = startAt;

    recipe.tones.forEach((tone) => {
        const oscillator = audioContext.createOscillator();
        const toneGain = audioContext.createGain();
        const toneStart = startAt + (tone.offsetMs / 1000);
        const toneEnd = toneStart + (tone.durationMs / 1000);
        const attackEnd = Math.min(toneEnd, toneStart + (recipe.attackMs / 1000));
        const releaseEnd = toneEnd + (recipe.releaseMs / 1000);

        if (tone.timbre) {
            oscillator.setPeriodicWave(getPeriodicWave(audioContext, tone.timbre));
        } else {
            oscillator.type = tone.type;
        }
        oscillator.frequency.setValueAtTime(tone.frequency, toneStart);
        if (tone.slideToFrequency) {
            oscillator.frequency.exponentialRampToValueAtTime(tone.slideToFrequency, toneEnd);
        }
        if (tone.detuneCents) {
            oscillator.detune.setValueAtTime(tone.detuneCents, toneStart);
        }

        toneGain.gain.setValueAtTime(0.0001, toneStart);
        toneGain.gain.exponentialRampToValueAtTime(Math.max(tone.gain, 0.0001), attackEnd);
        toneGain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);

        let toneDestination: AudioNode = filter;
        let stereoPanner: StereoPannerNode | null = null;
        const canPan = typeof audioContext.createStereoPanner === 'function' && typeof tone.pan === 'number';
        if (canPan) {
            stereoPanner = audioContext.createStereoPanner();
            stereoPanner.pan.setValueAtTime(tone.pan ?? 0, toneStart);
            stereoPanner.connect(filter);
            toneDestination = stereoPanner;
        }

        oscillator.connect(toneGain);
        toneGain.connect(toneDestination);

        oscillator.start(toneStart);
        oscillator.stop(releaseEnd + 0.02);
        globalThis.setTimeout(() => {
            toneGain.disconnect();
            stereoPanner?.disconnect();
        }, Math.ceil((releaseEnd - audioContext.currentTime) * 1000) + 80);
        lastToneEnd = Math.max(lastToneEnd, releaseEnd + 0.02);
    });

    globalThis.setTimeout(() => {
        masterGain.disconnect();
        filter.disconnect();
        echoDelayNode?.disconnect();
        echoGainNode?.disconnect();
    }, Math.ceil((lastToneEnd - audioContext.currentTime) * 1000) + 80);

    return true;
};

export const playAppSound = async (soundName: AppSoundName, volume: number) => {
    try {
        return await scheduleRecipe(getSoftSoundRecipeName(soundName), volume);
    } catch (error) {
        console.warn(`Soft sound synthesis failed for ${soundName}:`, error);
        try {
            return await playFallbackAudio(SOUND_URLS[soundName], volume);
        } catch (fallbackError) {
            console.warn(`Fallback sound playback failed for ${soundName}:`, fallbackError);
            return false;
        }
    }
};

export const playLegacySound = async (soundName: LegacySoftSoundName, volume: number) => {
    try {
        return await scheduleRecipe(getLegacySoftSoundRecipeName(soundName), volume);
    } catch (error) {
        console.warn(`Legacy soft sound synthesis failed for ${soundName}:`, error);
        return false;
    }
};
