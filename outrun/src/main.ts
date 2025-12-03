import {
  Application,
  Graphics,
  Assets,
  Sprite,
  Texture,
  Container,
} from "pixi.js";
import { Track } from "./Track";
import { InputHandler } from "./Input";
import levelData from "./level.json";
import { PlayerState, LevelData, Point3D, Segment } from "./types";

(async () => {
  // --- Constants ---
  const FPS = 60;
  const STEP = 1 / FPS;
  const SEGMENT_LENGTH = 200;
  const ROAD_WIDTH = 2000;
  const LANES = 3;
  const FIELD_OF_VIEW = 100;
  const CAMERA_HEIGHT = 1000;
  const CAMERA_DEPTH = 1 / Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);
  const DRAW_DISTANCE = 300;

  // --- State ---
  const player: PlayerState = {
    x: 0,
    z: 0,
    speed: 0,
    maxSpeed: SEGMENT_LENGTH / STEP,
    accel: SEGMENT_LENGTH / STEP / 5,
    breaking: -SEGMENT_LENGTH / STEP,
    decell: -SEGMENT_LENGTH / STEP / 5,
    offRoadDecell: -SEGMENT_LENGTH / STEP / 2,
    offRoadLimit: SEGMENT_LENGTH / STEP / 4,
  };

  let position = 0;
  let speed = 0;
  let drawSprites = true;
  let isResetting = false;
  let resetTimer = 0;
  let resetStartX = 0;

  // --- Setup ---
  const app = new Application();
  await app.init({ background: "#72D7EE", resizeTo: window });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load Assets
  const carTexture = await Assets.load("assets/car.webp");
  const treeTexture = await Assets.load("assets/tree.webp");
  const rockTexture = await Assets.load("assets/rock.webp");
  const fastFoodTexture = await Assets.load("assets/fast_food.webp");
  const businessTexture = await Assets.load("assets/business.webp");
  const churchTexture = await Assets.load("assets/church.webp");
  const gasStationTexture = await Assets.load("assets/gas_station.webp");
  const startScreenTexture = await Assets.load("assets/start-screen.png");
  const finishScreenTexture = await Assets.load("assets/finish-screen.png");

  const textures: Record<string, Texture> = {
    tree: treeTexture,
    rock: rockTexture,
    fast_food: fastFoodTexture,
    business: businessTexture,
    church: churchTexture,
    gas_station: gasStationTexture,
    start_screen: startScreenTexture,
    finish_screen: finishScreenTexture,
  };

  const graphics = new Graphics();
  app.stage.addChild(graphics);

  const spriteContainer = new Container();
  app.stage.addChild(spriteContainer);

  const playerSprite = new Sprite(carTexture);
  playerSprite.anchor.set(0.5, 1);
  playerSprite.scale.set(0.25);
  playerSprite.x = app.screen.width / 2;
  playerSprite.y = app.screen.height - 20;
  app.stage.addChild(playerSprite);

  const track = new Track(levelData as LevelData);
  const input = new InputHandler();

  window.addEventListener("keydown", (e) => {
    if (e.key === "0") {
      drawSprites = !drawSprites;
      console.log("Draw sprites:", drawSprites);
    }
  });

  // HUD Elements
  const speedElement = document.getElementById("speed")!;
  const scoreElement = document.getElementById("score")!;
  const timeElement = document.getElementById("time")!;
  const stageElement = document.getElementById("stage")!;

  let timeLeft = (levelData as LevelData).initialTime;
  let currentLap = 1;
  const totalLaps = 3;
  const checkpoints = (levelData as LevelData).checkpoints;
  // Track which checkpoints have been triggered in the current lap
  const triggeredCheckpoints: Set<number> = new Set();

  // --- Game Loop ---
  app.ticker.add(() => {
    update(STEP);
    render();
  });

  function update(dt: number) {
    if (isResetting) {
      resetTimer += dt;
      const WAIT_TIME = 1.0;
      const TWEEN_TIME = 1.0;

      if (resetTimer < WAIT_TIME) {
        // Wait
      } else if (resetTimer < WAIT_TIME + TWEEN_TIME) {
        const t = (resetTimer - WAIT_TIME) / TWEEN_TIME;
        // Ease out quad
        const ease = 1 - (1 - t) * (1 - t);
        player.x = resetStartX * (1 - ease);
      } else {
        player.x = 0;
        speed = 0;
        isResetting = false;
        resetTimer = 0;
      }

      // Timer still ticks during reset? In arcade games, usually yes.
      timeLeft -= dt;
      if (timeLeft < 0) timeLeft = 0;
      timeElement.innerText = Math.ceil(timeLeft).toString();
      return;
    }

    // Game Over Check
    if (timeLeft <= 0) {
      speed = 0; // Stop the car
      // Optional: Add Game Over UI logic here
      return;
    }

    // Controls
    if (input.isGas) {
      speed += player.accel * dt;
    } else if (input.isBrake) {
      speed += player.breaking * dt;
    } else if (input.isReverse) {
      speed -= player.accel * dt;
    } else {
      // Drag / Deceleration
      if (speed > 0) {
        speed = Math.max(0, speed + player.decell * dt);
      } else if (speed < 0) {
        speed = Math.min(0, speed - player.decell * dt);
      }
    }

    // Steering
    if (input.isLeft) {
      player.x = player.x - 0.05 * (speed / player.maxSpeed); // Speed dependent steering
    } else if (input.isRight) {
      player.x = player.x + 0.05 * (speed / player.maxSpeed);
    }

    // Physics limits
    // speed = Math.max(0, Math.min(speed, player.maxSpeed));
    speed = Math.max(-player.maxSpeed / 2, Math.min(speed, player.maxSpeed));

    // Move player
    position += speed * dt;

    // Lap Logic
    while (position >= track.trackLength) {
      position -= track.trackLength;
      currentLap++;
      triggeredCheckpoints.clear(); // Reset checkpoints for new lap
      if (currentLap > totalLaps) {
        // Level Complete!
        console.log("YOU WIN!");
        speed = 0;
        // Optional: Add Win UI logic here
        return;
      }
      stageElement.innerText = currentLap.toString();
    }
    while (position < 0) position += track.trackLength;

    // Checkpoints
    const currentSegmentIndex = Math.floor(position / SEGMENT_LENGTH);
    // Check if we just passed a checkpoint
    // We iterate through all checkpoints to see if we are "past" them but haven't triggered them yet
    // This is simple but assumes we don't skip over a huge chunk of track in one frame
    for (const cp of checkpoints) {
      if (
        !triggeredCheckpoints.has(cp.segmentIndex) &&
        currentSegmentIndex >= cp.segmentIndex
      ) {
        triggeredCheckpoints.add(cp.segmentIndex);
        timeLeft += cp.timeBonus;
        // Optional: Visual feedback for time bonus
        console.log(`CHECKPOINT! +${cp.timeBonus}s`);
      }
    }

    // Update HUD
    timeLeft -= dt;
    if (timeLeft < 0) timeLeft = 0;

    speedElement.innerText = Math.floor(speed / 100).toString();
    scoreElement.innerText = Math.floor(position / 100).toString(); // Score logic might need update later
    timeElement.innerText = Math.ceil(timeLeft).toString();

    // Collision Detection
    const playerSegment = track.findSegment(position + SEGMENT_LENGTH / 2);
    // Check segment we are entering/inside

    for (const sprite of playerSegment.sprites) {
      const spriteW = 0.15; // Collision width
      if (Math.abs(player.x - sprite.offset) < spriteW) {
        // Collision!
        speed = 0;

        if (Math.abs(player.x) > 1) {
          isResetting = true;
          resetTimer = 0;
          resetStartX = player.x;
        }
      }
    }
  }

  function render() {
    playerSprite.visible = drawSprites;
    graphics.clear();
    spriteContainer.removeChildren();

    const baseSegment = track.findSegment(position);
    const basePercent = (position % SEGMENT_LENGTH) / SEGMENT_LENGTH;
    const playerY =
      baseSegment.p1.y + (baseSegment.p2.y - baseSegment.p1.y) * basePercent;

    let dx = -(baseSegment.curve * basePercent);
    let x = 0;
    let maxY = app.screen.height;

    const playerX = player.x * ROAD_WIDTH;

    const visibleSprites: {
      texture: Texture;
      x: number;
      y: number;
      scale: number;
      z: number;
      clip: number;
    }[] = [];

    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const segment =
        track.segments[(baseSegment.index + n) % track.segments.length];
      const looped = segment.index < baseSegment.index;

      segment.clip = maxY;

      // Camera Z position relative to segment
      // const segmentZ =
      //   (looped ? track.trackLength : 0) +
      //   segment.index * SEGMENT_LENGTH -
      //   position;

      // Project
      project(
        segment.p1,
        playerX - x,
        playerY + CAMERA_HEIGHT,
        position - (looped ? track.trackLength : 0),
        CAMERA_DEPTH,
        app.screen.width,
        app.screen.height,
        ROAD_WIDTH,
      );
      project(
        segment.p2,
        playerX - x - dx,
        playerY + CAMERA_HEIGHT,
        position - (looped ? track.trackLength : 0),
        CAMERA_DEPTH,
        app.screen.width,
        app.screen.height,
        ROAD_WIDTH,
      );

      // Accumulate curve
      x += dx;
      dx += segment.curve;

      // Collect sprites
      if (drawSprites) {
        for (const sprite of segment.sprites) {
          const spriteScale = segment.p1.screen!.scale;
          const spriteScreenX =
            app.screen.width / 2 +
            (spriteScale *
              (segment.p1.camera!.x + sprite.offset * ROAD_WIDTH) *
              app.screen.width) /
              2;
          const spriteScreenY = segment.p1.screen!.y;

          visibleSprites.push({
            texture: textures[sprite.source],
            x: spriteScreenX,
            y: spriteScreenY,
            scale: spriteScale,
            z: segment.p1.camera!.z,
            clip: maxY,
          });
        }
      }

      // Clip behind camera
      if (
        segment.p1.camera!.z <= CAMERA_DEPTH ||
        segment.p2.screen!.y >= maxY ||
        segment.p2.screen!.y >= segment.p1.screen!.y
      ) {
        continue;
      }

      // Draw
      drawSegment(
        graphics,
        segment.p1.screen!.x,
        segment.p1.screen!.y,
        segment.p1.screen!.w,
        segment.p2.screen!.x,
        segment.p2.screen!.y,
        segment.p2.screen!.w,
        segment.color,
      );

      maxY = segment.p2.screen!.y;
    }

    // Sort sprites back-to-front
    visibleSprites.sort((a, b) => b.z - a.z);

    for (const s of visibleSprites) {
      // Simple clipping
      if (s.y > s.clip) {
        continue;
      }

      const sprite = new Sprite(s.texture);
      if (s.texture === rockTexture) {
        sprite.anchor.set(0.5, 0.75);
      } else {
        sprite.anchor.set(0.5, 1);
      }
      sprite.x = s.x;
      sprite.y = s.y;

      const SPRITE_SCALE = 1500; // World width of sprite
      const w = (s.scale * SPRITE_SCALE * app.screen.width) / 2;
      const scale = w / s.texture.width;

      sprite.scale.set(scale);

      spriteContainer.addChild(sprite);
    }
  }

  function project(
    p: Point3D,
    cameraX: number,
    cameraY: number,
    cameraZ: number,
    cameraDepth: number,
    width: number,
    height: number,
    roadWidth: number,
  ) {
    p.camera = { x: 0, y: 0, z: 0 };
    p.screen = { x: 0, y: 0, w: 0, scale: 0 };

    p.camera.x = (p.x || 0) - cameraX;
    p.camera.y = (p.y || 0) - cameraY;
    p.camera.z = (p.z || 0) - cameraZ;

    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round(
      width / 2 + (p.screen.scale * p.camera.x * width) / 2,
    );
    p.screen.y = Math.round(
      height / 2 - (p.screen.scale * p.camera.y * height) / 2,
    );
    p.screen.w = Math.round((p.screen.scale * roadWidth * width) / 2);
  }

  function drawSegment(
    g: Graphics,
    x1: number,
    y1: number,
    w1: number,
    x2: number,
    y2: number,
    w2: number,
    color: Segment["color"],
  ) {
    const r1 = w1 / Math.max(6, 2 * LANES);
    const r2 = w2 / Math.max(6, 2 * LANES);
    const l1 = w1 / Math.max(6, 2 * LANES);
    const l2 = w2 / Math.max(6, 2 * LANES);

    // Grass
    g.rect(0, y2, app.screen.width, y1 - y2);
    g.fill(color.grass);

    // Rumble
    drawPolygon(
      g,
      x1 - w1 - r1,
      y1,
      x1 - w1,
      y1,
      x2 - w2,
      y2,
      x2 - w2 - r2,
      y2,
      color.rumble,
    );
    drawPolygon(
      g,
      x1 + w1 + r1,
      y1,
      x1 + w1,
      y1,
      x2 + w2,
      y2,
      x2 + w2 + r2,
      y2,
      color.rumble,
    );

    // Road
    drawPolygon(
      g,
      x1 - w1,
      y1,
      x1 + w1,
      y1,
      x2 + w2,
      y2,
      x2 - w2,
      y2,
      color.road,
    );

    // Lanes
    if (color.lane) {
      const lanes = LANES;
      const laneW1 = (w1 * 2) / lanes / 2;
      const laneW2 = (w2 * 2) / lanes / 2;
      let laneX1 = x1 - w1 + laneW1;
      let laneX2 = x2 - w2 + laneW2;

      for (let i = 1; i < lanes; i++) {
        drawPolygon(
          g,
          laneX1 - l1 / 2,
          y1,
          laneX1 + l1 / 2,
          y1,
          laneX2 + l2 / 2,
          y2,
          laneX2 - l2 / 2,
          y2,
          color.lane,
        );
        laneX1 += laneW1 * 2;
        laneX2 += laneW2 * 2;
      }
    }
  }

  function drawPolygon(
    g: Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    color: string,
  ) {
    g.poly([x1, y1, x2, y2, x3, y3, x4, y4]);
    g.fill(color);
  }
})();
