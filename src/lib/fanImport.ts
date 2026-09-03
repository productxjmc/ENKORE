import Papa from "papaparse";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export type ExtractedFan = { email: string; name: string | null };

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Non-global sibling for boolean checks — a global regex's .test() mutates
// its own lastIndex, which is easy to get wrong across loop iterations.
const EMAIL_TEST_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_HEADER_HINTS = ["email", "e-mail", "email address"];
const NAME_HEADER_HINTS = ["name", "full name", "fan name", "fullname"];
const FIRST_NAME_HINTS = ["first name", "firstname"];
const LAST_NAME_HINTS = ["last name", "lastname", "surname"];

function dedupe(fans: ExtractedFan[]): ExtractedFan[] {
  const byEmail = new Map<string, ExtractedFan>();
  for (const fan of fans) {
    const email = fan.email.trim().toLowerCase();
    if (!byEmail.has(email)) byEmail.set(email, { email, name: fan.name });
    else if (!byEmail.get(email)!.name && fan.name) byEmail.get(email)!.name = fan.name;
  }
  return [...byEmail.values()];
}

function extractEmailsFromText(text: string): ExtractedFan[] {
  const matches = text.match(EMAIL_RE) ?? [];
  return dedupe(matches.map((email) => ({ email, name: null })));
}

// CSV is the one format with enough structure to reliably pair a name with
// an email — look for an email-ish header and, separately, a name-ish
// header (or first/last name pair). Any row without a plausible header
// falls back to plain regex extraction over the raw file text, same as
// PDF/DOCX, rather than guessing at column meaning.
function parseCsv(text: string): ExtractedFan[] {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase() });
  const fields = (result.meta.fields ?? []).map((f) => f.trim().toLowerCase());

  const emailField = fields.find((f) => EMAIL_HEADER_HINTS.includes(f));
  if (!emailField) return extractEmailsFromText(text);

  const nameField = fields.find((f) => NAME_HEADER_HINTS.includes(f));
  const firstField = fields.find((f) => FIRST_NAME_HINTS.includes(f));
  const lastField = fields.find((f) => LAST_NAME_HINTS.includes(f));

  const fans: ExtractedFan[] = [];
  for (const row of result.data) {
    const rawEmail = row[emailField];
    if (!rawEmail) continue;
    const email = rawEmail.trim();
    if (!EMAIL_TEST_RE.test(email)) continue;

    let name: string | null = null;
    if (nameField && row[nameField]) name = row[nameField].trim();
    else if (firstField || lastField) {
      name = [firstField ? row[firstField] : "", lastField ? row[lastField] : ""].filter(Boolean).join(" ").trim() || null;
    }

    fans.push({ email, name });
  }
  return dedupe(fans);
}

async function parsePdf(buffer: Buffer): Promise<ExtractedFan[]> {
  const parser = new PDFParse({ data: buffer });
  try {
    const { text } = await parser.getText();
    return extractEmailsFromText(text);
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(buffer: Buffer): Promise<ExtractedFan[]> {
  const { value: text } = await mammoth.extractRawText({ buffer });
  return extractEmailsFromText(text);
}

export type FanFileFormat = "csv" | "pdf" | "docx";

// Dispatches on the file's extension rather than its browser-reported MIME
// type — a CSV in particular gets reported inconsistently across browsers/
// OSes (empty string, text/plain, application/vnd.ms-excel), while the
// filename extension is always present and unambiguous for these three
// formats.
export function detectFanFileFormat(fileName: string): FanFileFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  return null;
}

export async function parseFanFile(buffer: Buffer, format: FanFileFormat): Promise<ExtractedFan[]> {
  if (format === "pdf") return parsePdf(buffer);
  if (format === "docx") return parseDocx(buffer);
  return parseCsv(buffer.toString("utf-8"));
}
