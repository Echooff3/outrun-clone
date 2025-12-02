export interface Point3D {
  x: number;
  y: number;
  z: number;
  screen?: Point2D;
  camera?: Point3D;
}

export interface Point2D {
  x: number;
  y: number;
  w: number; // Projected width
  scale: number;
}

export interface Segment {
  index: number;
  p1: Point3D;
  p2: Point3D;
  curve: number;
  color: {
    road: string;
    grass: string;
    rumble: string;
    lane: string;
  };
  // Projection cache
  p1Screen: Point2D;
  p2Screen: Point2D;
  clip: number;
  sprites: { source: string; offset: number }[];
}

export interface RoadSectionData {
  type: "straight" | "curve" | "hill" | "s-curve";
  length: number;
  curveStrength?: number;
  heightChange?: number;
}

export interface LevelData {
  trackName: string;
  segmentLength: number;
  roadWidth: number;
  lanes: number;
  fogColor: string;
  roadData: RoadSectionData[];
}

export interface PlayerState {
  x: number; // Normalized X position (-1 to 1)
  z: number; // Distance along the track
  speed: number;
  maxSpeed: number;
  accel: number;
  breaking: number;
  decell: number;
  offRoadDecell: number;
  offRoadLimit: number;
}
