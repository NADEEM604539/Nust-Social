import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const filename = formData.get('filename');

    if (!file) {
      return Response.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!filename) {
      return Response.json(
        { success: false, error: 'No filename provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
    } catch (mkdirError) {
      console.error('Error creating uploads directory:', mkdirError);
      // Continue anyway - directory might already exist
    }

    // Save file
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    console.log(`File saved: ${filepath}`);

    return Response.json(
      {
        success: true,
        message: 'File uploaded successfully',
        filename: filename,
        path: `/uploads/${filename}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
