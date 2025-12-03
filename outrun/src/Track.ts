import { LevelData, Segment } from "./types";

export class Track {
  segments: Segment[] = [];
  segmentLength: number;
  roadWidth: number;
  lanes: number;
  trackLength: number = 0;

  // Colors
  private COLORS = {
    LIGHT: {
      road: "#6B6B6B",
      grass: "#10AA10",
      rumble: "#555555",
      lane: "#CCCCCC",
    },
    DARK: {
      road: "#696969",
      grass: "#009A00",
      rumble: "#BBBBBB",
      lane: "#696969",
    },
    START: {
      road: "#FFFFFF",
      grass: "#FFFFFF",
      rumble: "#FFFFFF",
      lane: "#FFFFFF",
    },
    FINISH: {
      road: "#000000",
      grass: "#000000",
      rumble: "#000000",
      lane: "#000000",
    },
  };

  constructor(levelData: LevelData) {
    this.segmentLength = levelData.segmentLength;
    this.roadWidth = levelData.roadWidth;
    this.lanes = levelData.lanes;
    this.buildTrack(levelData);
  }

  private buildTrack(levelData: LevelData) {
    this.segments = [];

    levelData.roadData.forEach((section) => {
      this.addRoadSection(
        section.length,
        section.curveStrength || 0,
        section.heightChange || 0,
      );
    });

    this.trackLength = this.segments.length * this.segmentLength;

    // Add Start Screen
    if (this.segments.length > 10) {
      this.segments[10].sprites.push({ source: "start_screen", offset: -2.5 });
      this.segments[10].sprites.push({ source: "start_screen", offset: 2.5 });
    }

    // Add Finish Screen
    if (this.segments.length > 50) {
      const finishIndex = this.segments.length - 50;
      this.segments[finishIndex].sprites.push({
        source: "finish_screen",
        offset: -2.5,
      });
      this.segments[finishIndex].sprites.push({
        source: "finish_screen",
        offset: 2.5,
      });
    }
  }

  private addRoadSection(length: number, curve: number, height: number) {
    const startY = this.lastY();
    const endY = startY + height;
    const totalY = endY - startY;

    for (let i = 0; i < length; i++) {
      this.addSegment(curve, startY + (totalY / length) * (i + 1));
    }
  }

  private addSegment(curve: number, y: number) {
    const n = this.segments.length;
    const color = Math.floor(n / 3) % 2 ? this.COLORS.DARK : this.COLORS.LIGHT;

    const segment: Segment = {
      index: n,
      p1: { x: 0, y: this.lastY(), z: n * this.segmentLength },
      p2: { x: 0, y: y, z: (n + 1) * this.segmentLength },
      curve: curve,
      color: color,
      p1Screen: { x: 0, y: 0, w: 0, scale: 0 },
      p2Screen: { x: 0, y: 0, w: 0, scale: 0 },
      clip: 0,
      sprites: [],
    };

    // Add random sprites
    if (Math.random() < 0.1) {
      segment.sprites.push({
        source: "tree",
        offset: 1.5 + Math.random() * 0.5,
      });
    }
    if (Math.random() < 0.1) {
      segment.sprites.push({
        source: "tree",
        offset: -1.5 - Math.random() * 0.5,
      });
    }
    if (Math.random() < 0.05) {
      segment.sprites.push({
        source: "rock",
        offset: 1.2 + Math.random() * 0.5,
      });
    }
    if (Math.random() < 0.05) {
      segment.sprites.push({
        source: "rock",
        offset: -1.2 - Math.random() * 0.5,
      });
    }

    // New Assets
    const buildings = ["fast_food", "business", "church", "gas_station"];
    if (Math.random() < 0.03) {
      const building = buildings[Math.floor(Math.random() * buildings.length)];
      const side = Math.random() > 0.5 ? 1 : -1;
      segment.sprites.push({
        source: building,
        offset: side * (2.0 + Math.random() * 2.0), // Further out
      });
    }

    this.segments.push(segment);
  }

  private lastY() {
    return this.segments.length === 0
      ? 0
      : this.segments[this.segments.length - 1].p2.y;
  }

  public findSegment(z: number): Segment {
    return this.segments[
      Math.floor(z / this.segmentLength) % this.segments.length
    ];
  }
}
