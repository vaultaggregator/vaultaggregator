/**
 * Image Localization Service
 * 
 * Downloads external images and stores them in object storage with unique filenames.
 * Automatically processes external URLs when content is added or updated.
 * Ensures the website never depends on external image hosts.
 */

import crypto from 'crypto';
import path from 'path';
import { ObjectStorageService } from '../objectStorage';
import { storage } from '../storage';

export interface ImageMetadata {
  originalUrl: string;
  localPath: string;
  filename: string;
  contentType: string;
  size: number;
  downloadedAt: Date;
}

export class ImageLocalizationService {
  private objectStorage: ObjectStorageService;
  private readonly IMAGE_DIRECTORY = 'images'; // Directory in object storage for images

  constructor() {
    this.objectStorage = new ObjectStorageService();
  }

  /**
   * Generate a unique filename from URL using hash
   */
  private generateUniqueFilename(url: string): string {
    const hash = crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
    const extension = this.getFileExtension(url);
    return `${hash}.${extension}`;
  }

  /**
   * Extract file extension from URL
   */
  private getFileExtension(url: string): string {
    // Check for common image extensions in URL
    if (url.includes('.svg')) return 'svg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.gif')) return 'gif';
    if (url.includes('.webp')) return 'webp';
    return 'png'; // Default fallback
  }

  /**
   * Check if URL is external (not already localized)
   */
  private isExternalUrl(url: string): boolean {
    if (!url) return false;
    
    // Check if it's already a local object storage URL
    if (url.startsWith('/public-objects/')) return false;
    if (url.startsWith('./')) return false;
    if (url.startsWith('/')) return false;
    
    // Check if it's an external URL
    return url.startsWith('http://') || url.startsWith('https://');
  }

  /**
   * Download image from external URL and store in object storage
   */
  async localizeImage(originalUrl: string): Promise<ImageMetadata | null> {
    if (!this.isExternalUrl(originalUrl)) {
      console.log(`⏩ Skipping non-external URL: ${originalUrl}`);
      return null;
    }

    try {
      console.log(`📥 Downloading image from: ${originalUrl}`);
      
      const response = await fetch(originalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VaultAggregator/1.0)',
        },
      });

      if (!response.ok) {
        console.warn(`❌ Failed to fetch image from ${originalUrl}: ${response.status} ${response.statusText}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const filename = this.generateUniqueFilename(originalUrl);
      const objectPath = `${this.IMAGE_DIRECTORY}/${filename}`;
      
      // Store in object storage (public directory)
      const privateObjectDir = this.objectStorage.getPrivateObjectDir();
      if (!privateObjectDir) {
        throw new Error('Object storage not configured');
      }

      // Use public directory for images so they can be served directly
      const publicPaths = this.objectStorage.getPublicObjectSearchPaths();
      if (publicPaths.length === 0) {
        throw new Error('No public object search paths configured');
      }

      const publicPath = publicPaths[0]; // Use first public path
      const fullObjectPath = `${publicPath}/${objectPath}`;
      
      // Parse the object path for storage
      const { bucketName, objectName } = this.parseObjectPath(fullObjectPath);
      
      // Store the file
      const { objectStorageClient } = await import('../objectStorage');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            'original-url': originalUrl,
            'localized-at': new Date().toISOString(),
          }
        }
      });

      const localPath = `/public-objects/${objectPath}`;
      
      console.log(`✅ Image localized: ${originalUrl} → ${localPath}`);
      
      return {
        originalUrl,
        localPath,
        filename,
        contentType,
        size: buffer.length,
        downloadedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ Error localizing image from ${originalUrl}:`, error);
      return null;
    }
  }

  /**
   * Parse object path into bucket name and object name
   */
  private parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return { bucketName, objectName };
  }

  /**
   * Localize all external images in platform logos
   */
  async localizePlatformImages(): Promise<void> {
    console.log('🔄 Localizing platform images...');
    
    const platforms = await storage.getPlatforms();
    
    for (const platform of platforms) {
      if (platform.logoUrl && this.isExternalUrl(platform.logoUrl)) {
        const metadata = await this.localizeImage(platform.logoUrl);
        
        if (metadata) {
          // Update platform with new local URL
          await storage.updatePlatform(platform.id, {
            logoUrl: metadata.localPath
          });
          console.log(`✅ Updated platform ${platform.displayName} logo: ${metadata.localPath}`);
        }
      }
    }
  }

  /**
   * Localize all external images in chain icons
   */
  async localizeChainImages(): Promise<void> {
    console.log('🔄 Localizing chain images...');
    
    const chains = await storage.getChains();
    
    for (const chain of chains) {
      if (chain.iconUrl && this.isExternalUrl(chain.iconUrl)) {
        const metadata = await this.localizeImage(chain.iconUrl);
        
        if (metadata) {
          // Update chain with new local URL
          await storage.updateChain(chain.id, {
            iconUrl: metadata.localPath
          });
          console.log(`✅ Updated chain ${chain.displayName} icon: ${metadata.localPath}`);
        }
      }
    }
  }

  /**
   * Localize all external images in category icons
   */
  async localizeCategoryImages(): Promise<void> {
    console.log('🔄 Localizing category images...');
    
    const categories = await storage.getAllCategories();
    
    for (const category of categories) {
      if (category.iconUrl && this.isExternalUrl(category.iconUrl)) {
        const metadata = await this.localizeImage(category.iconUrl);
        
        if (metadata) {
          // Update category with new local URL
          await storage.updateCategory(category.id, {
            iconUrl: metadata.localPath
          });
          console.log(`✅ Updated category ${category.displayName} icon: ${metadata.localPath}`);
        }
      }
    }
  }

  /**
   * Run complete image localization for all entities
   */
  async localizeAllImages(): Promise<void> {
    console.log('🚀 Starting complete image localization process...');
    
    try {
      await this.localizePlatformImages();
      await this.localizeChainImages();
      await this.localizeCategoryImages();
      
      console.log('✅ Image localization complete!');
    } catch (error) {
      console.error('❌ Error during image localization:', error);
      throw error;
    }
  }

  /**
   * Process a single URL and return localized version
   * Used for middleware to automatically process new external URLs
   */
  async processUrl(url: string): Promise<string> {
    if (!this.isExternalUrl(url)) {
      return url; // Already local or not a URL
    }

    const metadata = await this.localizeImage(url);
    return metadata ? metadata.localPath : url; // Return original if failed
  }

  /**
   * Middleware function to automatically process external image URLs
   * Call this before saving any data that might contain image URLs
   */
  async processImageFields(data: Record<string, any>, imageFields: string[]): Promise<Record<string, any>> {
    const processed = { ...data };
    
    for (const field of imageFields) {
      if (processed[field] && typeof processed[field] === 'string') {
        processed[field] = await this.processUrl(processed[field]);
      }
    }
    
    return processed;
  }
}

export const imageLocalizationService = new ImageLocalizationService();