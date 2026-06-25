# PRINTFLOW - COMPLETE IMPLEMENTATION PLAN

## TECH STACK

Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* Socket.IO
* Clerk Authentication
* Resend (Emails)
* Cloudinary (File Storage)

Admin Dashboard

* React
* Vite
* React Router
* Axios
* Tailwind CSS

Student App

* React Native (Expo)
* Axios
* Clerk
* Socket.IO Client

---

# DATABASE COLLECTIONS

## Users

{
_id,
clerkId,
name,
email,

userType,
role,

department,
rollNo,

createdAt
}

userType:

* student
* faculty

role:

* user
* operator
* admin

---

## Printers

{
_id,

name,

location,

status,

pagesPerMinute,

printerType,

operatorId,

currentQueueLength
}

status:

* online
* offline
* maintenance

printerType:

* bw
* color

---

## Orders

{
_id,

userId,

printerId,

fileName,

fileUrl,

totalPages,

copies,

status,

queuePosition,

eta,

confidential,

priorityLevel,

estimatedCost,

createdAt
}

status:

* pending
* accepted
* printing
* ready
* collected
* cancelled

priorityLevel:

* normal
* priority

---

# STUDENT APP FLOW

Login
↓
Upload Document
↓
Recommendation Screen
↓
Choose Printer
↓
Create Order
↓
Track Status
↓
Collect Print

---

# FACULTY FLOW

Login
↓
Upload Document
↓
Enable Confidential Mode
↓
Choose Printer
↓
Track Order

Confidential Mode:

* Hidden file preview
* Visible only to assigned operator

---

# OPERATOR FLOW

Dashboard
↓
Assigned Printers
↓
Pending Orders
↓
Accept Order
↓
Start Printing
↓
Mark Ready
↓
Mark Collected

---

# ADMIN FLOW

Dashboard
↓
Manage Printers
↓
Assign Operators
↓
View Analytics
↓
Override Queue

---

# RECOMMENDATION ENGINE

Input:

Pages
Copies
Printer Type

Backend checks:

Queue Length
Pages Per Minute
Current Load
Price

Returns:

[
{
printer:"Library A",
eta:2,
cost:20
},
{
printer:"Library B",
eta:5,
cost:18
}
]

---

# COST CALCULATION

BW:

₹2/page

Color:

₹5/page

Priority:

+50%

Formula:

cost =
pages × copies × rate

if priority:
cost *= 1.5

---

# ETA CALCULATION

For each printer:

Pending Pages =
sum(all pending pages)

ETA =
Pending Pages / pagesPerMinute

Example:

Queue Pages:
30

PPM:
15

ETA:
2 minutes

---

# DYNAMIC QUEUE

Each printer maintains independent queue.

Example:

Printer A

Order1
Order2
Order3

Queue Positions

1
2
3

---

# QUEUE RECALCULATION EVENTS

1. New Order

2. Order Cancelled

3. Order Completed

4. Printer Offline

5. Priority Order Inserted

---

# PRIORITY QUEUE

Current:

A
B
C
D

Priority:

P

Result:

A
P
B
C
D

Current printing order never interrupted.

---

# PRINTER FAILURE RECOVERY

Printer A offline

Orders:

B
C
D

Move to:

Printer B

Recalculate:

Queue
ETA
Position

Send notification.

---

# SOCKET EVENTS

Student

queueUpdated

statusChanged

printerChanged

etaChanged

---

Admin

newOrder

printerOffline

queueChanged

---

# API ENDPOINTS

USERS

POST /api/users

GET /api/users/:id

PATCH /api/users/:id

---

PRINTERS

POST /api/printers

GET /api/printers

GET /api/printers/:id

PATCH /api/printers/:id

DELETE /api/printers/:id

PATCH /api/printers/:id/status

PATCH /api/printers/:id/operator

---

ORDERS

POST /api/orders

GET /api/orders

GET /api/orders/:id

PATCH /api/orders/:id/status

PATCH /api/orders/:id/cancel

PATCH /api/orders/:id/priority

---

RECOMMENDATIONS

POST /api/recommendations

Request:

{
pages:10,
copies:2,
printerType:"bw",
priority:false
}

---

ANALYTICS

GET /api/analytics

Response:

{
totalOrders,
activePrinters,
averageETA,
todayOrders
}

---

# ADMIN DASHBOARD PAGES

1 Dashboard

Cards:

* Orders Today
* Active Printers
* Average ETA
* Revenue

---

2 Orders

Table:

Order ID
User
Pages
ETA
Status

Actions:

Accept
Print
Ready
Collected

---

3 Printers

Table:

Name
Location
Status
Operator

Actions:

Add
Edit
Delete

---

4 Operators

Table:

Name
Assigned Printers

Actions:

Assign Printer

---

5 Analytics

Charts:

Orders per Day
Printer Utilization
Average Wait Time

---

# REACT NATIVE SCREENS

1 Login

2 Home

3 Upload Document

4 Printer Recommendations

5 Order Tracking

6 Order History

7 Profile

---

# MVP FOR HACKATHON

Must Have:

✓ Authentication
✓ Upload
✓ Recommendation Engine
✓ Dynamic Queue
✓ ETA
✓ Admin Dashboard
✓ Role Management
✓ Printer Management

Nice To Have:

✓ Socket.IO
✓ Analytics
✓ Priority Printing
✓ Confidential Printing
