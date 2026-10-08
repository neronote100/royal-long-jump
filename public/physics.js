export const TAKEOFF = 125;
export const GROUND = 410;
export function flightStep(p, wind, angle, feather, dt) {
 const sail = angle / 4;
 const lift = wind < 0 ? -wind * sail * (0.65 + feather * 0.25) : 0;
 p.vx += (wind > 0 ? wind * (1 - sail * 0.65) * (0.55 + feather * 0.2) : wind * (0.18 + sail * 0.12)) * dt;
 p.vx = Math.max(4, Math.min(45, p.vx));
 p.vy += (9.8 - Math.min(8, lift)) * dt;
 p.x += p.vx * dt; p.y += p.vy * dt;
}
export const centimeters = meters => Math.round(Math.max(0, meters) * 100);
