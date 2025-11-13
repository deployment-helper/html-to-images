import { Storage, Bucket } from "@google-cloud/storage";
import pino from "pino";

/**
 * GCS Service - Singleton class for managing Google Cloud Storage operations
 * Provides methods for uploading, downloading, deleting objects and creating signed URLs
 */
class GCSService {
  private static instance: GCSService;
  private storage: Storage;
  private bucketName: string;
  private bucket: Bucket;
  private logger: pino.Logger;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.logger = pino({ name: "GCSService" });
    this.storage = new Storage();
    this.bucketName = process.env.GCS_BUCKET_NAME || "";
    
    if (!this.bucketName) {
      throw new Error("GCS_BUCKET_NAME environment variable is required");
    }
    
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Get singleton instance of GCSService
   * @returns {GCSService} The singleton instance
   */
  public static getInstance(): GCSService {
    if (!GCSService.instance) {
      GCSService.instance = new GCSService();
    }
    return GCSService.instance;
  }

  /**
   * Upload an object to GCS bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @param {Buffer | string} content - The content to upload
   * @param {string} contentType - The content type (e.g., 'image/png', 'application/json')
   * @param {number} expirationDays - Optional: Days until auto-deletion (default: 7)
   * @returns {Promise<string>} The public URL of the uploaded file
   */
  public async uploadObject(
    fileName: string,
    content: Buffer | string,
    contentType: string = "application/octet-stream",
    expirationDays: number = 7
  ): Promise<string> {
    if (!fileName || fileName.trim() === "") {
      throw new Error("fileName cannot be empty");
    }
    
    if (expirationDays < 0) {
      throw new Error("expirationDays must be a positive number");
    }
    
    try {
      const file = this.bucket.file(fileName);
      
      // Set customTime to current time for lifecycle rule
      // The daysSinceCustomTime condition counts days since this timestamp
      const customTime = new Date().toISOString();

      await file.save(content, {
        contentType,
        metadata: {
          customTime: customTime,
        },
      });

      this.logger.info({ fileName, bucketName: this.bucketName, expirationDays }, "File uploaded successfully");
      
      return `gs://${this.bucketName}/${fileName}`;
    } catch (error) {
      this.logger.error({ fileName, error }, "Error uploading file");
      throw new Error(`Failed to upload object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get an object from GCS bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @returns {Promise<Buffer>} The file content as Buffer
   */
  public async getObject(fileName: string): Promise<Buffer> {
    if (!fileName || fileName.trim() === "") {
      throw new Error("fileName cannot be empty");
    }
    
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      
      if (!exists) {
        throw new Error(`File ${fileName} does not exist in bucket ${this.bucketName}`);
      }

      const [content] = await file.download();
      this.logger.info({ fileName, bucketName: this.bucketName }, "File downloaded successfully");
      
      return content;
    } catch (error) {
      this.logger.error({ fileName, error }, "Error downloading file");
      throw new Error(`Failed to get object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete an object from GCS bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @returns {Promise<void>}
   */
  public async deleteObject(fileName: string): Promise<void> {
    if (!fileName || fileName.trim() === "") {
      throw new Error("fileName cannot be empty");
    }
    
    try {
      const file = this.bucket.file(fileName);
      await file.delete();
      
      this.logger.info({ fileName, bucketName: this.bucketName }, "File deleted successfully");
    } catch (error) {
      this.logger.error({ fileName, error }, "Error deleting file");
      throw new Error(`Failed to delete object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a signed URL for temporary access to an object
   * @param {string} fileName - The name/path of the file in the bucket
   * @param {number} expirationMinutes - Minutes until URL expires (default: 60)
   * @param {string} action - The action allowed (default: 'read')
   * @returns {Promise<string>} The signed URL
   */
  public async createSignedUrl(
    fileName: string,
    expirationMinutes: number = 60,
    action: "read" | "write" | "delete" | "resumable" = "read"
  ): Promise<string> {
    if (!fileName || fileName.trim() === "") {
      throw new Error("fileName cannot be empty");
    }
    
    if (expirationMinutes <= 0) {
      throw new Error("expirationMinutes must be a positive number");
    }
    
    try {
      const file = this.bucket.file(fileName);
      
      const options = {
        version: "v4" as const,
        action,
        expires: Date.now() + expirationMinutes * 60 * 1000,
      };

      const [url] = await file.getSignedUrl(options);
      this.logger.info({ fileName, expirationMinutes, action }, "Signed URL created");
      
      return url;
    } catch (error) {
      this.logger.error({ fileName, error }, "Error creating signed URL");
      throw new Error(`Failed to create signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Configure bucket lifecycle rules for automatic deletion
   * @param {number} daysBeforeDeletion - Days before objects are automatically deleted
   * @returns {Promise<void>}
   */
  public async setupAutoDelete(daysBeforeDeletion: number = 7): Promise<void> {
    if (daysBeforeDeletion <= 0) {
      throw new Error("daysBeforeDeletion must be a positive number");
    }
    
    try {
      // Get existing lifecycle configuration
      const [metadata] = await this.bucket.getMetadata();
      const existingRules = metadata.lifecycle?.rule || [];
      
      // Check if a similar rule already exists
      const hasCustomTimeRule = existingRules.some(
        (rule: any) => rule.condition?.daysSinceCustomTime !== undefined
      );
      
      if (hasCustomTimeRule) {
        this.logger.info("Lifecycle rule with daysSinceCustomTime already exists, skipping");
        return;
      }

      const lifecycleRule = {
        action: { type: "Delete" },
        condition: {
          daysSinceCustomTime: daysBeforeDeletion,
        },
      };

      await this.bucket.addLifecycleRule(lifecycleRule);
      this.logger.info({ daysBeforeDeletion }, "Lifecycle rule added: objects will be deleted after custom time");
    } catch (error) {
      this.logger.error({ error }, "Error setting up auto-deletion lifecycle rule");
      throw new Error(`Failed to setup auto-delete: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if an object exists in the bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @returns {Promise<boolean>} True if the file exists, false otherwise
   */
  public async objectExists(fileName: string): Promise<boolean> {
    if (!fileName || fileName.trim() === "") {
      throw new Error("fileName cannot be empty");
    }
    
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.logger.error({ fileName, error }, "Error checking if file exists");
      return false;
    }
  }

  /**
   * Get the bucket name being used
   * @returns {string} The bucket name
   */
  public getBucketName(): string {
    return this.bucketName;
  }
}

export default GCSService;
