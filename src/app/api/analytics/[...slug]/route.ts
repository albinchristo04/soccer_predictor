
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug;
  if (!slug || slug.length < 2) {
    return new NextResponse('Invalid path', { status: 400 });
  }

  const [leagueName, visualization] = slug;

  const visName = visualization.replace(/%20/g, '_').toLowerCase();
  
  const imagePath = path.join(process.cwd(), 'fbref_data', leagueName, 'visualizations', `${visName}.png`);

  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error(`Image not found at path: ${imagePath}`);
    return new NextResponse('Image not found', { status: 404 });
  }
}
