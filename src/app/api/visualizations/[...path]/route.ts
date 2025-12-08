import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathParts } = await params;
    const [leagueName, imageName] = pathParts;

    if (!leagueName || !imageName) {
      return new NextResponse('League name and image name are required', { status: 400 });
    }

    const imagePath = path.join(process.cwd(), 'fbref_data', leagueName, 'visualizations', imageName);

    try {
      const imageBuffer = await fs.readFile(imagePath);
      const contentType = `image/${imageName.split('.').pop()}`; // e.g., image/png

      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': contentType,
        },
      });
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        return new NextResponse('Image not found', { status: 404 });
      }
      console.error(`Error reading image file: ${fileError.message}`);
      return new NextResponse('Internal server error', { status: 500 });
    }
  } catch (error: any) {
    console.error(`Error in visualizations API: ${error.message}`);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
