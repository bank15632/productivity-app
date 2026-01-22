import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_SCRIPT_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // Build query string from all params
    const queryString = searchParams.toString();

    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || '';

    try {
        const body = await request.json();

        // Debug: Log what we're sending
        console.log('📤 POST Request to Google Apps Script:');
        console.log('   Action:', action);
        console.log('   Body:', JSON.stringify(body, null, 2));

        // Encode the body as a URL parameter to ensure Google Apps Script receives it
        // Google Apps Script has issues receiving POST body due to redirect behavior
        const payload = encodeURIComponent(JSON.stringify(body));
        const url = `${GOOGLE_SCRIPT_URL}?action=${action}&payload=${payload}`;

        const response = await fetch(url, {
            method: 'GET', // Use GET with payload in URL to bypass redirect issues
            redirect: 'follow',
        });

        const text = await response.text();

        // Debug: Log the response
        console.log('📥 Response from Google Apps Script:');
        console.log('   Status:', response.status);
        console.log('   Response:', text);

        // Try to parse as JSON, fallback to returning the text
        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch {
            // If response is not valid JSON, return it as-is wrapped in an object
            return NextResponse.json({ response: text });
        }
    } catch (error) {
        console.error('Proxy POST error:', error);
        return NextResponse.json({ error: 'Failed to post data' }, { status: 500 });
    }
}

