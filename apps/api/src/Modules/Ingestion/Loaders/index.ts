import path from "node:path";

import { readPdf } from "./pdf.loader";
import { readTxt } from "./text.loader";
import { readMarkdown } from "./markdown.loader";
import { readHtml } from "./html.loader";
import { readDocx } from "./docx.loader";
import { readCsv } from "./csv.loader";

export async function loadDocument(filePath: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".pdf":
      return readPdf(filePath);

    case ".txt":
      return readTxt(filePath);

    case ".md":
      return readMarkdown(filePath);

    case ".html":
    case ".htm":
      return readHtml(filePath);

    case ".docx":
      return readDocx(filePath);

      case ".csv":
        return readCsv(filePath)
    default:
      throw new Error(`Unsupported document type: ${extension}`);
  }
}
