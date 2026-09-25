# Campus Indoor Wayfinding API — Complete Testing Guide

This document contains every endpoint, query parameter, request body, headers, expected responses, status codes, and test scenarios for testing the Campus Indoor Wayfinding API in Postman, cURL, or automated testing environments.

---

## 🚀 Quick Start with Postman

1. **Demo Video Walkthrough**: [Watch the Demo Video (Google Drive)](https://drive.google.com/file/d/1qmmMr3Z41r3boqQHIG8OpwcSVXKck8UM/view?usp=sharing)
2. **Import Collection**: Import `postman_collection.json` directly into Postman (**File -> Import**).
3. **Environment & Variables**:
   - `{{baseUrl}}`: Set by default to `http://localhost:4000`.
   - `{{token}}`: Automatically populated when executing the **Login as Admin** request.
   - `{{userToken}}`: Automatically populated when executing the **Login as Regular User** request.
   - `{{createdNodeId}}`, `{{createdEdgeId}}`, `{{createdPoiId}}`: Dynamic variables automatically captured from creation responses for testing update and delete flows.

---

## 🗺️ Campus Reference Map & Key Seeded IDs

| Node ID | Location / Room Name | Building | Floor | Type | Accessibility & Special Attributes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Reception | Building A | Floor 1 | Junction | Main entrance junction |
| **2** | Main Lobby A | Building A | Floor 1 | Corridor | Central connector hub |
| **6** | Washroom Male F1 | Building A | Floor 1 | Washroom | POI (`washroom`) |
| **8** | Emergency Exit A | Building A | Floor 1 | Exit | POI (`exit`) |
| **9** | Stairwell A (F1) | Building A | Floor 1 | Stair | Inaccessible (`is_accessible: false`) |
| **10** | Lift A (F1) | Building A | Floor 1 | Lift | Wheelchair Accessible Elevator |
| **11** | Bridge A-B (F1) | Building A | Floor 1 | Junction | Time-restricted passage (`07:00-22:00`) |
| **12** | Stairwell A (F2) | Building A | Floor 2 | Stair | Inaccessible (`is_accessible: false`) |
| **13** | Lift A (F2) | Building A | Floor 2 | Lift | Wheelchair Accessible Elevator |
| **17** | Meeting Room 4B | Building A | Floor 2 | Room | Multi-floor destination room |
| **21** | Lobby B | Building B | Floor 1 | Corridor | Building B entrance connector |
| **22** | Cafeteria | Building B | Floor 1 | Room | High Congestion weight (`2.0x`), POI |
| **24** | Conference Hall | Building B | Floor 1 | Room | Large assembly hall |
| **25** | Emergency Exit B | Building B | Floor 1 | Exit | POI (`exit`) |
| **26** | Water Point B1 | Building B | Floor 1 | Washroom | POI (`water_point`) |
| **32** | HR Department | Building B | Floor 2 | Room | Building B upper floor destination |

---

## 1. System Health & Info

### 1.1 Root Status Info
- **Method**: `GET`
- **URL**: `{{baseUrl}}/`
- **Auth**: None
- **Expected Response (`200 OK`)**:
  ```json
  {
    "status": "indoor wayfinding navigation system is running try some of the apis endpoints to find routes to destination",
    "timestamp": "2026-09-25T10:00:00.000Z"
  }
  ```

### 1.2 Health Check
- **Method**: `GET`
- **URL**: `{{baseUrl}}/health`
- **Auth**: None
- **Expected Response (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-25T10:00:00.000Z"
  }
  ```

---

## 2. Authentication Endpoints (`/api/auth`)

### 2.1 Login as Admin (Auto-Sets `{{token}}`)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "Admin@123"
  }
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "username": "admin",
        "role": "admin"
      }
    },
    "message": "Login successful",
    "success": true
  }
  ```

### 2.2 Login as Regular User (Auto-Sets `{{userToken}}`)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "yash",
    "password": "User@123"
  }
  ```
- **Expected Response (`200 OK`)**: Returns JWT with `"role": "user"`.

### 2.3 Register New User
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "student_tester",
    "password": "User@123",
    "role": "user"
  }
  ```
- **Expected Response (`201 Created`)**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "id": 3,
      "username": "student_tester",
      "role": "user"
    },
    "message": "User registered successfully",
    "success": true
  }
  ```

### 2.4 Login Failure (Invalid Credentials)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "WrongPassword"
  }
  ```
- **Expected Response (`401 Unauthorized`)**:
  ```json
  {
    "statusCode": 401,
    "message": "Invalid username or password",
    "success": false
  }
  ```

---

## 3. Wayfinding & Shortest Route Endpoints (`/api/route`)

> **Note**: All routing endpoints require `Authorization: Bearer {{token}}` (or `{{userToken}}`).
> The routing engine uses **Dijkstra's Algorithm with a Min-Heap Priority Queue**, evaluating dynamic edge congestion weights, wheelchair accessibility constraints, and time-based open/close windows.

### 3.1 Standard Routing (Cross-Floor)
Calculates optimal path across floors taking elevators/stairs as appropriate.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=17`
- **Expected Response (`200 OK`)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "distance": 57,
      "path": [1, 2, 10, 13, 14, 17],
      "instructions": [
        "Start at Reception (Building A, Floor 1)",
        "Walk along Reception towards Main Lobby A",
        "Walk along Main Lobby A towards Lift A (F1)",
        "Take Lift from Floor 1 to Floor 2 (Lift A (F2))",
        "Walk along Lift A (F2) towards Corridor A-2-Main",
        "Walk along Corridor A-2-Main towards Meeting Room 4B",
        "Arrive at Meeting Room 4B (Building A, Floor 2)"
      ],
      "algorithmUsed": "dijkstra",
      "wheelchair": false,
      "fromCache": false
    },
    "message": "Route calculated successfully",
    "success": true
  }
  ```

---

### 3.2 Intra-Floor Route (Same Level)
Reception (1) to Male Washroom (6) on Floor 1.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=6`
- **Expected Response (`200 OK`)**:
  - `algorithmUsed`: `"dijkstra"`
  - `distance`: `18`
  - `path`: `[1, 2, 6]`

---

### 3.3 Wheelchair Accessible Route (Dijkstra Filter)
Filters out stairs (`is_accessible: false`) and strictly routes through elevators and accessible corridors.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=17&wheelchair=true`
- **Expected Response (`200 OK`)**:
  - `wheelchair`: `true`
  - `path`: `[1, 2, 10, 13, 14, 17]` (Excludes Stairwells 9 and 12).

---

### 3.4 Time-Restricted Passage: Daytime Open (14:00)
Bridge A-B (`open_hours: "07:00-22:00"`) is OPEN at 14:00.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=22&time=14:00`
- **Expected Response (`200 OK`)**:
  - Returns direct path traversing Bridge A-B to Building B Cafeteria.

---

### 3.5 Time-Restricted Passage: Nighttime Closed (23:00)
Bridge A-B is CLOSED at 23:00.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=22&time=23:00`
- **Expected Response (`404 Not Found`)**:
  ```json
  {
    "statusCode": 404,
    "message": "No path found between the given nodes",
    "success": false
  }
  ```

---

### 3.6 Nearest Point of Interest (POI) Route
Finds the closest POI of a given type along with the computed navigation path.
- **Nearest Washroom**: `GET {{baseUrl}}/api/route/nearest-poi?start=1&type=washroom`
  - **Expected Response (`200 OK`)**: Returns nearest washroom node (Node 6) with path `[1, 2, 6]`.
- **Nearest Emergency Exit**: `GET {{baseUrl}}/api/route/nearest-poi?start=24&type=exit`
  - **Expected Response (`200 OK`)**: Returns nearest exit from Conference Hall (Node 25).

---

### 3.7 Multi-Stop Itinerary Route (TSP Heuristic + Dijkstra)
Solves route planning through multiple waypoints using nearest-neighbor heuristics and Dijkstra path segment calculations.
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/route/multi-stop`
- **Headers**: `Authorization: Bearer {{token}}`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "start": 1,
    "stops": [8, 22],
    "end": 17,
    "wheelchair": false,
    "time": "14:30"
  }
  ```
- **Expected Response (`200 OK`)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "distance": 187,
      "stopsVisitedOrder": [
        { "id": 8, "name": "Emergency Exit A" },
        { "id": 22, "name": "Cafeteria" }
      ],
      "path": [1, 2, 8, 2, 11, 21, 23, 22, 23, 21, 11, 2, 10, 13, 14, 17]
    },
    "message": "Multi-stop route calculated successfully",
    "success": true
  }
  ```

---

### 3.8 Validation Errors (400 Bad Request)
- **Same Start and End**: `GET {{baseUrl}}/api/route?start=1&end=1`
  - Response: `"start and end nodes must be different"`
- **Missing Parameters**: `GET {{baseUrl}}/api/route?start=1`
  - Response: `"start and end node IDs are required query parameters"`

---

## 4. Admin Dynamic Graph Controls (`/api/admin`)

> **Note**: All endpoints require an admin token (`role: "admin"`). Regular users receive `403 Forbidden`.

### 4.1 Campus Network Analytics
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/analytics`
- **Expected Response (`200 OK`)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "totalNodes": 34,
      "totalEdges": 36,
      "totalPois": 9,
      "activeClosures": 0,
      "congestedCorridors": 1,
      "inaccessiblePassages": 6
    },
    "message": "Campus network statistics fetched",
    "success": true
  }
  ```

### 4.2 Temporarily Close Edge
Sets operating hours to `00:00-00:00` and flushes all routing Redis caches.
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/10/close`
- **Body**:
  ```json
  {
    "reason": "Water pipe leakage repair"
  }
  ```

### 4.3 Reopen Closed Edge
Restores standard open hours and flushes routing caches.
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/10/reopen`
- **Body**:
  ```json
  {
    "open_hours": "07:00-22:00"
  }
  ```

### 4.4 Set Congestion Multiplier (Peak Traffic)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/2/congestion`
- **Body**:
  ```json
  {
    "congestion_weight": 2.5
  }
  ```

### 4.5 Set Edge Accessibility (Maintenance Mode)
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/10/accessibility`
- **Body**:
  ```json
  {
    "is_accessible": false,
    "accessibility_reason": "Elevator undergoing monthly inspection"
  }
  ```

---

## 5. Campus Nodes Management (`/api/nodes`)

| Endpoint | Method | Auth Required | Admin Only | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/nodes` | `GET` | ✅ Yes | ❌ No | List all nodes (includes POIs & edges) |
| `/api/nodes/:id` | `GET` | ✅ Yes | ❌ No | Get single node by ID |
| `/api/nodes` | `POST` | ✅ Yes | ✅ Yes | Create new node |
| `/api/nodes/:id` | `PUT` | ✅ Yes | ✅ Yes | Update existing node |
| `/api/nodes/:id` | `DELETE` | ✅ Yes | ✅ Yes | Delete node |

### 5.1 Create Node (Admin)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/nodes`
- **Body**:
  ```json
  {
    "name": "Innovation Lab",
    "floor": 3,
    "building": "A",
    "type": "room"
  }
  ```

### 5.2 Update Node (Admin)
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/nodes/{{createdNodeId}}`
- **Body**:
  ```json
  {
    "name": "AI & Robotics Innovation Lab",
    "type": "lab"
  }
  ```

### 5.3 Delete Node (Admin)
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/api/nodes/{{createdNodeId}}`

---

## 6. Campus Edges Management (`/api/edges`)

| Endpoint | Method | Auth Required | Admin Only | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/edges` | `GET` | ✅ Yes | ❌ No | List all edges with start & end node info |
| `/api/edges/:id` | `GET` | ✅ Yes | ❌ No | Get single edge by ID |
| `/api/edges` | `POST` | ✅ Yes | ✅ Yes | Create new connection between nodes |
| `/api/edges/:id` | `PUT` | ✅ Yes | ✅ Yes | Update edge weights / properties |
| `/api/edges/:id` | `DELETE` | ✅ Yes | ✅ Yes | Delete edge |

### 6.1 Create Edge (Admin)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/edges`
- **Body**:
  ```json
  {
    "start_node": 1,
    "end_node": 3,
    "distance": 12.5,
    "is_accessible": true,
    "open_hours": null,
    "congestion_weight": 1.0
  }
  ```

### 6.2 Update Edge (Admin)
- **Method**: `PUT`
- **URL**: `{{baseUrl}}/api/edges/{{createdEdgeId}}`
- **Body**:
  ```json
  {
    "distance": 11.0,
    "congestion_weight": 1.2
  }
  ```

### 6.3 Delete Edge (Admin)
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/api/edges/{{createdEdgeId}}`

---

## 7. Points of Interest (POI) Management (`/api/poi`)

| Endpoint | Method | Auth Required | Admin Only | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/poi` | `GET` | ✅ Yes | ❌ No | List all campus POIs |
| `/api/poi/nearest` | `GET` | ✅ Yes | ❌ No | Query POIs by type and node reference |
| `/api/poi` | `POST` | ✅ Yes | ✅ Yes | Create new POI associated with a node |
| `/api/poi/:id` | `DELETE` | ✅ Yes | ✅ Yes | Delete POI |

### 7.1 Lookup Nearest POIs
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/poi/nearest?node_id=1&type=washroom`

### 7.2 Create POI (Admin)
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/poi`
- **Body**:
  ```json
  {
    "node_id": 2,
    "type": "information_desk",
    "description": "Main floor customer information kiosk"
  }
  ```

### 7.3 Delete POI (Admin)
- **Method**: `DELETE`
- **URL**: `{{baseUrl}}/api/poi/{{createdPoiId}}`
