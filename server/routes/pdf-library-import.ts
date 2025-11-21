/**
 * PDF Library Import API
 * Handles PDF file uploads, text extraction, and integration with Echo's master culinary dictionary
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { masterCulinaryDictionary } from '../lib/master-culinary-dictionary';
import {
  processPDFUpload,
  processPDFBatch,
  calculateImportStats,
  extractTextFromPDFBuffer,
  extractPDFMetadata,
} from '../lib/pdf-upload-handler';
import { convertPDFToMasterTerms } from '../lib/pdf-knowledge-extractor';
import type { PDFMetadata } from '../lib/pdf-knowledge-extractor';

export const pdfLibraryImportRouter = Router();

/**
 * POST /api/pdf-library/upload
 * Upload a single PDF file and import knowledge
 * Expects JSON body with:
 * - pdfBase64: Base64-encoded PDF file content (required)
 * - pdfName: Original PDF filename (required)
 * - title: (optional) Book title override
 * - author: (optional) Book author
 * - cuisine: (optional) Cuisine type
 * - publicationYear: (optional) Publication year
 */
export async function uploadPDFFile(req: Request, res: Response) {
  try {
    const { pdfBase64, pdfName, title, author, cuisine, publicationYear, language } = req.body;

    if (!pdfBase64 || !pdfName) {
      return res.status(400).json({
        status: 'error',
        message: 'PDF base64 content and filename are required',
        example: {
          pdfBase64: 'JVBERi0xLjQK...',
          pdfName: 'food-lovers-companion.pdf',
          title: 'The Food Lovers Companion',
        },
      });
    }

    // Convert base64 to buffer
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = Buffer.from(pdfBase64, 'base64');
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid base64 encoding for PDF',
      });
    }

    // Extract text from PDF
    let pdfText: string;
    try {
      pdfText = await extractTextFromPDFBuffer(pdfBuffer, pdfName);
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'The PDF might be image-based or encrypted. Ensure it contains selectable text.',
        pdfName,
      });
    }

    // Extract or create metadata
    const metadata: PDFMetadata = {
      title: title || extractPDFMetadata(pdfName, pdfText).title,
      author,
      publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
      language: language || 'English',
      cuisine,
      specialization: 'culinary-book',
    };

    // Convert PDF to master culinary terms
    const extraction = convertPDFToMasterTerms(pdfText, metadata);

    // Add all extracted terms to master dictionary
    let addedCount = 0;
    const failedTerms: string[] = [];

    for (const term of extraction.terms) {
      try {
        masterCulinaryDictionary.addTerm(term.term.toLowerCase(), term);
        addedCount++;
      } catch (error) {
        failedTerms.push(term.term);
        console.error(`Failed to add term "${term.term}":`, error);
      }
    }

    const stats = masterCulinaryDictionary.getStatistics();

    res.json({
      status: 'success',
      import: {
        file: pdfName,
        source: metadata.title,
        author: metadata.author,
        cuisine: metadata.cuisine,
        termsExtracted: extraction.terms.length,
        termsAdded: addedCount,
        textExtracted: pdfText.length,
        averageConfidence: extraction.metadata.confidence,
        failedTerms: failedTerms.length > 0 ? failedTerms : undefined,
        timestamp: new Date().toISOString(),
      },
      dictionaryUpdate: {
        totalTerms: stats.totalTerms,
        categories: stats.categories,
        message: `🎓 Echo learned ${addedCount} culinary terms from "${metadata.title}"!`,
      },
      masteryBreakdown: {
        fundamental: stats.masteryLevels.fundamental || 0,
        intermediate: stats.masteryLevels.intermediate || 0,
        advanced: stats.masteryLevels.advanced || 0,
        expert: stats.masteryLevels.expert || 0,
        master: stats.masteryLevels.master || 0,
      },
    });
  } catch (error) {
    console.error('Error uploading PDF file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload and process PDF',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/pdf-library/upload-batch
 * Upload multiple PDF files at once
 * Expects multipart/form-data with multiple files
 */
export async function uploadPDFBatch(req: Request, res: Response) {
  try {
    const files = (req as any).files;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No PDF files provided',
      });
    }

    const importResults = [];
    let totalAdded = 0;
    let totalExtracted = 0;
    const failedFiles = [];

    // Process each file
    for (const file of files) {
      try {
        // Extract text from PDF
        const pdfText = await extractTextFromPDFBuffer(file.buffer, file.filename);
        
        // Create metadata
        const metadata: PDFMetadata = {
          title: extractPDFMetadata(file.filename, pdfText).title,
          language: 'English',
          specialization: 'culinary-book',
        };

        // Convert to master culinary terms
        const extraction = convertPDFToMasterTerms(pdfText, metadata);
        totalExtracted += extraction.terms.length;

        // Add to dictionary
        let addedCount = 0;
        for (const term of extraction.terms) {
          try {
            masterCulinaryDictionary.addTerm(term.term.toLowerCase(), term);
            addedCount++;
          } catch (error) {
            console.error(`Failed to add term "${term.term}":`, error);
          }
        }
        totalAdded += addedCount;

        importResults.push({
          file: file.filename,
          source: metadata.title,
          termsExtracted: extraction.terms.length,
          termsAdded: addedCount,
          confidence: extraction.metadata.confidence,
        });
      } catch (error) {
        failedFiles.push({
          file: file.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const stats = masterCulinaryDictionary.getStatistics();

    res.json({
      status: 'success',
      import: {
        totalFiles: files.length,
        successfulFiles: importResults.length,
        failedFiles: failedFiles.length,
        totalTermsExtracted,
        totalTermsAdded,
        timestamp: new Date().toISOString(),
      },
      results: importResults,
      errors: failedFiles.length > 0 ? failedFiles : undefined,
      dictionaryUpdate: {
        totalTerms: stats.totalTerms,
        categories: stats.categories,
        message: `📚 Echo imported ${totalAdded} culinary terms from ${importResults.length} PDFs!`,
      },
      masteryBreakdown: {
        fundamental: stats.masteryLevels.fundamental || 0,
        intermediate: stats.masteryLevels.intermediate || 0,
        advanced: stats.masteryLevels.advanced || 0,
        expert: stats.masteryLevels.expert || 0,
        master: stats.masteryLevels.master || 0,
      },
    });
  } catch (error) {
    console.error('Error uploading PDF batch:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process PDF batch',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/pdf-library/import-status
 * Get the current status of PDF library imports and Echo's knowledge
 */
export async function getPDFImportStatus(req: Request, res: Response) {
  try {
    const stats = masterCulinaryDictionary.getStatistics();

    const masteryPercentages = {
      fundamental: Math.round((stats.masteryLevels.fundamental || 0) / stats.totalTerms * 100),
      intermediate: Math.round((stats.masteryLevels.intermediate || 0) / stats.totalTerms * 100),
      advanced: Math.round((stats.masteryLevels.advanced || 0) / stats.totalTerms * 100),
      expert: Math.round((stats.masteryLevels.expert || 0) / stats.totalTerms * 100),
      master: Math.round((stats.masteryLevels.master || 0) / stats.totalTerms * 100),
    };

    const categoryBreakdown = Object.entries(stats.categories).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round(count / stats.totalTerms * 100),
    }));

    res.json({
      status: 'success',
      library: {
        totalTermsImported: stats.totalTerms,
        goalTerms: 10000,
        progressPercentage: Math.round(stats.totalTerms / 10000 * 100),
        completionStatus: stats.totalTerms >= 10000 ? '✓ Complete' : `${stats.totalTerms} / 10,000 terms`,
      },
      masteryLevels: {
        breakdown: masteryPercentages,
        levels: {
          fundamental: {
            count: stats.masteryLevels.fundamental || 0,
            description: 'Essential cooking basics and foundational techniques',
            percentage: masteryPercentages.fundamental,
          },
          intermediate: {
            count: stats.masteryLevels.intermediate || 0,
            description: 'Professional cooking knowledge and standard methods',
            percentage: masteryPercentages.intermediate,
          },
          advanced: {
            count: stats.masteryLevels.advanced || 0,
            description: 'Specialized techniques and culinary theory',
            percentage: masteryPercentages.advanced,
          },
          expert: {
            count: stats.masteryLevels.expert || 0,
            description: 'Master-level knowledge and rare specializations',
            percentage: masteryPercentages.expert,
          },
          master: {
            count: stats.masteryLevels.master || 0,
            description: 'Authority-level understanding and culinary mastery',
            percentage: masteryPercentages.master,
          },
        },
      },
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.count - a.count),
      averageConfidence: stats.averageConfidence.toFixed(2),
      capabilities: {
        search: '✓ Search all terms and definitions',
        relatedTerms: '✓ Find related terms and concepts',
        applications: '✓ Learn applications and usage context',
        etymology: '✓ Understand term origins and history',
        masterPaths: '✓ Follow mastery learning paths',
      },
      message: `🍽️ Echo's master culinary dictionary: ${stats.totalTerms} authoritative terms ready for culinary excellence!`,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get PDF import status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/pdf-library/import-from-text
 * Import knowledge directly from PDF text (without file upload)
 * Useful for when text is already extracted via OCR or other methods
 * Body: { pdfText: string, metadata: PDFMetadata }
 */
export async function importFromText(req: Request, res: Response) {
  try {
    const { pdfText, metadata } = req.body;

    if (!pdfText || !metadata || !metadata.title) {
      return res.status(400).json({
        status: 'error',
        message: 'PDF text and metadata with title are required',
      });
    }

    const defaultMetadata: PDFMetadata = {
      title: metadata.title,
      author: metadata.author,
      publicationYear: metadata.publicationYear,
      language: metadata.language || 'English',
      cuisine: metadata.cuisine,
      specialization: metadata.specialization || 'culinary-book',
    };

    // Convert to master culinary terms
    const extraction = convertPDFToMasterTerms(pdfText, defaultMetadata);

    // Add to dictionary
    let addedCount = 0;
    for (const term of extraction.terms) {
      try {
        masterCulinaryDictionary.addTerm(term.term.toLowerCase(), term);
        addedCount++;
      } catch (error) {
        console.error(`Failed to add term "${term.term}":`, error);
      }
    }

    const stats = masterCulinaryDictionary.getStatistics();

    res.json({
      status: 'success',
      import: {
        source: metadata.title,
        author: metadata.author,
        termsExtracted: extraction.terms.length,
        termsAdded: addedCount,
        textLength: pdfText.length,
        confidence: extraction.metadata.confidence,
        timestamp: new Date().toISOString(),
      },
      dictionaryUpdate: {
        totalTerms: stats.totalTerms,
        message: `📚 Echo imported ${addedCount} terms from "${metadata.title}"!`,
      },
    });
  } catch (error) {
    console.error('Error importing from text:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import knowledge from text',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/pdf-library/debug
 * Debug PDF extraction issues
 * Expects multipart/form-data with:
 * - file: PDF file
 * - title: (optional) Book title
 */
export async function debugPDFExtraction(req: Request, res: Response) {
  try {
    const fileData = (req as any).fileData;

    if (!fileData) {
      return res.status(400).json({
        status: 'error',
        message: 'No PDF file provided',
      });
    }

    // Step 1: Extract text
    let pdfText: string;
    let textExtractionError: string | null = null;

    try {
      pdfText = await extractTextFromPDFBuffer(fileData.buffer, fileData.filename);
    } catch (error) {
      textExtractionError = error instanceof Error ? error.message : 'Unknown error';
      pdfText = '';
    }

    // Step 2: Extract definitions
    const metadata: PDFMetadata = {
      title: req.body.title || fileData.filename,
      language: 'English',
      specialization: 'culinary-book',
    };

    let extraction = null;
    let extractionError: string | null = null;

    try {
      extraction = convertPDFToMasterTerms(pdfText, metadata);
    } catch (error) {
      extractionError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Return detailed debug info
    res.json({
      status: 'debug',
      file: {
        filename: fileData.filename,
        sizeBytes: fileData.buffer.length,
      },
      textExtraction: {
        success: textExtractionError === null,
        error: textExtractionError,
        textLength: pdfText.length,
        lineCount: pdfText.split('\n').length,
        preview: pdfText.substring(0, 500),
        sampleLines: pdfText
          .split('\n')
          .slice(0, 10)
          .map((line, i) => ({
            lineNum: i + 1,
            content: line.substring(0, 100),
            length: line.length,
          })),
      },
      definitionExtraction: {
        success: extractionError === null,
        error: extractionError,
        termsExtracted: extraction?.terms.length || 0,
        averageConfidence: extraction?.metadata.confidence || 0,
        sampleTerms: extraction?.terms.slice(0, 5).map(t => ({
          term: t.term,
          definition: t.definition.substring(0, 80),
          categories: t.categories,
          confidence: t.confidence,
        })) || [],
      },
      recommendations: generateDebugRecommendations(
        textExtractionError,
        extractionError,
        pdfText.length,
        extraction?.terms.length || 0
      ),
    });
  } catch (error) {
    console.error('Error debugging PDF file:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to debug PDF',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Generate debugging recommendations based on extraction results
 */
function generateDebugRecommendations(
  textError: string | null,
  extractionError: string | null,
  textLength: number,
  termCount: number
): string[] {
  const recommendations: string[] = [];

  if (textError) {
    recommendations.push(`Text extraction failed: ${textError}`);
    recommendations.push('The PDF might be image-based or encrypted. Try converting it with OCR first.');
  } else if (textLength < 500) {
    recommendations.push('Very little text was extracted (less than 500 chars). The PDF might be mostly images or have encoding issues.');
  }

  if (extractionError) {
    recommendations.push(`Definition extraction failed: ${extractionError}`);
  } else if (termCount === 0) {
    recommendations.push('No definitions were extracted. This might be because:');
    recommendations.push('  - The PDF format doesn\'t match expected glossary patterns');
    recommendations.push('  - Terms may be formatted differently than expected');
    recommendations.push('  - Try checking the PDF format and structure');
  } else if (termCount < 10) {
    recommendations.push(`Only ${termCount} terms extracted. The glossary patterns might not match this PDF format well.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('PDF extraction appears to be working correctly.');
  }

  return recommendations;
}

// Register routes
pdfLibraryImportRouter.post('/pdf-library/upload', uploadPDFFile);
pdfLibraryImportRouter.post('/pdf-library/upload-batch', uploadPDFBatch);
pdfLibraryImportRouter.get('/pdf-library/status', getPDFImportStatus);
pdfLibraryImportRouter.post('/pdf-library/import-from-text', importFromText);
pdfLibraryImportRouter.post('/pdf-library/debug', debugPDFExtraction);

export default pdfLibraryImportRouter;
