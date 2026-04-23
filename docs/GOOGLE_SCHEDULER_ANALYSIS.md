# Google Scheduler Creation Analysis

## Overview
This document analyzes the Google Meet scheduler creation flow in both the frontend and backend of the application.

---

## Backend Implementation

### Location
- **Controller**: [`nodejs-express-api/controllers/scheduler.js`](../nodejs-express-api/controllers/scheduler.js)
- **Helper**: [`nodejs-express-api/helpers/googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js)

### Scheduler Add Endpoint

**Route**: `POST /scheduler/add`

**File**: `nodejs-express-api/controllers/scheduler.js` (Lines 102-128)

```javascript
router.post('/add/', 
	[
		body('user_id').optional({nullable: true, checkFalsy: true}),
		body('grade').optional({nullable: true, checkFalsy: true}),
		body('learning_area').optional({nullable: true, checkFalsy: true}),
		body('strand').optional({nullable: true, checkFalsy: true}),
		body('start_date').optional({nullable: true, checkFalsy: true}),
		body('end_date').optional({nullable: true, checkFalsy: true}),
		body('status').optional({nullable: true, checkFalsy: true}),
		body('link').optional({nullable: true, checkFalsy: true}),
		body('meetingid').optional({nullable: true, checkFalsy: true}),
	], validateFormData
, async function (req, res) {
	try{
		let modeldata = req.getValidFormData();
		await beforeAdd(modeldata, req);
		
		//save Scheduler record
		let record = await DB.Scheduler.create(modeldata);
		const recid =  record['id'];
		
		return res.ok(record);
	} catch(err){
		return res.serverError(err);
	}
});
```

### Google Meet Creation Logic

**Function**: `beforeAdd()` (Lines 130-165)

```javascript
async function beforeAdd(postdata, req) {
    try {
        console.log("Postdata:", postdata);
        const hostemail = req.user.email || "nzukipk@gmail.com";
        const summary = `${postdata.grade} ${postdata.learning_area} ${postdata.strand || ""}`.trim();
        const description = `Lesson on ${postdata.learning_area} for grade ${postdata.grade}`;

        // Convert local time to UTC
        const localTimeZone = 'Africa/Nairobi';
        const startTime = new Date(`${postdata.start_date}:00`).toISOString();
        const endTime = new Date(`${postdata.end_date}:00`).toISOString();

        console.log(`Creating Meet event: ${summary}, Start: ${startTime}, End: ${endTime}`);

        const meetData = await createMeetEvent({
            summary,
            description,
            startTime,
            endTime,
            timeZone: localTimeZone,
            hostemail
        });

        // Use the correct property names from the API response
        console.log("meta", meetData)
        postdata.link = meetData.meetingUrl; 
        postdata.meetingid = meetData.eventId;     
       
        console.log(`Google Meet created: ${postdata.link} (ID: ${postdata.meetingid})`);
       
        return postdata;
    } catch (error) {
        console.error("Error creating Google Meet:", error);
        throw new Error(`Failed to create Google Meet: ${error.message}`);
    }
}
```

### Key Backend Features

1. **Automatic Google Meet Creation**: When a scheduler record is added, a Google Meet event is automatically created
2. **Data Enrichment**: The `beforeAdd` hook enriches the scheduler data with:
   - `link`: Google Meet URL
   - `meetingid`: Google Calendar Event ID
3. **Time Zone Handling**: Converts local time (Africa/Nairobi) to UTC
4. **Host Email**: Uses the authenticated user's email or defaults to "nzukipk@gmail.com"
5. **Meeting Summary**: Combines grade, learning area, and strand for the meeting title
6. **Error Handling**: Catches and logs errors during Google Meet creation

---

## Google Meet Helper

### Location
**File**: [`nodejs-express-api/helpers/googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js)

### Key Functions

#### 1. `createMeetEvent()` (Lines 275-449)

Creates a Google Calendar event with Google Meet conference data.

**Parameters**:
```javascript
{
    summary: "Meeting title",
    description: "Meeting description",
    startTime: "ISO 8601 datetime",
    endTime: "ISO 8601 datetime",
    timeZone: "IANA timezone",
    hostemail: "host@example.com"
}
```

**Returns**:
```javascript
{
    success: true,
    meetingUrl: "https://meet.google.com/xxx-xxxx-xxx",
    eventId: "calendar_event_id",
    start: { dateTime, timeZone },
    end: { dateTime, timeZone },
    htmlLink: "calendar_event_link",
    conferenceData: { ... }
}
```

**Key Features**:
- Validates required fields (hostemail, startTime, endTime)
- Validates time formats and ensures end time is after start time
- Creates Google Calendar event with conference data
- Uses Google Calendar API v3
- Conference solution: "hangoutsMeet"
- Returns meeting URL and event ID

#### 2. `authorize()` (Lines 231-269)

Handles OAuth2 authorization for Google Calendar API.

**Flow**:
1. Attempts to load saved credentials from `token.json`
2. If credentials exist, validates access token
3. If no valid credentials, generates authorization URL
4. Throws error prompting user to authorize

#### 3. `getAuthUrl()` (Lines 107-145)

Generates OAuth2 authorization URL for user consent.

**Scopes**:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

#### 4. `exchangeCodeForTokens()` (Lines 191-225)

Exchanges authorization code for access and refresh tokens.

#### 5. `loadSavedCredentials()` (Lines 33-59)

Loads OAuth2 credentials from `token.json` file.

#### 6. `saveCredentials()` (Lines 65-97)

Saves OAuth2 credentials with refresh token to `token.json`.

### Configuration Files

1. **credentials.json**: OAuth2 client credentials (client_id, client_secret, redirect_uris)
2. **token.json**: Stored access and refresh tokens

---

## Frontend Implementation

### Location
**File**: [`frontend/src/pages/scheduler/add.vue`](../frontend/src/pages/scheduler/add.vue)

### Form Structure

The frontend form collects the following data:

1. **Teacher** (user_id) - Dropdown with user selection
2. **Grade** - Dropdown with grade options
3. **Learning Area/Subject** - Text input
4. **Strand/Topic** - Text input
5. **Start Date** - DateTime picker (YYYY-MM-DD HH:mm)
6. **End Date** - DateTime picker (YYYY-MM-DD HH:mm)
7. **Status** - Text input (default: "upcoming")
8. **Link** - Text input (default: "NULL")
9. **Meetingid** - Text input (default: "NULL")

### Key Frontend Features

#### Form Data (Lines 298-301)
```javascript
pageData: {
    user_id: "", 
    grade: "", 
    learning_area: "", 
    strand: "", 
    start_date: new Date(), 
    end_date: new Date(), 
    status: "upcoming", 
    link: "NULL", 
    meetingid: "NULL"
}
```

#### API Endpoint (Lines 252-255)
```javascript
apiPath: 'scheduler/add'
```

#### Form Submission Flow

1. **beforeSubmit()** (Lines 320-323)
   - Logs form data
   - Returns true to proceed with submission

2. **submitForm()** (inherited from useAddPage composable)
   - Validates form data
   - Sends POST request to `/scheduler/add`
   - Calls beforeSubmit before sending
   - Calls afterSubmit after successful response

3. **afterSubmit()** (Lines 326-336)
   - Shows success message
   - Resets form to default values
   - Closes dialog if opened as dialog
   - Redirects to `/scheduler` list page

### Important Notes

1. **Link and Meeting ID Fields**: The frontend includes input fields for `link` and `meetingid`, but these are set to "NULL" by default. The backend automatically populates these fields during the `beforeAdd` hook.

2. **No Frontend Google Meet Integration**: The frontend does NOT directly create Google Meet events. It simply submits the form data to the backend, which handles the Google Meet creation.

3. **DateTime Format**: The frontend uses `YYYY-MM-DD HH:mm` format for date/time inputs, which the backend converts to ISO 8601 format.

---

## Data Flow

### Complete Flow Diagram

```
Frontend (add.vue)
    ↓
    User fills form:
    - Teacher (user_id)
    - Grade
    - Learning Area
    - Strand
    - Start Date/Time
    - End Date/Time
    - Status
    ↓
    submitForm() → POST /scheduler/add
    ↓
Backend (scheduler.js)
    ↓
    Validation (express-validator)
    ↓
    beforeAdd(modeldata, req)
        ↓
        Extract user email
        ↓
        Build meeting summary & description
        ↓
        Convert times to UTC
        ↓
        Call createMeetEvent() → googleMeet.js
            ↓
            authorize() → Load/validate OAuth2 credentials
            ↓
            Create Google Calendar event with Meet
            ↓
            Return { meetingUrl, eventId, ... }
        ↓
        Enrich modeldata:
        - link = meetingUrl
        - meetingid = eventId
    ↓
    DB.Scheduler.create(modeldata)
    ↓
    Return record with Google Meet data
    ↓
Frontend
    ↓
    afterSubmit(response)
    ↓
    Show success message
    ↓
    Redirect to /scheduler
```

---

## Issues and Recommendations

### Current Issues

1. **Manual Link/Meeting ID Fields**: The frontend shows input fields for `link` and `meetingid`, which are confusing since they're auto-generated by the backend.

2. **Error Handling**: If Google Meet creation fails, the entire scheduler creation fails. There's no fallback mechanism.

3. **Time Format Inconsistency**: The backend appends `:00` to the datetime string, which assumes seconds are always 00.

4. **No Loading Indicator**: The frontend doesn't show a specific loading state for Google Meet creation.

5. **No Validation Feedback**: If Google Meet creation fails, the user doesn't get clear feedback about what went wrong.

### Recommendations

#### 1. Hide Auto-Generated Fields
Make `link` and `meetingid` fields read-only or hidden in the frontend:

```vue
<!-- Remove or make read-only -->
<div class="col-12" v-if="formData.link && formData.link !== 'NULL'">
    <div class="row">
        <div class="col-sm-3 col-12">
            Google Meet Link
        </div>
        <div class="col-sm-9 col-12">
            <q-input readonly ref="ctrllink" v-model.trim="formData.link" 
                     label="Google Meet Link" type="text">
                <template v-slot:append>
                    <q-btn flat icon="content_copy" @click="copyToClipboard(formData.link)">
                        <q-tooltip>Copy link</q-tooltip>
                    </q-btn>
                </template>
            </q-input>
        </div>
    </div>
</div>
```

#### 2. Add Better Error Handling

**Backend**:
```javascript
async function beforeAdd(postdata, req) {
    try {
        // ... existing code ...
        const meetData = await createMeetEvent({ ... });
        
        if (!meetData.success) {
            console.error("Google Meet creation failed:", meetData.error);
            // Option 1: Fail the entire operation
            throw new Error(`Failed to create Google Meet: ${meetData.error}`);
            
            // Option 2: Continue without Google Meet
            // postdata.link = null;
            // postdata.meetingid = null;
            // postdata.status = 'pending_meet_creation';
        } else {
            postdata.link = meetData.meetingUrl; 
            postdata.meetingid = meetData.eventId;
        }
        
        return postdata;
    } catch (error) {
        console.error("Error in beforeAdd:", error);
        throw error; // Re-throw to be caught by route handler
    }
}
```

#### 3. Improve Time Handling

```javascript
// Better time parsing
const startTime = new Date(postdata.start_date).toISOString();
const endTime = new Date(postdata.end_date).toISOString();

// Validate times
if (isNaN(new Date(startTime).getTime())) {
    throw new Error("Invalid start date format");
}
if (isNaN(new Date(endTime).getTime())) {
    throw new Error("Invalid end date format");
}
```

#### 4. Add Loading State in Frontend

```javascript
// In beforeSubmit
function beforeSubmit(){
    console.log("beforeSubmit", formData);
    app.showProgress("Creating Google Meet event...");
    return true;
}

// In afterSubmit
function afterSubmit(response) {
    app.hideProgress();
    app.flashMsg(props.msgTitle, props.msgAfterSave);
    // ... rest of code
}
```

#### 5. Add Authorization Check Endpoint

Create an endpoint to check if Google Calendar is authorized:

```javascript
// Backend
router.get('/check-google-auth', async (req, res) => {
    try {
        const client = await loadSavedCredentials();
        if (client) {
            return res.ok({ authorized: true });
        }
        const authUrl = await getAuthUrl();
        return res.ok({ authorized: false, authUrl });
    } catch (error) {
        return res.serverError(error);
    }
});
```

---

## Testing Checklist

### Backend Testing

- [ ] Test with valid scheduler data
- [ ] Test with missing required fields
- [ ] Test with invalid date formats
- [ ] Test with end time before start time
- [ ] Test without Google OAuth authorization
- [ ] Test with expired OAuth tokens
- [ ] Test with invalid user email
- [ ] Test timezone conversion accuracy

### Frontend Testing

- [ ] Test form validation
- [ ] Test date/time picker functionality
- [ ] Test form submission with valid data
- [ ] Test error handling on submission failure
- [ ] Test redirect after successful submission
- [ ] Test form reset after submission
- [ ] Test as standalone page
- [ ] Test as dialog component

### Integration Testing

- [ ] Verify Google Meet link is created
- [ ] Verify meeting appears in Google Calendar
- [ ] Verify meeting details match form data
- [ ] Verify attendee receives calendar invite
- [ ] Verify meeting link is accessible
- [ ] Verify meeting ID is stored correctly

---

## Summary

### Backend
✅ **Working**: Automatic Google Meet creation via `beforeAdd` hook
✅ **Working**: OAuth2 authorization flow
✅ **Working**: Calendar event creation with conference data
⚠️ **Needs Improvement**: Error handling and fallback mechanisms
⚠️ **Needs Improvement**: Time format parsing

### Frontend
✅ **Working**: Form data collection and submission
✅ **Working**: Date/time picker integration
✅ **Working**: Success handling and redirect
⚠️ **Needs Improvement**: Hide/disable auto-generated fields
⚠️ **Needs Improvement**: Loading state for Google Meet creation
⚠️ **Needs Improvement**: Better error feedback

### Overall Assessment
The Google Scheduler creation flow is **functional** but could benefit from:
1. Better UX for auto-generated fields
2. Improved error handling
3. Authorization status checking
4. More robust time parsing
5. Better user feedback during Meet creation
