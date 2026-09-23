# Campus Indoor Wayfinding API — Testing Guide

This document contains every endpoint, query parameter, request body, headers, expected responses, and edge case scenarios for complete Postman testing.

---

## Quick Start with Postman
 
1. **Demo Video Walkthrough**: [Watch the Demo Video (Google Drive)](https://drive.google.com/file/d/1qmmMr3Z41r3boqQHIG8OpwcSVXKck8UM/view?usp=sharing)
2. **Import Collection**: Import `postman_collection.json` directly into Postman.
3. **Base URL Variable**: `{{baseUrl}}` is preset to `http://localhost:4000`.
4. **Authentication**: Running **Login as Admin** automatically saves the JWT token into `{{token}}` for all subsequent requests.

---

## Campus Reference Map and Key Node IDs (Seeded Data)

| Node ID | Location / Room Name | Building | Floor | Type | Key Features |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Reception | Building A | Floor 1 | Junction | Main entrance |
| **2** | Main Lobby A | Building A | Floor 1 | Corridor | Central hallway |
| **6** | Washroom Male F1 | Building A | Floor 1 | Washroom | POI (`washroom`) |
| **8** | Emergency Exit A | Building A | Floor 1 | Exit | POI (`exit`) |
| **9** | Stairwell A (F1) | Building A | Floor 1 | Stair | Inaccessible (Stairs) |
| **10** | Lift A (F1) | Building A | Floor 1 | Lift | Accessible (Elevator) |
| **11** | Bridge A-B (F1) | Building A | Floor 1 | Junction | Open 07:00–22:00 |
| **12** | Stairwell A (F2) | Building A | Floor 2 | Stair | Inaccessible (Stairs) |
| **13** | Lift A (F2) | Building A | Floor 2 | Lift | Accessible (Elevator) |
| **17** | Meeting Room 4B | Building A | Floor 2 | Room | Destination room |
| **21** | Lobby B | Building B | Floor 1 | Corridor | Building B entrance |
| **22** | Cafeteria | Building B | Floor 1 | Room | High Congestion (2.0x), POI |
| **24** | Conference Hall | Building B | Floor 1 | Room | Large hall |
| **25** | Emergency Exit B | Building B | Floor 1 | Exit | POI (`exit`) |
| **26** | Water Point B1 | Building B | Floor 1 | Washroom | POI (`water_point`) |
| **32** | HR Department | Building B | Floor 2 | Room | Building B upper floor |

---

## 1. Authentication Endpoints

### 1.1 Login as Admin (Get Token)
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
- **Expected Response (200 OK)**:
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

---

### 1.2 Login as Regular User
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/login`
- **Body**:
  ```json
  {
    "username": "yash",
    "password": "User@123"
  }
  ```
- **Expected Response (200 OK)**: Returns JWT token with `"role": "user"`.

---

### 1.3 Register New User
- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/register`
- **Body**:
  ```json
  {
    "username": "student1",
    "password": "Password@123",
    "role": "user"
  }
  ```
- **Expected Response (201 Created)**: User created successfully.

---

### 1.4 Auth Error: Invalid Password (401)
- **Body**: `{ "username": "admin", "password": "WrongPassword" }`
- **Expected Response (401 Unauthorized)**:
  ```json
  {
    "statusCode": 401,
    "message": "Invalid username or password",
    "success": false
  }
  ```

---

## 2. Wayfinding and Shortest Route Endpoints

> **Note**: All routing endpoints require `Authorization: Bearer {{token}}`

### 2.1 Automated Routing (Intelligent Query Planner)
Auto-selects optimal strategy (Floyd-Warshall for same-floor, A* for cross-floor, Dijkstra for dynamic filters).
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=17`
- **Expected Response (200 OK)**:
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
      "algorithmUsed": "astar",
      "wheelchair": false,
      "fromCache": false
    },
    "message": "Route calculated successfully",
    "success": true
  }
  ```

---

### 2.2 Wheelchair Accessible Route (Auto-Dispatches Dijkstra)
Skips stairs and routes strictly via elevators and accessible corridors.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=17&wheelchair=true`
- **Expected Response (200 OK)**:
  - `path`: `[1, 2, 10, 13, 14, 17]` (Excludes Stairwell `[9, 12]`).

---

### 2.3 Intra-Floor Route (Auto-Dispatches Floyd-Warshall O(1))
Reception (1) to Male Washroom (6) on Floor 1.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=6`
- **Expected Response (200 OK)**:
  - `"algorithmUsed": "floyd-warshall-subgraph"`, `"distance": 18`.

---

### 2.4 Time-Based Closure: Daytime Open (14:00)
Inter-building Bridge (11 to 21) is OPEN during 07:00–22:00.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=22&time=14:00`
- **Expected Response (200 OK)**:
  - Direct path crossing Bridge A-B to Cafeteria (`[1, 2, 11, 21, 22]`, distance: 63m).

---

### 2.5 Time-Based Closure: Nighttime Closed (23:00)
Inter-building Bridge is CLOSED at 23:00.
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=22&time=23:00`
- **Expected Response (404 Not Found)**:
  ```json
  {
    "statusCode": 404,
    "message": "No path found between the given nodes",
    "success": false
  }
  ```

---

### 2.6 Edge Case: Same Start and End Node (400)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route?start=1&end=1`
- **Expected Response (400 Bad Request)**:
  ```json
  {
    "statusCode": 400,
    "message": "start and end nodes must be different",
    "success": false
  }
  ```

---

## 3. Nearest Point of Interest (POI)

### 3.1 Nearest Washroom from Reception
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route/nearest-poi?start=1&type=washroom`
- **Expected Response (200 OK)**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "poi": {
        "id": 1,
        "node_id": 6,
        "type": "washroom",
        "description": "Male washroom — Building A, Floor 1"
      },
      "destinationNode": {
        "id": 6,
        "name": "Washroom Male F1",
        "floor": 1,
        "building": "A"
      },
      "distance": 18,
      "path": [1, 2, 6]
    },
    "message": "Nearest washroom located successfully",
    "success": true
  }
  ```

---

### 3.2 Nearest Emergency Exit from Conference Hall (24)
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/route/nearest-poi?start=24&type=exit`
- **Expected Response (200 OK)**: Locates Emergency Exit B (Node 25) at distance 18m.

---

## 4. Multi-Stop Itinerary Route (TSP Heuristic)

### 4.1 Plan Multi-Stop Route
Reception (1) to Emergency Exit A (8) to Cafeteria (22) to Meeting Room 4B (17).
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
- **Expected Response (200 OK)**:
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

## 5. Admin Dynamic Graph Controls (role: admin)

### 5.1 Campus Graph Analytics
- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/admin/analytics`
- **Expected Response (200 OK)**:
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

---

### 5.2 Temporarily Close Corridor or Lift
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/12/close`
- **Body**:
  ```json
  {
    "reason": "Elevator safety inspection"
  }
  ```
- **Expected Response (200 OK)**: Edge 12 closed, cache purged automatically.

---

### 5.3 Reopen Closed Corridor
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/12/reopen`
- **Body**:
  ```json
  {
    "open_hours": null
  }
  ```
- **Expected Response (200 OK)**: Edge 12 reopened.

---

### 5.4 Update Congestion Multiplier
- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/api/admin/edges/1/congestion`
- **Body**:
  ```json
  {
    "congestion_weight": 2.5
  }
  ```
- **Expected Response (200 OK)**: Congestion updated, routes automatically adjust distance calculations.

---

## 6. Campus Layout CRUD Endpoints

- `GET /api/nodes` — List all nodes
- `GET /api/nodes/:id` — Get single node
- `POST /api/nodes` — Admin add node
- `PUT /api/nodes/:id` — Admin update node
- `DELETE /api/nodes/:id` — Admin delete node
- `GET /api/edges` — List all edges
- `GET /api/edges/:id` — Get single edge
- `GET /api/poi` — List all POIs
