import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        console.log('GET /api/calendar');

        if (!session?.accessToken) {
            console.log('No access token found');
            return NextResponse.json({ error: 'Not authenticated', events: [] }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeMin = searchParams.get('timeMin');
        const timeMax = searchParams.get('timeMax');

        console.log('Fetching events:', { timeMin, timeMax });

        const events = await getCalendarEvents(
            session.accessToken,
            timeMin ? new Date(timeMin) : undefined,
            timeMax ? new Date(timeMax) : undefined
        );

        console.log('Fetched events:', events.length);

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Calendar API GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar events', events: [] }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        console.log('POST /api/calendar');

        if (!session?.accessToken) {
            console.log('No access token found');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { action, event, eventId } = body;

        console.log('Action:', action);
        console.log('EventId:', eventId);
        console.log('Event data:', JSON.stringify(event, null, 2));

        if (action === 'create') {
            const created = await createCalendarEvent(session.accessToken, {
                title: event.title,
                description: event.description || '',
                start: new Date(event.start),
                end: new Date(event.end),
                allDay: event.allDay || false,
            });
            console.log('Created event ID:', created.id);
            return NextResponse.json({ success: true, event: created });
        }

        if (action === 'update' && eventId) {
            const updated = await updateCalendarEvent(session.accessToken, eventId, {
                title: event.title,
                description: event.description || '',
                start: new Date(event.start),
                end: new Date(event.end),
                allDay: event.allDay || false,
            });
            console.log('Updated event ID:', updated.id);
            return NextResponse.json({ success: true, event: updated });
        }

        if (action === 'delete' && eventId) {
            console.log('Deleting event:', eventId);
            await deleteCalendarEvent(session.accessToken, eventId);
            console.log('Event deleted successfully');
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Calendar API POST error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
        return NextResponse.json({ error: errorMessage, success: false }, { status: 500 });
    }
}
