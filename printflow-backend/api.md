# API_CONTRACT.md

# PrintFlow Backend API Contract

Base URL:

http://localhost:5000/api

---

# 1. USERS MODULE

Purpose:
Store additional user information after Clerk authentication.

## User Schema

{
"_id": "",
"clerkId": "",
"name": "",
"email": "",
"rollNo": "",
"department": "",
"year": 3,
"role": "student"
}

Roles:

* student
* operator
* admin

---

## Create User Profile

POST /users

Request:

{
"clerkId": "user_123",
"name": "Radha",
"email": "[radha@college.edu](mailto:radha@college.edu)",
"rollNo": "245A1A05A2",
"department": "CSE-AIML",
"year": 3
}

Response:

{
"success": true,
"user": {}
}

---

## Get Current User

GET /users/:clerkId

Response:

{
"user": {}
}

---

# 2. PRINTERS MODULE

Purpose:
Manage available printers.

## Printer Schema

{
"_id": "",
"name": "Printer A",
"type": "bw",
"status": "online",
"pagesPerMinute": 15,
"location": "Library"
}

Type:

* bw
* color

Status:

* online
* offline
* maintenance

---

## Create Printer

POST /printers

Request:

{
"name": "Printer A",
"type": "bw",
"pagesPerMinute": 15,
"location": "Library"
}

Response:

{
"success": true,
"printer": {}
}

---

## Get All Printers

GET /printers

Response:

[
{}
]

---

## Update Printer Status

PATCH /printers/:id/status

Request:

{
"status": "offline"
}

Response:

{
"success": true
}

---

# 3. ORDERS MODULE

Purpose:
Handle print requests.

## Order Schema

{
"_id": "",
"userId": "",
"printerId": "",
"fileUrl": "",
"fileName": "",
"totalPages": 10,
"copies": 2,
"status": "pending",
"priority": "normal",
"eta": 5,
"queuePosition": 2,
"pickupOtp": ""
}

Status:

* pending
* accepted
* printing
* ready
* collected
* cancelled

Priority:

* normal
* emergency
* faculty

---

## Create Order

POST /orders

Request:

{
"userId": "",
"printerId": "",
"fileUrl": "",
"fileName": "Resume.pdf",
"totalPages": 2,
"copies": 1
}

Response:

{
"success": true,
"order": {}
}

---

## Get All Orders

GET /orders

Response:

[
{}
]

---

## Get Single Order

GET /orders/:id

Response:

{
"order": {}
}

---

## Cancel Order

PATCH /orders/:id/cancel

Response:

{
"success": true
}

---

## Update Order Status

PATCH /orders/:id/status

Request:

{
"status": "printing"
}

Response:

{
"success": true
}

---

# 4. RECOMMENDATION MODULE

Purpose:
Suggest fastest printer.

## Get Recommendations

GET /recommendations

Response:

[
{
"printerName": "Printer A",
"eta": 2,
"queueLength": 1
}
]

---

# 5. PRIORITY REQUESTS

## Create Priority Request

POST /priority

Request:

{
"orderId": "",
"reason": "Interview"
}

---

## Approve Priority Request

PATCH /priority/:id/approve

---

## Reject Priority Request

PATCH /priority/:id/reject

---

# 6. OTP MODULE

## Generate Pickup OTP

POST /otp/generate

---

## Verify Pickup OTP

POST /otp/verify

Request:

{
"orderId": "",
"otp": "583914"
}

Response:

{
"verified": true
}

---

# 7. ANALYTICS MODULE

## Dashboard Analytics

GET /analytics

Response:

{
"ordersToday": 120,
"activePrinters": 5,
"averageWaitTime": 4,
"peakHour": "12 PM"
}
}

---

# 8. SOCKET EVENTS

Student Events

* orderAccepted
* orderPrinting
* orderReady
* queueUpdated
* printerReassigned

Admin Events

* newOrder
* printerOffline
* queueUpdated

}
 
1. User Model
2. Printer Model
3. Order Model

4. Printer CRUD APIs
5. Order CRUD APIs

6. Test everything in Postman

7. Recommendation Engine
8. Queue Engine
9. Socket.IO

10. Clerk Integration
11. Cloudinary
12. React & React Native Integration
