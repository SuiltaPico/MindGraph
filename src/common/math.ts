export type Position = {
  x: number;
  y: number;
};

export function get_dot_distance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  return Math.abs(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)));
}
