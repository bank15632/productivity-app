import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCalendarEvents, createCalendarEvent, deleteCalendarEvent } from '@/lib/googleCalendar';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const timeMin = searchParams.get('timeMin');
        const timeMax = searchParams.get('timeMax');

        const events = await getCalendarEvents(
            session.accessToken,
            timeMin ? new Date(timeMin) : undefined,
            timeMax ? new Date(timeMax) : undefined
        );

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { action, event, eventId } = body;

        if (action === 'create') {
            const created = await createCalendarEvent(session.accessToken, {
                title: event.title,
                description: event.description,
                start: new Date(event.start),
                end: new Date(event.end),
                allDay: event.allDay,
            });
            return NextResponse.json({ success: true, event: created });
        }

        if (action === 'delete' && eventId) {
            await deleteCalendarEvent(session.accessToken, eventId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
