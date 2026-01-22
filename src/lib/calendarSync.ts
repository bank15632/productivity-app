// Calendar sync utilities for frontend
// These functions call the Calendar API from the client side

export interface CalendarSyncResult {
    success: boolean;
    eventId?: string;
    error?: string;
}

/**
 * Create a Google Calendar event from a task
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

        const response = await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                event: {
                    title: `[Task] ${task.title}`,
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
 * Delete a Google Calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<CalendarSyncResult> {
    try {
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
