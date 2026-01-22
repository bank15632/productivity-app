import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest) {
    try {
        const { data, fileName, type } = await req.json();

        if (!data || !fileName) {
            return NextResponse.json({ success: false, error: 'Missing data or fileName' }, { status: 400 });
        }

        // Call Google Apps Script to upload image
        const response = await fetch(`${API_URL}?action=uploadImage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: data,
                fileName: fileName,
                type: type || 'image',
            }),
        });

        const result = await response.json();

        if (result.success) {
            return NextResponse.json({
                success: true,
                url: result.url,
                fileId: result.fileId,
            });
        } else {
            return NextResponse.json({ success: false, error: result.error || 'Upload failed' }, { status: 500 });
        }
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
    }
}
