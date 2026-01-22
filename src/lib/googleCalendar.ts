import { google, calendar_v3 } from 'googleapis';

export interface CalendarEvent {
    id?: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
}

export async function getCalendarClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getCalendarEvents(
    accessToken: string,
    timeMin?: Date,
    timeMax?: Date
): Promise<calendar_v3.Schema$Event[]> {
    const calendar = await getCalendarClient(accessToken);

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString() || new Date().toISOString(),
        timeMax: timeMax?.toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
    });

    return response.data.items || [];
}

export async function createCalendarEvent(
    accessToken: string,
    event: CalendarEvent
): Promise<calendar_v3.Schema$Event> {
    const calendar = await getCalendarClient(accessToken);

    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary: event.title,
            description: event.description,
            start: event.allDay
                ? { date: event.start.toISOString().split('T')[0] }
                : { dateTime: event.start.toISOString() },
            end: event.allDay
                ? { date: event.end.toISOString().split('T')[0] }
                : { dateTime: event.end.toISOString() },
        },
    });

    return response.data;
}

export async function updateCalendarEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
): Promise<calendar_v3.Schema$Event> {
    const calendar = await getCalendarClient(accessToken);

    const updateData: calendar_v3.Schema$Event = {};
    if (event.title) updateData.summary = event.title;
    if (event.description) updateData.description = event.description;
    if (event.start) {
        updateData.start = event.allDay
            ? { date: event.start.toISOString().split('T')[0] }
            : { dateTime: event.start.toISOString() };
    }
    if (event.end) {
        updateData.end = event.allDay
            ? { date: event.end.toISOString().split('T')[0] }
            : { dateTime: event.end.toISOString() };
    }

    const response = await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: updateData,
    });

    return response.data;
}

export async function deleteCalendarEvent(
    accessToken: string,
    eventId: string
): Promise<void> {
    const calendar = await getCalendarClient(accessToken);

    await calendar.events.delete({
        calendarId: 'primary',
        eventId,
    });
}
