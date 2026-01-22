// Calendar sync utilities for frontend
// These functions call the Calendar API from the client side

export interface CalendarSyncResult {
    success: boolean;
    eventId?: string;
    error?: string;
}

/**
 * Create a Google Calendar event from a task
 * Returns the event ID so it can be stored with the task
 */
export async function syncTaskToCalendar(task: {
    title: string;
    description?: string;
    due_date: string;
    due_time?: string;
}): Promise<CalendarSyncResult> {
    try {
        // Parse the due date - use string parts to avoid timezone issues
        const [year, month, day] = task.due_date.split('-').map(Number);

        // Create dates in local timezone
        let startDateTime: Date;
        let endDateTime: Date;
        let allDay = true;

        if (task.due_time) {
            const [hours, minutes] = task.due_time.split(':').map(Number);
            startDateTime = new Date(year, month - 1, day, hours, minutes, 0);
            endDateTime = new Date(year, month - 1, day, hours + 1, minutes, 0);
            allDay = false;
        } else {
            // For all-day events, set to 9 AM - 10 AM
            startDateTime = new Date(year, month - 1, day, 9, 0, 0);
            endDateTime = new Date(year, month - 1, day, 10, 0, 0);
        }

        console.log('Syncing task to calendar:', {
            title: task.title,
            due_date: task.due_date,
            startDateTime: startDateTime.toISOString(),
            endDateTime: endDateTime.toISOString(),
        });

        // Use the task title directly (no prefix) for consistency
        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                event: {
                    title: task.title, // No prefix - matches what Calendar page does
                    description: task.description || '',
                    start: startDateTime.toISOString(),
                    end: endDateTime.toISOString(),
                    allDay: allDay,
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Failed to sync' };
        }

        const data = await response.json();
        return { success: true, eventId: data.event?.id };
    } catch (error) {
        console.error('Calendar sync error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Delete a Google Calendar event by its ID
 */
export async function deleteCalendarEvent(eventId: string): Promise<CalendarSyncResult> {
    try {
        console.log('Deleting calendar event:', eventId);

        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                eventId: eventId,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.error || 'Failed to delete' };
        }

        console.log('Calendar event deleted successfully');
        return { success: true };
    } catch (error) {
        console.error('Calendar delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Find and delete a Google Calendar event by task title and date
 * Used as fallback when calendar_event_id is not stored
 */
export async function findAndDeleteTaskEvent(task: {
    title: string;
    due_date: string;
}): Promise<CalendarSyncResult> {
    try {
        // 1. Fetch events for the due date
        const [year, month, day] = task.due_date.split('-').map(Number);

        // Set time range for the whole day
        const timeMin = new Date(year, month - 1, day, 0, 0, 0);
        const timeMax = new Date(year, month - 1, day, 23, 59, 59);

        const params = new URLSearchParams({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
        });

        console.log('Searching for event to delete:', task.title, 'on', task.due_date);

        const response = await fetch(`/api/calendar?${params.toString()}`);
        if (!response.ok) {
            return { success: false, error: 'Failed to fetch events' };
        }

        const data = await response.json();
        const events = data.events || [];

        console.log('Found events:', events.length);

        // 2. Find the matching event - try exact match first, then with prefix
        const matchingEvent = events.find((event: { summary?: string; id?: string }) =>
            event.summary === task.title ||
            event.summary === `[Task] ${task.title}`
        );

        if (matchingEvent && matchingEvent.id) {
            console.log('Found matching event to delete:', matchingEvent.id, matchingEvent.summary);
            // 3. Delete the event
            return await deleteCalendarEvent(matchingEvent.id);
        } else {
            console.log('No matching calendar event found for task:', task.title);
            // Not finding an event is not an error - maybe it was never synced
            return { success: true, error: 'Event not found (may not have been synced)' };
        }

    } catch (error) {
        console.error('Find and delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if user is connected to Google Calendar
 */
export async function isCalendarConnected(): Promise<boolean> {
    try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();
        return !!session?.accessToken;
    } catch {
        return false;
    }
}
