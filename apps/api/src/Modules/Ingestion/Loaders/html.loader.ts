import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

export async function readHtml(filePath: string): Promise<string> {
  const absolutePath = path.resolve(filePath);

  const html = await fs.readFile(absolutePath, "utf-8");

  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, noscript, iframe, svg").remove();

  // Extract visible page content
  const text = $("body").text();

  return text
    .replace(/\s+/g, " ")
    .trim();
}
