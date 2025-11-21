/**
 * PDF Upload Handler
 * Manages PDF file uploads and text extraction for library imports
 * Converts PDF files to text for culinary knowledge extraction
 */

import fs from 'fs';
import path from 'path';
import { convertPDFToMasterTerms } from './pdf-knowledge-extractor';
import type { PDFMetadata } from './pdf-knowledge-extractor';

export interface PDFUploadOptions {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface PDFProcessResult {
  filename: string;
  success: boolean;
  textLength?: number;
  pdfMetadata?: PDFMetadata;
  error?: string;
}

/**
 * Extract text from PDF buffer using pattern matching and text stream extraction
 * Handles text-based PDFs without requiring external libraries
 */
export async function extractTextFromPDFBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    let text = buffer.toString('binary');
    let extractedText = '';

    // Strategy 1: Extract from text streams using regex
    // PDFs encode text in various ways - try to extract from common patterns

    // Look for text objects that contain readable strings
    // Pattern: (text) or <hexstring> within text streams
    const textObjectPattern = /BT\s([\s\S]*?)ET/g;
    let match;
    const textObjects: string[] = [];

    while ((match = textObjectPattern.exec(text)) !== null) {
      textObjects.push(match[1]);
    }

    // Extract strings from text objects
    for (const obj of textObjects) {
      // Match text in parentheses: (text)
      const stringsInParens = obj.match(/\(([^()\\]|\\.)*\)/g);
      if (stringsInParens) {
        for (const str of stringsInParens) {
          const content = str.slice(1, -1) // Remove parentheses
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          extractedText += content + ' ';
        }
      }

      // Match hex encoded strings: <hexstring>
      const hexStrings = obj.match(/<([0-9A-Fa-f]+)>/g);
      if (hexStrings) {
        for (const hexStr of hexStrings) {
          const hex = hexStr.slice(1, -1);
          try {
            const decoded = Buffer.from(hex, 'hex').toString('binary');
            // Filter for readable characters
            const readable = decoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
            if (readable.trim().length > 0) {
              extractedText += readable + ' ';
            }
          } catch (e) {
            // Skip malformed hex strings
          }
        }
      }
    }

    // Strategy 2: Look for streams marked as "stream...endstream"
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
    while ((match = streamPattern.exec(text)) !== null) {
      let streamContent = match[1];

      // Try to extract text from various PDF encodings
      // Remove common PDF operators
      streamContent = streamContent
        .replace(/Tj|TJ|\'|\"|Tf|Tm|Td|TD|T\*/g, ' ') // PDF text operators
        .replace(/[\x00]/g, ''); // Remove nulls

      // Look for readable text
      const readable = streamContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      if (readable.trim().length > 10) {
        extractedText += readable + ' ';
      }
    }

    // Strategy 3: Look for embedded text in content streams
    // Find objects that contain readable text
    const objectPattern = /obj\s*([\s\S]*?)\s*endobj/g;
    let objectCount = 0;
    while ((match = objectPattern.exec(text)) !== null && objectCount < 500) {
      const obj = match[1];
      // Check if this looks like a content stream
      if (obj.includes('stream') || obj.match(/\(.*\)/)) {
        // Extract parenthetical text
        const parenthetical = obj.match(/\(([^()\\]|\\.)*\)/g);
        if (parenthetical) {
          for (const str of parenthetical) {
            const content = str.slice(1, -1)
              .replace(/\\\(/g, '(')
              .replace(/\\\)/g, ')')
              .replace(/\\\\/g, '\\');
            if (content.length > 2) {
              extractedText += content + ' ';
            }
          }
        }
      }
      objectCount++;
    }

    // Clean up the extracted text
    let cleaned = extractedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-ASCII
      .trim();

    // Remove common PDF artifacts
    cleaned = cleaned
      .replace(/(%[^\n]*)/g, '') // Comments
      .replace(/(\d+\s+\d+\s+obj|\s+endobj)/g, '') // Object markers
      .replace(/stream\s+endstream/g, '') // Stream markers
      .replace(/PDF\s+version/i, '')
      .replace(/%%EOF/g, '')
      .replace(/\s+/g, ' '); // Final whitespace normalization

    // Split into lines and remove very short lines that are probably noise
    const lines = cleaned
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => line.length > 2);

    const finalText = lines.join('\n');

    if (finalText.length < 100) {
      throw new Error('Insufficient text extracted from PDF (less than 100 characters). The PDF may be image-based or encrypted. Please ensure the PDF contains selectable text.');
    }

    return finalText;
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract metadata from filename and content
 */
export function extractPDFMetadata(
  filename: string,
  textContent: string,
  userMetadata?: Partial<PDFMetadata>
): PDFMetadata {
  // Clean filename to get title
  let title = path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  // If title is too generic, use a better name
  if (title.length < 3) {
    title = 'Imported Culinary Book';
  }

  // Try to detect cuisine from filename and content
  let cuisine: string | undefined;
  const cuisinePatterns = {
    'French': ['french', 'français', 'classical', 'escoffier', 'larousse'],
    'Italian': ['italian', 'italiano', 'risotto', 'pasta'],
    'Asian': ['asian', 'japanese', 'chinese', 'thai', 'vietnamese', 'korean', 'wok'],
    'Spanish': ['spanish', 'español', 'tapas', 'paella'],
    'Indian': ['indian', 'curry', 'tandoor', 'spice'],
    'Mediterranean': ['mediterranean', 'greek', 'lebanese', 'persian'],
    'Modern': ['modern', 'molecular', 'contemporary', 'fusion'],
  };

  const filenameAndContent = `${filename} ${textContent}`.toLowerCase();
  for (const [cuisineType, patterns] of Object.entries(cuisinePatterns)) {
    if (patterns.some(p => filenameAndContent.includes(p))) {
      cuisine = cuisineType;
      break;
    }
  }

  // Detect publication year from text
  let publicationYear: number | undefined;
  const yearMatch = textContent.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    publicationYear = parseInt(yearMatch[0], 10);
  }

  // Try to extract author name (common pattern: "by [Author Name]")
  let author: string | undefined;
  const authorMatch = textContent.match(/by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  if (authorMatch) {
    author = authorMatch[1];
  }

  return {
    title: userMetadata?.title || title,
    author: userMetadata?.author || author,
    publicationYear: userMetadata?.publicationYear || publicationYear,
    language: userMetadata?.language || 'English',
    cuisine: userMetadata?.cuisine || cuisine,
    specialization: userMetadata?.specialization || 'culinary-book',
  };
}

/**
 * Validate PDF file before processing
 */
export function validatePDFFile(file: PDFUploadOptions): { valid: boolean; error?: string } {
  // Check file size (max 10MB for safety)
  const maxSize = 10 * 1024 * 1024;
  if (file.buffer.length > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check file type
  if (!file.mimeType.includes('pdf') && !file.filename.endsWith('.pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Check PDF magic number (first 4 bytes should be %PDF)
  const pdfMagic = file.buffer.slice(0, 4).toString('ascii');
  if (!pdfMagic.startsWith('%PDF')) {
    return { valid: false, error: 'Invalid PDF file format' };
  }

  return { valid: true };
}

/**
 * Process a single PDF file upload
 */
export async function processPDFUpload(
  file: PDFUploadOptions,
  userMetadata?: Partial<PDFMetadata>
): Promise<PDFProcessResult> {
  try {
    // Validate file
    const validation = validatePDFFile(file);
    if (!validation.valid) {
      return {
        filename: file.filename,
        success: false,
        error: validation.error,
      };
    }

    // Extract text from PDF
    const textContent = await extractTextFromPDFBuffer(file.buffer, file.filename);

    // Extract metadata
    const metadata = extractPDFMetadata(file.filename, textContent, userMetadata);

    return {
      filename: file.filename,
      success: true,
      textLength: textContent.length,
      pdfMetadata: metadata,
    };
  } catch (error) {
    return {
      filename: file.filename,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing PDF',
    };
  }
}

/**
 * Process multiple PDF uploads
 */
export async function processPDFBatch(
  files: PDFUploadOptions[],
  userMetadataList?: Partial<PDFMetadata>[]
): Promise<PDFProcessResult[]> {
  const results: PDFProcessResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const userMetadata = userMetadataList?.[i];
    const result = await processPDFUpload(file, userMetadata);
    results.push(result);
  }

  return results;
}

/**
 * Create a temporary file storage location for PDF processing
 * In production, use cloud storage (S3, Azure Blob, etc.)
 */
export function getTempPDFStoragePath(): string {
  const tempDir = path.join(process.cwd(), '.temp', 'pdfs');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Save uploaded PDF to temporary storage
 */
export function savePDFTemporarily(file: PDFUploadOptions): string {
  const storageDir = getTempPDFStoragePath();
  const filename = `${Date.now()}-${file.filename}`;
  const filepath = path.join(storageDir, filename);
  fs.writeFileSync(filepath, file.buffer);
  return filepath;
}

/**
 * Clean up temporary PDF files
 */
export function cleanupTemporaryPDF(filepath: string): void {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error(`Failed to cleanup temporary PDF file: ${error}`);
  }
}

/**
 * Get PDF import statistics
 */
export interface PDFImportStats {
  totalFilesProcessed: number;
  successfulFiles: number;
  totalTextExtracted: number;
  averageFileSize: number;
  estimatedTermsExtracted: number;
}

export function calculateImportStats(results: PDFProcessResult[]): PDFImportStats {
  const successful = results.filter(r => r.success);
  const totalText = successful.reduce((sum, r) => sum + (r.textLength || 0), 0);

  // Rough estimate: 1 term per ~50 characters of text
  const estimatedTerms = Math.floor(totalText / 50);

  return {
    totalFilesProcessed: results.length,
    successfulFiles: successful.length,
    totalTextExtracted: totalText,
    averageFileSize: totalText / successful.length || 0,
    estimatedTermsExtracted: estimatedTerms,
  };
}
