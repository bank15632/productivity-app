import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        console.log('GET /api/calendar - Session:', session ? 'exists' : 'null');
        console.log('Access token:', session?.accessToken ? 'present' : 'missing');

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Not authenticated', events: [] }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeMin = searchParams.get('timeMin');
        const timeMax = searchParams.get('timeMax');

        console.log('Fetching events with params:', { timeMin, timeMax });

        const events = await getCalendarEvents(
            session.accessToken,
            timeMin ? new Date(timeMin) : undefined,
            timeMax ? new Date(timeMax) : undefined
        );

        console.log('Returning events:', events.length);

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar events', events: [] }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        console.log('POST /api/calendar - Session:', session ? 'exists' : 'null');

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { action, event, eventId } = body;

        console.log('Action:', action);
        console.log('Event data:', event);

        if (action === 'create') {
            const created = await createCalendarEvent(session.accessToken, {
                title: event.title,
                description: event.description,
                start: new Date(event.start),
                end: new Date(event.end),
                allDay: event.allDay,
            });
            console.log('Created event:', created.id);
            return NextResponse.json({ success: true, event: created });
        }

        if (action === 'delete' && eventId) {
            await deleteCalendarEvent(session.accessToken, eventId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Calendar API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
