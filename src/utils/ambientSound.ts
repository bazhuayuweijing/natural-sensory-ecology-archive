/**
 * 基于 Web Audio API 的环境音景合成器
 * 纯代码合成，无需音频文件
 */

type LayerName = "wind" | "water" | "birds" | "crane" | "frog" | "insects" | "gibbon";

interface LayerConfig {
  volume: number;
}

type SceneConfig = Partial<Record<LayerName, LayerConfig>>;

const SCENES: Record<string, SceneConfig> = {
  "珲春针叶林晨雾": {
    wind: { volume: 0.5 },
    water: { volume: 0.3 },
    birds: { volume: 0.4 },
  },
  "湿地日落": {
    wind: { volume: 0.25 },
    crane: { volume: 0.5 },
    frog: { volume: 0.35 },
  },
  "雨林树冠层": {
    insects: { volume: 0.5 },
    gibbon: { volume: 0.4 },
    wind: { volume: 0.15 },
  },
};

export class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private layers: Map<LayerName, { stop: () => void }> = new Map();
  private currentScene: string | null = null;
  private senseVolumes = { visual: 1, audio: 1, olfactory: 1 };

  /** 必须在用户交互后调用（浏览器自动播放策略） */
  ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /** 设置感官开关对应的音量（0 或 1） */
  setSenseVolume(sense: "visual" | "audio" | "olfactory", vol: number) {
    this.senseVolumes[sense] = vol;
    // 嗅觉对应风/水声，视觉对应鸟鸣/鹤鸣/长臂猿，听觉对应虫鸣/蛙鸣
    this.applySenseVolumes();
  }

  private applySenseVolumes() {
    // 简单映射：视觉层 = birds/crane/gibbon，听觉层 = insects/frog，嗅觉层 = wind/water
    for (const [name, layer] of this.layers) {
      void layer;
      void name;
    }
    // 通过 masterGain 统一控制，各层内部已按 scene 配置音量
    if (this.masterGain) {
      const avg =
        (this.senseVolumes.visual + this.senseVolumes.audio + this.senseVolumes.olfactory) / 3;
      this.masterGain.gain.value = 0.8 * avg;
    }
  }

  /** 播放指定场景的音景 */
  playScene(sceneName: string) {
    this.ensureContext();
    this.stopAll();
    this.currentScene = sceneName;
    const config = SCENES[sceneName];
    if (!config || !this.ctx || !this.masterGain) return;

    for (const [name, cfg] of Object.entries(config) as [LayerName, LayerConfig][]) {
      const stopper = this.createLayer(name, cfg.volume);
      if (stopper) this.layers.set(name, stopper);
    }
  }

  /** 停止所有声音 */
  stopAll() {
    for (const layer of this.layers.values()) {
      layer.stop();
    }
    this.layers.clear();
    this.currentScene = null;
  }

  private createLayer(name: LayerName, volume: number): { stop: () => void } | null {
    if (!this.ctx || !this.masterGain) return null;
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(this.masterGain);

    switch (name) {
      case "wind":
        return this.createWind(ctx, out);
      case "water":
        return this.createWater(ctx, out);
      case "birds":
        return this.createBirds(ctx, out);
      case "crane":
        return this.createCrane(ctx, out);
      case "frog":
        return this.createFrog(ctx, out);
      case "insects":
        return this.createInsects(ctx, out);
      case "gibbon":
        return this.createGibbon(ctx, out);
      default:
        return null;
    }
  }

  /** 松涛/芦苇沙沙：白噪声 → 低通 → LFO 调制增益 */
  private createWind(ctx: AudioContext, out: GainNode) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.Q.value = 0.5;

    const amp = ctx.createGain();
    amp.gain.value = 0.4;

    // LFO 模拟风的强弱变化
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.25;
    lfo.connect(lfoGain).connect(amp.gain);

    noise.connect(filter).connect(amp).connect(out);
    noise.start();
    lfo.start();

    return {
      stop: () => {
        try {
          noise.stop();
          lfo.stop();
        } catch {
          // ignore
        }
      },
    };
  }

  /** 流水：粉噪声 → 带通 */
  private createWater(ctx: AudioContext, out: GainNode) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // 生成粉噪声（近似）
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.15;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;

    const amp = ctx.createGain();
    amp.gain.value = 0.5;

    noise.connect(filter).connect(amp).connect(out);
    noise.start();

    return {
      stop: () => {
        try {
          noise.stop();
        } catch {
          // ignore
        }
      },
    };
  }

  /** 鸟鸣：定时触发短促的频率扫描音 */
  private createBirds(ctx: AudioContext, out: GainNode) {
    let stopped = false;
    const scheduleChirp = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      const startFreq = 2000 + Math.random() * 2000;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.8, now + 0.15);

      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0, now);
      amp.gain.linearRampToValueAtTime(0.3, now + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(amp).connect(out);
      osc.start(now);
      osc.stop(now + 0.2);

      // 下一次鸟鸣间隔 1.5~4 秒
      const next = 1500 + Math.random() * 2500;
      setTimeout(scheduleChirp, next);
    };
    scheduleChirp();

    return { stop: () => (stopped = true) };
  }

  /** 鹤鸣：低频振荡器 + 颤音 */
  private createCrane(ctx: AudioContext, out: GainNode) {
    let stopped = false;
    const scheduleCall = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(420, now + 0.3);
      osc.frequency.linearRampToValueAtTime(300, now + 0.8);

      // 颤音
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 6;
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 15;
      vibrato.connect(vibratoGain).connect(osc.frequency);

      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0, now);
      amp.gain.linearRampToValueAtTime(0.35, now + 0.1);
      amp.gain.linearRampToValueAtTime(0.3, now + 0.6);
      amp.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;

      osc.connect(filter).connect(amp).connect(out);
      osc.start(now);
      osc.stop(now + 1);
      vibrato.start(now);
      vibrato.stop(now + 1);

      setTimeout(scheduleCall, 3000 + Math.random() * 2000);
    };
    scheduleCall();

    return { stop: () => (stopped = true) };
  }

  /** 蛙鸣：方波 → 低通 → 包络 */
  private createFrog(ctx: AudioContext, out: GainNode) {
    let stopped = false;
    const scheduleCroak = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      // 连续叫 2-4 声
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const t = now + i * 0.18;
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 500;

        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(0.2, t + 0.02);
        amp.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(filter).connect(amp).connect(out);
        osc.start(t);
        osc.stop(t + 0.16);
      }
      setTimeout(scheduleCroak, 2000 + Math.random() * 3000);
    };
    scheduleCroak();

    return { stop: () => (stopped = true) };
  }

  /** 虫鸣：高频振荡器 → 脉冲调制 */
  private createInsects(ctx: AudioContext, out: GainNode) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 5500;

    // 脉冲调制器
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;
    lfo.connect(lfoGain);

    const amp = ctx.createGain();
    amp.gain.value = 0;
    lfoGain.connect(amp.gain);
    // 基础音量
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.12;
    amp.connect(baseGain).connect(out);

    osc.connect(amp);
    osc.start();
    lfo.start();

    return {
      stop: () => {
        try {
          osc.stop();
          lfo.stop();
        } catch {
          // ignore
        }
      },
    };
  }

  /** 长臂猿晨鸣：振荡器频率上下滑动 */
  private createGibbon(ctx: AudioContext, out: GainNode) {
    let stopped = false;
    const scheduleCall = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      // 一串上扬的叫声
      const notes = [400, 500, 620, 780, 600];
      notes.forEach((freq, i) => {
        const t = now + i * 0.15;
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * 1.1, t + 0.12);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 2000;

        const amp = ctx.createGain();
        amp.gain.setValueAtTime(0, t);
        amp.gain.linearRampToValueAtTime(0.18, t + 0.03);
        amp.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(filter).connect(amp).connect(out);
        osc.start(t);
        osc.stop(t + 0.15);
      });
      setTimeout(scheduleCall, 4000 + Math.random() * 3000);
    };
    scheduleCall();

    return { stop: () => (stopped = true) };
  }
}

export const ambientSound = new AmbientSoundEngine();
