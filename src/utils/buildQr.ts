/** deterministic fake QR (same algo as mock) */
export function buildQr(): boolean[] {
  const N = 21
  const cells: boolean[] = []
  const fin = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7)
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let on = false
      if (!fin(r, c)) on = ((r * c + r * 5 + c * 3 + (r ^ c)) % 7) < 3
      cells.push(on)
    }
  }
  return cells
}
