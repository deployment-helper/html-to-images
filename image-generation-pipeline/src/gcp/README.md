# GCP Services

This directory contains services for interacting with Google Cloud Platform services.

## GCS Storage Service

A singleton service for managing Google Cloud Storage operations.

### Setup

Before using the GCS service, ensure you have set the `GCS_BUCKET_NAME` environment variable:

```bash
export GCS_BUCKET_NAME="your-bucket-name"
```

Or add it to your `.env` file:

```
GCS_BUCKET_NAME=your-bucket-name
```

### Usage Examples

#### Import the Service

```typescript
import GCSService from './gcp/storage';
```

#### Get Instance

```typescript
const gcsService = GCSService.getInstance();
```

#### Upload a File

```typescript
// Upload an SVG image
const svgContent = '<svg>...</svg>';
const fileName = `images/output-${Date.now()}.svg`;
const fileUrl = await gcsService.uploadObject(
  fileName,
  svgContent,
  'image/svg+xml',
  7 // Auto-delete after 7 days
);
console.log(`File uploaded: ${fileUrl}`);
```

#### Download a File

```typescript
const fileName = 'images/output-123456.svg';
const content = await gcsService.getObject(fileName);
console.log(`Downloaded ${content.length} bytes`);
```

#### Check if File Exists

```typescript
const fileName = 'images/output-123456.svg';
const exists = await gcsService.objectExists(fileName);
if (exists) {
  console.log('File exists!');
}
```

#### Create Signed URL

```typescript
// Create a temporary URL that expires in 60 minutes (default)
const fileName = 'images/output-123456.svg';
const signedUrl = await gcsService.createSignedUrl(fileName);
console.log(`Access file at: ${signedUrl}`);

// Create a URL with custom expiration (2 hours)
const longUrl = await gcsService.createSignedUrl(fileName, 120);

// Create a URL for write access
const uploadUrl = await gcsService.createSignedUrl(fileName, 60, 'write');
```

#### Delete a File

```typescript
const fileName = 'images/output-123456.svg';
await gcsService.deleteObject(fileName);
console.log('File deleted successfully');
```

#### Setup Auto-Delete Lifecycle Policy

```typescript
// Configure bucket to auto-delete objects 30 days after their custom time
await gcsService.setupAutoDelete(30);
```

### Complete Example

```typescript
import GCSService from './gcp/storage';

async function processAndUploadImage() {
  // Get the singleton instance
  const gcs = GCSService.getInstance();
  
  // Generate or process your image
  const imageContent = Buffer.from('...'); // Your image data
  const fileName = `generated-images/img-${Date.now()}.png`;
  
  try {
    // Upload with 14-day auto-delete
    const fileUrl = await gcs.uploadObject(
      fileName,
      imageContent,
      'image/png',
      14
    );
    
    // Create a temporary access URL (1 hour)
    const signedUrl = await gcs.createSignedUrl(fileName, 60);
    
    // Return the URL to the user
    return {
      fileUrl,
      accessUrl: signedUrl,
      expiresIn: '1 hour'
    };
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}
```

### API Reference

#### `getInstance(): GCSService`
Returns the singleton instance of the GCS service.

#### `uploadObject(fileName, content, contentType?, expirationDays?): Promise<string>`
Uploads an object to the GCS bucket.
- **fileName**: Path/name of the file in the bucket
- **content**: Buffer or string content to upload
- **contentType**: MIME type (default: 'application/octet-stream')
- **expirationDays**: Days until auto-deletion (default: 7)
- **Returns**: GCS URI of the uploaded file

#### `getObject(fileName): Promise<Buffer>`
Downloads an object from the GCS bucket.
- **fileName**: Path/name of the file in the bucket
- **Returns**: File content as Buffer

#### `deleteObject(fileName): Promise<void>`
Deletes an object from the GCS bucket.
- **fileName**: Path/name of the file in the bucket

#### `createSignedUrl(fileName, expirationMinutes?, action?): Promise<string>`
Creates a temporary signed URL for accessing an object.
- **fileName**: Path/name of the file in the bucket
- **expirationMinutes**: Minutes until URL expires (default: 60)
- **action**: Action type - 'read', 'write', 'delete', or 'resumable' (default: 'read')
- **Returns**: Signed URL string

#### `setupAutoDelete(daysBeforeDeletion?): Promise<void>`
Configures bucket lifecycle rules for automatic deletion.
- **daysBeforeDeletion**: Days before auto-deletion (default: 7)

#### `objectExists(fileName): Promise<boolean>`
Checks if an object exists in the bucket.
- **fileName**: Path/name of the file in the bucket
- **Returns**: True if file exists, false otherwise

#### `getBucketName(): string`
Returns the configured bucket name.

### Error Handling

All methods throw descriptive errors if operations fail. Always wrap calls in try-catch blocks:

```typescript
try {
  await gcs.uploadObject('file.txt', 'content', 'text/plain');
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

### Input Validation

The service validates all inputs and throws descriptive errors for invalid parameters:

- **fileName**: Must not be empty or whitespace-only
- **expirationMinutes**: Must be a positive number
- **expirationDays**: Must be non-negative
- **daysBeforeDeletion**: Must be a positive number

Examples of validation errors:

```typescript
// These will throw errors
await gcs.uploadObject('', 'content', 'text/plain'); // Error: fileName cannot be empty
await gcs.createSignedUrl('file.txt', -5); // Error: expirationMinutes must be a positive number
await gcs.uploadObject('file.txt', 'content', 'text/plain', -1); // Error: expirationDays must be a positive number
```

### Notes

- The service uses the singleton pattern to ensure only one instance exists
- All uploaded files are tagged with a `customTime` metadata for lifecycle management
- Signed URLs are generated using v4 signing
- The `setupAutoDelete()` method checks for existing lifecycle rules to prevent duplicates
- The service requires proper GCP authentication (service account or application default credentials)
