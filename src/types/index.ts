export interface Sticker {
  id: string;
  icon: string;
  name: string;
  color: string;
}

export interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface AppState {
  stage: 'permission' | 'camera' | 'editor' | 'success';
  photoData: string | null;
  placedStickers: PlacedSticker[];
  loading: boolean;
}
