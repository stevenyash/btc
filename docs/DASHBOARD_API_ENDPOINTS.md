# Dashboard API Endpoints Documentation

This document outlines the API endpoints required for the Marketer and Teacher dashboards.

## Authentication
All endpoints require authentication. The backend should filter data based on the logged-in user's role and ID.

---

## Marketer Dashboard Endpoints

### 1. Total Points Earned
**Endpoint:** `GET /api/components_data/getcount_totalpointsearned`

**Description:** Returns the total points earned by the logged-in marketer.

**Response:**
```json
{
  "num": 850
}
```

---

### 2. Total Invites Count
**Endpoint:** `GET /api/components_data/getcount_invites`

**Description:** Returns the total number of invites sent by the logged-in marketer.

**Response:**
```json
{
  "num": 42
}
```

---

### 3. Active Referrals Count
**Endpoint:** `GET /api/components_data/getcount_activereferrals`

**Description:** Returns the number of active referrals for the logged-in marketer.

**Response:**
```json
{
  "num": 28
}
```

---

### 4. Marketer Dashboard Data
**Endpoint:** `GET /api/components_data/marketer_dashboard_data`

**Description:** Returns dashboard overview metrics for the logged-in marketer.

**Response:**
```json
{
  "conversion_rate": 68,
  "active_referrals": 28,
  "weekly_growth": 5
}
```

---

### 5. Marketer Performance Data
**Endpoint:** `GET /api/components_data/marketer_performance_data`

**Description:** Returns performance metrics for the logged-in marketer.

**Response:**
```json
{
  "weekly_invites": 15,
  "monthly_conversions": 42,
  "monthly_points": 850,
  "target_progress": 65
}
```

---

### 6. Marketer Recent Activity
**Endpoint:** `GET /api/components_data/marketer_recent_activity`

**Description:** Returns recent activity timeline for the logged-in marketer.

**Response:**
```json
[
  {
    "icon": "person_add",
    "color": "positive",
    "time": "2 hours ago",
    "title": "New Referral",
    "description": "John Doe signed up"
  },
  {
    "icon": "email",
    "color": "primary",
    "time": "5 hours ago",
    "title": "Invite Sent",
    "description": "3 invites sent successfully"
  },
  {
    "icon": "stars",
    "color": "amber",
    "time": "1 day ago",
    "title": "Points Earned",
    "description": "+50 points from referrals"
  }
]
```

---

### 7. Marketer Invites List
**Endpoint:** `GET /api/invites/index?page=1&limit=10`

**Description:** Returns paginated list of invites for the logged-in marketer.

**Important:** This endpoint MUST filter invites by the logged-in user's ID (user_id field).

**Response:**
```json
{
  "records": [
    {
      "id": 1,
      "phone_no": "254712345678",
      "email": "john@example.com",
      "status": "pending",
      "created_at": "2024-01-15",
      "user_id": 123
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

---

## Teacher Dashboard Endpoints

### 1. Total Classes Count
**Endpoint:** `GET /api/components_data/getcount_teacherclasses`

**Description:** Returns the total number of classes for the logged-in teacher.

**Response:**
```json
{
  "num": 24
}
```

---

### 2. Active Students Count
**Endpoint:** `GET /api/components_data/getcount_activestudents`

**Description:** Returns the number of active students for the logged-in teacher.

**Response:**
```json
{
  "num": 156
}
```

---

### 3. Teacher Dashboard Data
**Endpoint:** `GET /api/components_data/teacher_dashboard_data`

**Description:** Returns dashboard overview metrics for the logged-in teacher.

**Response:**
```json
{
  "total_classes": 24,
  "active_students": 156,
  "upcoming_sessions": 8,
  "completion_rate": 87,
  "weekly_growth": 3
}
```

---

### 4. Teacher Today's Schedule
**Endpoint:** `GET /api/components_data/teacher_today_schedule`

**Description:** Returns today's scheduled classes for the logged-in teacher.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Mathematics - Algebra",
    "grade": "Grade 8",
    "subject": "Mathematics",
    "time": "09:00 AM",
    "status": "Upcoming",
    "statusColor": "primary",
    "icon": "calculate",
    "color": "primary",
    "link": "https://meet.google.com/abc-defg-hij"
  },
  {
    "id": 2,
    "title": "Science - Biology",
    "grade": "Grade 7",
    "subject": "Science",
    "time": "11:00 AM",
    "status": "Upcoming",
    "statusColor": "orange",
    "icon": "science",
    "color": "positive",
    "link": "https://meet.google.com/xyz-uvwx-yz"
  }
]
```

---

### 5. Teacher Class Statistics
**Endpoint:** `GET /api/components_data/teacher_class_stats`

**Description:** Returns class statistics for the logged-in teacher.

**Response:**
```json
{
  "weekly_classes": 12,
  "completed_classes": 18,
  "pending_classes": 6,
  "avg_duration": 45
}
```

---

### 6. Teacher Performance Data
**Endpoint:** `GET /api/components_data/teacher_performance_data`

**Description:** Returns performance metrics for the logged-in teacher.

**Response:**
```json
{
  "student_engagement": 85,
  "attendance_rate": 92,
  "content_completion": 78,
  "student_satisfaction": 88
}
```

---

### 7. Teacher Recent Activity
**Endpoint:** `GET /api/components_data/teacher_recent_activity`

**Description:** Returns recent activity timeline for the logged-in teacher.

**Response:**
```json
[
  {
    "icon": "videocam",
    "color": "positive",
    "time": "1 hour ago",
    "title": "Class Completed",
    "description": "Grade 5 - Mathematics"
  },
  {
    "icon": "event",
    "color": "primary",
    "time": "3 hours ago",
    "title": "Schedule Created",
    "description": "New session for tomorrow"
  },
  {
    "icon": "people",
    "color": "secondary",
    "time": "5 hours ago",
    "title": "New Students",
    "description": "3 students joined your class"
  }
]
```

---

### 8. Teacher Schedule List
**Endpoint:** `GET /api/scheduler/teachersscheduler?page=1&limit=10`

**Description:** Returns paginated list of schedules for the logged-in teacher.

**Important:** This endpoint MUST filter schedules by the logged-in teacher's ID.

**Response:**
```json
{
  "records": [
    {
      "id": 1,
      "grade": "Grade 8",
      "learning_area": "Mathematics",
      "strand": "Algebra",
      "start_date": "2024-01-15 09:00:00",
      "end_date": "2024-01-15 10:00:00",
      "status": "scheduled",
      "link": "https://meet.google.com/abc-defg-hij"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
```

---

## Implementation Notes

### Backend Filtering Requirements

1. **User-Specific Data:**
   - All endpoints MUST filter data based on the authenticated user's ID
   - Use the JWT token or session to identify the logged-in user
   - Apply WHERE clauses to filter by user_id or teacher_id

2. **Role-Based Access:**
   - Verify the user's role before returning data
   - Marketers should only access marketer endpoints
   - Teachers should only access teacher endpoints

3. **Example SQL Filtering:**
   ```sql
   -- For marketer invites
   SELECT * FROM invites WHERE user_id = :logged_in_user_id
   
   -- For teacher schedules
   SELECT * FROM scheduler WHERE teacher_id = :logged_in_user_id
   ```

4. **Security:**
   - Never expose other users' data
   - Validate all user inputs
   - Use parameterized queries to prevent SQL injection

### Frontend Implementation

The frontend dashboards are already configured to:
- Call the correct API endpoints
- Handle loading states
- Display error messages
- Refresh data on demand
- Show empty states when no data is available

### Testing

Test each endpoint with:
1. Valid authenticated user
2. Different user roles
3. Empty data scenarios
4. Pagination
5. Error conditions
