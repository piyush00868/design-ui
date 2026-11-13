"use client";

/** Downscale an image file to a JPEG data URL (keeps uploads small for the vision model). */
export async function fileToDataUrl(file: File, maxW = 1600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

/** Sample real pixel colors with a quick k-means, ranked by area. */
export async function samplePalette(dataUrl: string, k = 10): Promise<string[]> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const w = 160, h = Math.max(1, Math.round((img.height / img.width) * 160));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const px: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 4) px.push([data[i], data[i + 1], data[i + 2]]);

  let centers = Array.from({ length: k }, (_, i) => px[Math.floor((i / k) * px.length)]);
  const assign = new Array(px.length).fill(0);
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < px.length; i++) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < centers.length; j++) {
        const d = (px[i][0] - centers[j][0]) ** 2 + (px[i][1] - centers[j][1]) ** 2 + (px[i][2] - centers[j][2]) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      assign[i] = best;
    }
    const sums = centers.map(() => [0, 0, 0, 0]);
    px.forEach((p, i) => { const s = sums[assign[i]]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
    centers = sums.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centers[j])) as typeof centers;
  }
  const counts = centers.map((_, j) => assign.filter((a) => a === j).length);
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return centers
    .map((cc, j) => ({ hex: `#${hex(cc[0])}${hex(cc[1])}${hex(cc[2])}`.toUpperCase(), n: counts[j] }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => `${x.hex} (${Math.round((x.n / px.length) * 100)}%)`);
}
