import mergeImages from "merge-images";
import { Canvas, Image } from "canvas";
import sharp from "sharp";
import * as fs from "node:fs";
import * as https from "node:https";

function fetchImage(url: string) {
  return new Promise<Buffer | null>((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode != 200) resolve(null);
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response
        .on("end", () => {
          resolve(Buffer.concat(chunks));
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  });
}

export async function generate_map(
  world: string,
  radius: number,
  x: number,
  z: number,
) {
  const tile_size = 512;
  const tile_count = radius * 2 + 1;
  const offset = 32 * tile_count;
  const size = tile_size * tile_count + offset * 2;
  let renderer = world === "world" ? "vanilla" : "basic";

  // Get region from x, z then get every tile in range
  const region_x = (x >> 4) >> 5;
  const region_z = (z >> 4) >> 5;

  const tiles: mergeImages.ImageSource[] = [];
  for (let dz = -radius; dz <= radius; dz++) {
    for (let dx = -radius; dx <= radius; dx++) {
      let image = await fetchImage(
        `https://mc.playnameless.net/tiles/${world}/0/${renderer}/${region_x + dx}_${region_z - dz}.png`,
      );
      if (!image) continue;
      const col = radius + dx;
      const row = radius - dz;
      tiles.push({
        src: image,
        x: offset + tile_size * col,
        y: offset + tile_size * row,
      });
    }
  }

  // Create the image
  const map_buf = fs.readFileSync(__dirname + "../../../assets/map.png");
  const map = await sharp(map_buf)
    .resize({ width: size, height: size, kernel: "nearest" })
    .toBuffer();
  return mergeImages([{ src: map, x: 0, y: 0 }, ...tiles], {
    Canvas: Canvas,
    Image: Image,
    height: size,
    width: size,
  }).then((b64) => Buffer.from(b64.split(",")[1], "base64"));
}
