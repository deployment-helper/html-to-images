import { Storage, Bucket, File } from "@google-cloud/storage";

/**
 * GCS Service - Singleton class for managing Google Cloud Storage operations
 * Provides methods for uploading, downloading, deleting objects and creating signed URLs
 */
class GCSService {
  private static instance: GCSService;
  private storage: Storage;
  private bucketName: string;
  private bucket: Bucket;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
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
    try {
      const file = this.bucket.file(fileName);
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      await file.save(content, {
        contentType,
        metadata: {
          customTime: expirationDate.toISOString(),
        },
      });

      console.log(`File ${fileName} uploaded successfully to ${this.bucketName}`);
      
      return `gs://${this.bucketName}/${fileName}`;
    } catch (error) {
      console.error(`Error uploading file ${fileName}:`, error);
      throw new Error(`Failed to upload object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get an object from GCS bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @returns {Promise<Buffer>} The file content as Buffer
   */
  public async getObject(fileName: string): Promise<Buffer> {
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      
      if (!exists) {
        throw new Error(`File ${fileName} does not exist in bucket ${this.bucketName}`);
      }

      const [content] = await file.download();
      console.log(`File ${fileName} downloaded successfully from ${this.bucketName}`);
      
      return content;
    } catch (error) {
      console.error(`Error downloading file ${fileName}:`, error);
      throw new Error(`Failed to get object: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete an object from GCS bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @returns {Promise<void>}
   */
  public async deleteObject(fileName: string): Promise<void> {
    try {
      const file = this.bucket.file(fileName);
      await file.delete();
      
      console.log(`File ${fileName} deleted successfully from ${this.bucketName}`);
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
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
    try {
      const file = this.bucket.file(fileName);
      
      const options = {
        version: "v4" as const,
        action,
        expires: Date.now() + expirationMinutes * 60 * 1000,
      };

      const [url] = await file.getSignedUrl(options);
      console.log(`Signed URL created for ${fileName}, expires in ${expirationMinutes} minutes`);
      
      return url;
    } catch (error) {
      console.error(`Error creating signed URL for ${fileName}:`, error);
      throw new Error(`Failed to create signed URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Configure bucket lifecycle rules for automatic deletion
   * @param {number} daysBeforeDeletion - Days before objects are automatically deleted
   * @returns {Promise<void>}
   */
  public async setupAutoDelete(daysBeforeDeletion: number = 7): Promise<void> {
    try {
      const lifecycleRule = {
        action: { type: "Delete" },
        condition: {
          daysSinceCustomTime: daysBeforeDeletion,
        },
      };

      await this.bucket.addLifecycleRule(lifecycleRule);
      console.log(`Lifecycle rule added: objects will be deleted ${daysBeforeDeletion} days after custom time`);
    } catch (error) {
      console.error("Error setting up auto-deletion lifecycle rule:", error);
      throw new Error(`Failed to setup auto-delete: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if an object exists in the bucket
   * @param {string} fileName - The name/path of the file in the bucket
   * @returns {Promise<boolean>} True if the file exists, false otherwise
   */
  public async objectExists(fileName: string): Promise<boolean> {
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      console.error(`Error checking if file ${fileName} exists:`, error);
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
