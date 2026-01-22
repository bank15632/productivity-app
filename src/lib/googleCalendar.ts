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
    try {
        const calendar = await getCalendarClient(accessToken);

        console.log('Fetching calendar events...', { timeMin, timeMax });

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin?.toISOString() || new Date().toISOString(),
            timeMax: timeMax?.toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });

        console.log('Found events:', response.data.items?.length || 0);

        return response.data.items || [];
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
}

export async function createCalendarEvent(
    accessToken: string,
    event: CalendarEvent
): Promise<calendar_v3.Schema$Event> {
    try {
        const calendar = await getCalendarClient(accessToken);

        // Get timezone
        const timeZone = 'Asia/Bangkok';

        const eventData: calendar_v3.Schema$Event = {
            summary: event.title,
            description: event.description,
            start: event.allDay
                ? { date: event.start.toISOString().split('T')[0] }
                : { dateTime: event.start.toISOString(), timeZone },
            end: event.allDay
                ? { date: event.end.toISOString().split('T')[0] }
                : { dateTime: event.end.toISOString(), timeZone },
        };

        console.log('Creating calendar event:', eventData);

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: eventData,
        });

        console.log('Event created:', response.data.id);

        return response.data;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
}

export async function updateCalendarEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
): Promise<calendar_v3.Schema$Event> {
    const calendar = await getCalendarClient(accessToken);
    const timeZone = 'Asia/Bangkok';

    const updateData: calendar_v3.Schema$Event = {};
    if (event.title) updateData.summary = event.title;
    if (event.description) updateData.description = event.description;
    if (event.start) {
        updateData.start = event.allDay
            ? { date: event.start.toISOString().split('T')[0] }
            : { dateTime: event.start.toISOString(), timeZone };
    }
    if (event.end) {
        updateData.end = event.allDay
            ? { date: event.end.toISOString().split('T')[0] }
            : { dateTime: event.end.toISOString(), timeZone };
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
