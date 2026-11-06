export type Cue = {from: number; duration: number; text: string; audio: string};
export type Scene = {
  id: string; from: number; duration: number; title: string; points: string[];
  sourcePages: number[]; image: string; imageAspect: number; cues: Cue[];
  focus?: {x: number; y: number; width: number; height: number};
};
export type Timeline = {
  schemaVersion: number; title: string; language: string; fps: number; width: number;
  height: number; durationInFrames: number; scenes: Scene[];
  theme: {name: string; background: string; panel: string; ink: string; muted: string; accent: string; grid: boolean};
};
