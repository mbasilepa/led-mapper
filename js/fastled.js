import { hsvToRgb } from "./color.js";
import { mapNumber } from "./math.js";

export function CHSV(hue, saturation, value) {
  while (hue > 255) hue -= 256;
  while (hue < 0) hue += 256;
  while (saturation > 255) saturation -= 256;
  while (saturation < 0) saturation += 256;
  while (value > 255) value -= 256;
  while (value < 0) value += 256;
  const h = mapNumber(hue, 0, 255, 0.0, 1.0);
  const s = mapNumber(saturation, 0, 255, 0.0, 1.0);
  const v = mapNumber(value, 0, 255, 0.0, 1.0);

  const { r, g, b } = hsvToRgb(h, s, v);
  return `rgb(${r}, ${g}, ${b})`;
}

export function CRGB(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

export function generateFastLedMapCode(args) {
  const { centerX, centerY, leds, maxX, maxY, minX, minY } = args;

  let minX256, minY256, minAngle, minAngle256, minRadius, minRadius256;
  let maxX256, maxY256, maxAngle, maxAngle256, maxRadius, maxRadius256;

  minX256 = minY256 = minAngle = minAngle256 = minRadius = minRadius256 = 1000000;
  maxX256 = maxY256 = maxAngle = maxAngle256 = maxRadius = maxRadius256 = -1000000;

  // use the center defined by the user

  // calculate the angle and radius for each LED, using the defined center
  for (const led of leds) {
    const { x, y } = led;

    const radius = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const radians = Math.atan2(centerY - y, centerX - x);

    let angle = radians * (180 / Math.PI);
    while (angle < 0) angle += 360;
    while (angle > 360) angle -= 360;

    if (angle < minAngle) minAngle = angle;
    if (angle > maxAngle) maxAngle = angle;

    if (radius < minRadius) minRadius = radius;
    if (radius > maxRadius) maxRadius = radius;

    led.angle = angle;
    led.radius = radius;
  }

  for (const led of leds) {
    const { x, y, angle, radius } = led;

    let x256 = mapNumber(x, minX, maxX, 0, 255);
    let y256 = mapNumber(y, minY, maxY, 0, 255);
    let angle256 = mapNumber(angle, 0, 360, 0, 255);
    let radius256 = mapNumber(radius, 0, maxRadius, 0, 255);

    led.x256 = x256;
    led.y256 = y256;
    led.angle256 = angle256;
    led.radius256 = radius256;

    if (x256 < minX256) minX256 = x256;
    if (x256 > maxX256) maxX256 = x256;

    if (y256 < minY256) minY256 = y256;
    if (y256 > maxY256) maxY256 = y256;

    if (angle256 < minAngle256) minAngle256 = angle256;
    if (angle256 > maxAngle256) maxAngle256 = angle256;

    if (radius256 < minRadius256) minRadius256 = radius256;
    if (radius256 > maxRadius256) maxRadius256 = radius256;
  }

  // sort leds by index ascending
  leds.sort((a, b) => parseInt(a.index) - parseInt(b.index));

  const coordsX = leds.map((led) => led.x256);
  const coordsY = leds.map((led) => led.y256);
  const angles = leds.map((led) => led.angle256);
  const radii = leds.map((led) => led.radius256);

  const coordsX256 = `byte coordsX[NUM_LEDS] = { ${coordsX.map((v) => v.toFixed(0)).join(", ")} };`;
  const coordsY256 = `byte coordsY[NUM_LEDS] = { ${coordsY.map((v) => v.toFixed(0)).join(", ")} };`;
  const angles256 = `byte angles[NUM_LEDS] = { ${angles.map((v) => v.toFixed(0)).join(", ")} };`;
  const radii256 = `byte radii[NUM_LEDS] = { ${radii.map((v) => v.toFixed(0)).join(", ")} };`;

  const fastLedCode = [
    // coordsX,
    // coordsY,
    // angles,
    // radii,
    // "",
    `#define NUM_LEDS ${leds.length}`,
    "",
    coordsX256,
    coordsY256,
    angles256,
    radii256,
  ].join("\n");

  const stats = `LEDs: ${leds.length}
minX: ${minX}
maxX: ${maxX}
minY: ${minY}
maxY: ${maxY}
minAngle: ${minAngle}
maxAngle: ${maxAngle}
minRadius: ${minRadius}
maxRadius: ${maxRadius}
minX256: ${minX256}
maxX256: ${maxX256}
minY256: ${minY256}
maxY256: ${maxY256}
minAngle256: ${minAngle256}
maxAngle256: ${maxAngle256}
minRadius256: ${minRadius256}
maxRadius256: ${maxRadius256}`;

  return {
    stats,
    fastLedCode,
    coordsX,
    coordsY,
    angles,
    radii,
  };
}
