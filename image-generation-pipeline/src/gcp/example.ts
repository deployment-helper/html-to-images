/**
 * Example usage of GCS Service
 * 
 * This file demonstrates how to use the GCS service for various operations.
 * To run this example, ensure you have:
 * 1. Set GCS_BUCKET_NAME environment variable
 * 2. Configured GCP credentials (service account or application default credentials)
 */

import GCSService from './storage';

async function exampleUsage() {
  try {
    // Get the singleton instance
    const gcs = GCSService.getInstance();
    console.log(`Using bucket: ${gcs.getBucketName()}`);

    // Example 1: Upload a text file
    console.log('\n--- Example 1: Upload Object ---');
    const textContent = 'Hello, GCS! This is a test file.';
    const textFileName = `test/example-${Date.now()}.txt`;
    const textFileUrl = await gcs.uploadObject(
      textFileName,
      textContent,
      'text/plain',
      7 // Auto-delete after 7 days
    );
    console.log(`Uploaded text file: ${textFileUrl}`);

    // Example 2: Check if file exists
    console.log('\n--- Example 2: Check File Exists ---');
    const exists = await gcs.objectExists(textFileName);
    console.log(`File exists: ${exists}`);

    // Example 3: Create signed URL for read access
    console.log('\n--- Example 3: Create Signed URL ---');
    const signedUrl = await gcs.createSignedUrl(textFileName, 60, 'read');
    console.log(`Signed URL (expires in 60 min): ${signedUrl}`);

    // Example 4: Download the file
    console.log('\n--- Example 4: Download Object ---');
    const downloadedContent = await gcs.getObject(textFileName);
    console.log(`Downloaded content: ${downloadedContent.toString()}`);

    // Example 5: Upload an image (SVG example)
    console.log('\n--- Example 5: Upload SVG Image ---');
    const svgContent = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="#4285f4"/>
        <text x="100" y="110" font-size="24" text-anchor="middle" fill="white">GCS</text>
      </svg>
    `.trim();
    const svgFileName = `images/example-${Date.now()}.svg`;
    const svgFileUrl = await gcs.uploadObject(
      svgFileName,
      svgContent,
      'image/svg+xml',
      14 // Auto-delete after 14 days
    );
    console.log(`Uploaded SVG image: ${svgFileUrl}`);

    // Example 6: Create write signed URL (for direct upload from client)
    console.log('\n--- Example 6: Create Write Signed URL ---');
    const uploadFileName = `uploads/client-upload-${Date.now()}.png`;
    const uploadUrl = await gcs.createSignedUrl(uploadFileName, 30, 'write');
    console.log(`Upload URL (expires in 30 min): ${uploadUrl}`);

    // Example 7: Setup auto-delete lifecycle (run once per bucket)
    console.log('\n--- Example 7: Setup Auto-Delete Lifecycle ---');
    // Uncomment the line below to actually set up the lifecycle rule
    // await gcs.setupAutoDelete(7);
    console.log('Lifecycle setup skipped (uncomment to enable)');

    // Example 8: Delete a file
    console.log('\n--- Example 8: Delete Object ---');
    await gcs.deleteObject(textFileName);
    console.log(`Deleted: ${textFileName}`);

    // Verify deletion
    const stillExists = await gcs.objectExists(textFileName);
    console.log(`File still exists after deletion: ${stillExists}`);

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error in example:', error);
    throw error;
  }
}

// Run examples if this file is executed directly
if (import.meta.main) {
  exampleUsage()
    .then(() => {
      console.log('\nExample execution finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nExample execution failed:', error);
      process.exit(1);
    });
}

export { exampleUsage };
