<!-- Source: https://docs.moss.dev/docs/founding-agent/embed/booking.md -->
# Demo booking

> Let visitors book a demo by voice, backed by your Cal.com, Calendly or Google Calendar.

## Enable booking in the portal

**1. Open the Demo Booking tab**

In the portal at [https://portal.usemoss.dev/fa](https://portal.usemoss.dev/fa), open your agent and go to the Demo Booking tab.

**2. Turn on booking**

Switch on **Enable demo booking** and click **Save**.

**3. Connect your calendar**

In the Calendar card, choose Cal.com, Calendly, or Google Calendar, follow the steps for that provider below, and click **Save**. All three work with the same voice flow.

> [tab] Cal.com
>
> Paste your event link into **Cal.com event URL**, for example `https://cal.com/you/30min`.

> [tab] Calendly
>
> **1. Connect your account**
>
> Click **Connect Calendly** and authorize access in Calendly. Calendly's booking API is only available on paid plans (Standard or above).
>
> **2. Choose an event type**
>
> Pick the event type the agent should book.
>
> > [!NOTE]
> >
> > Calendly events must have a single fixed or video location. Events that ask the visitor for a location or a phone number ("ask invitee" and "outbound call"), events with more than one location, and physical events without an address are listed but cannot be selected (and are rejected if sent through the API). Calendly select questions are shown as free-text fields in the booking form.

> [tab] Google Calendar
>
> **1. Connect your account**
>
> Click **Connect Google Calendar** and allow access with the Google account that owns the calendar. Personal Google accounts and Google Workspace both work; a Workspace administrator may need to allow the Moss app first.
>
> **2. Pick a calendar**
>
> Choose the calendar the agent should book on.
>
> **3. Set your booking rules**
>
> Confirm the meeting length, bookable days and hours, buffer between meetings, minimum notice, and time zone. Meeting length and time zone are prefilled from your Google settings.
>
> Visitors receive a Google Calendar invitation with a Google Meet link.
>
> > [!NOTE]
> >
> > The agent only offers times inside the hours you set that are free on the chosen calendar. Changes you make to the event in Google Calendar do not sync back to Moss. Times use the time zone set in your booking rules; visitors see them in their own.

Any extra questions you add to the event appear in the booking form that the agent presents during the call.

If Calendly or Google stops accepting the connection, the Demo Booking tab shows a reconnect button.

## How it works in the widget

**1. The visitor asks to book a demo**

The visitor says something like "I'd like to book a demo" during the voice session.

**2. The agent opens the booking form**

The agent opens the booking form and reads back the available days and times from your connected calendar event.

**3. The visitor picks a time by voice**

The visitor selects a time slot by speaking their preference.

**4. The agent confirms and advances to details**

The agent confirms the chosen time and moves to the details step, asking for the visitor's name and email.

**5. The visitor submits and receives confirmation**

The visitor submits their details. The agent confirms the booking out loud, and a confirmation email is sent to the visitor.

> [!NOTE]
>
> Booking uses the `bookingNonce` returned by your token route, so no extra wiring is needed when you use the provided components.
