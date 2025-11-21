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
 * Extract text from PDF buffer using basic pattern matching
 * For production use with actual PDFs, integrate with pdf-parse or pdfjs-dist
 */
export async function extractTextFromPDFBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // For a production system, you would use:
  // const pdfParse = require('pdf-parse');
  // const data = await pdfParse(buffer);
  // return data.text;

  // For now, we'll implement a pattern-based approach that works with text-based PDFs
  // This is a simplified implementation - production should use proper PDF parsing library

  try {
    // Try to extract text by looking for common PDF text patterns
    const text = buffer.toString('binary');
    
    // Remove PDF stream markers and metadata
    let cleaned = text
      .replace(/BT\s[\s\S]*?ET/g, '') // Remove binary text streams
      .replace(/%[^\n]*\n/g, '') // Remove comments
      .replace(/\x00/g, '') // Remove null bytes
      .replace(/[^\x20-\x7E\n\r\t]/g, ' '); // Keep only printable ASCII and whitespace

    // Decode common PDF text encodings
    const lines = cleaned.split(/[\n\r]+/).map(line => {
      // Remove stream markers
      return line
        .replace(/^stream\s*/i, '')
        .replace(/\s*endstream\s*$/i, '')
        .trim();
    }).filter(line => line.length > 0);

    const extractedText = lines.join('\n');

    if (extractedText.length < 100) {
      throw new Error('Insufficient text extracted from PDF - may require OCR');
    }

    return extractedText;
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
