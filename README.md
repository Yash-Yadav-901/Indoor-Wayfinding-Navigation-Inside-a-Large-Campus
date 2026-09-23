# Indoor Wayfinding and Navigation System Inside a Large Campus

A production-ready RESTful indoor wayfinding API designed for large corporate and university campus environments. The system models complex multi-building and multi-floor layouts as a weighted graph, computing optimal walking routes that account for wheelchair accessibility, time-based corridor closures, congestion weights, Points of Interest (POI) discovery, and multi-stop itinerary planning.

---

## 1. Problem Statement Overview

Large office campuses and university grounds with multiple interconnected buildings, floors, stairs, and elevators create navigation challenges for new employees, visitors, and emergency services. 

This backend system addresses these challenges by:
- Modeling campus physical layouts as a mathematical graph of walkable nodes and weighted edges.
- Computing optimal shortest walking routes using Dijkstra's algorithm with a custom Min-Binary Heap.
- Generating step-by-step, turn-by-turn natural language navigation instructions.
- Handling real-world physical constraints such as wheelchair accessibility (skipping stairs in favor of elevators), operating hours of bridges and corridors, and dynamic traffic congestion during peak hours.
- Providing nearest POI discovery (washrooms, emergency exits, cafeterias, water dispensers) and multi-stop route sequencing (TSP heuristic).

---

## 2. System Architecture and OOP Design

The backend is built with Node.js and Express using strict Layered Architecture and Object-Oriented Programming (OOP) principles.

```
src/
├── app.js                          # Express configuration, middleware pipeline & routing
├── server.js                       # Process bootstrap & graceful shutdown listeners
├── config/
│   └── index.js                    # Centralized environment configuration
├── middleware/
│   ├── auth.middleware.js          # JWT authentication and Role-Based Access Control (RBAC)
│   └── error.middleware.js         # Centralized error and exception handling middleware
├── utils/
│   ├── api_error.js                # Custom operational error class (Encapsulation)
│   ├── api_response.js             # Standardized JSend-compliant JSON response envelope
│   ├── async_handler.js            # Promise resolution wrapper for controllers
│   └── priority_queue.js           # Min-Binary Heap priority queue (O(log V))
├── services/
│   ├── auth.service.js             # Password hashing (bcrypt) and JWT lifecycle
│   ├── cache.service.js            # Multi-tier caching (Redis with in-memory fallback)
│   ├── graph.service.js            # CampusGraph engine, Query Planner and instruction builder
│   └── algorithms/                 # Strategy Pattern routing algorithms
│       ├── dijkstra.strategy.js    # Dijkstra with binary heap (O((V + E) log V))
│       ├── astar.strategy.js       # A* search with Euclidean and floor heuristics
│       └── floyd_warshall.strategy.js # Hierarchical subgraph precomputation
├── controllers/
│   ├── auth.controller.js          # User registration and authentication handlers
│   ├── nodes.controller.js         # Node CRUD operations and graph synchronization
│   ├── edges.controller.js         # Edge CRUD operations and graph synchronization
│   ├── poi.controller.js           # Point of Interest CRUD and discovery
│   ├── route.controller.js         # Path computation and multi-stop itinerary handlers
│   └── admin.controller.js         # Dynamic edge controls and graph analytics
└── routes/
    ├── auth.routes.js
    ├── nodes.routes.js
    ├── edges.routes.js
    ├── poi.routes.js
    ├── route.routes.js
    └── admin.routes.js
```

### OOP Principles Applied

1. **Encapsulation**:
   - `PriorityQueue` encapsulates its internal array heap and index calculation logic (`parent`, `leftChild`, `rightChild`, `bubbleUp`, `bubbleDown`), exposing only `enqueue`, `dequeue`, `isEmpty`, and `size`.
   - `CampusGraph` encapsulates the underlying adjacency list, node map, and time-parsing logic.
   - `ApiError` extends the native JavaScript `Error` class, encapsulating HTTP status codes, operational flags, and error stacks.

2. **Polymorphism and the Strategy Pattern**:
   - Routing algorithms implement a uniform method interface: `findPath(graph, startId, endId, options)`.
   - The router dynamically delegates queries to `DijkstraStrategy`, `AStarStrategy`, or `FloydWarshallStrategy` without modifying controller or route layers.

3. **Separation of Concerns**:
   - Controllers handle HTTP validation and response serialization.
   - Services execute domain business logic and caching.
   - Strategy classes handle mathematical graph traversals.
   - Prisma ORM manages relational persistence.

---

## 3. Intelligent Query Planner

Clients make a standard request (`GET /api/route?start=1&end=17`). The backend includes a Query Planner (`selectOptimalStrategy`) that inspects the query context and dispatches the most efficient algorithm:

```
                      [ Incoming Route Query ]
                                 |
           +---------------------+---------------------+
           |                                           |
[Dynamic Constraints Active?]              [Standard Static Query]
(wheelchair=true OR time filter)                       |
           |                               +-----------+-----------+
           |                               |                       |
           v                               v                       v
    [Dijkstra + MinHeap]          [Same Floor & Wing]    [Cross-Floor/Building]
  O((V + E) log V) Dynamic                 |                       |
  Edge Relaxation & Filters                v                       v
                                   [Floyd-Warshall]            [A* Search]
                                O(1) Matrix Lookup       Target-Directed Search
```

- **Intra-Floor Queries (Same Floor & Building)**: Dispatches `FloydWarshallStrategy` to retrieve precomputed shortest paths in $O(1)$ constant time.
- **Cross-Floor / Cross-Building Queries**: Dispatches `AStarStrategy` using spatial heuristics to explore fewer nodes.
- **Dynamic Real-World Constraints (`wheelchair=true` or Time Windows)**: Dispatches `DijkstraStrategy` with Min-Binary Heap to evaluate accessibility and open hours on the fly.

---

## 4. Cost Estimation: Time and Space Complexity

### 4.1 Dijkstra with Min-Binary Heap
- **Time Complexity**: $O((V + E) \log V)$
  - Binary heap insertion (`enqueue`): $O(\log V)$
  - Extract minimum (`dequeue`): $O(\log V)$
  - Edge relaxations: $O(E \log V)$
- **Space Complexity**: $O(V + E)$ for adjacency storage and distance tracking.
- **Why this was chosen over a sorted array**: A naive priority queue using `Array.prototype.sort()` takes $O(N \log N)$ on every insert, resulting in an unacceptable $O(E \cdot V \log V)$ total complexity. The binary heap maintains strict $O(\log V)$ priority queue bounds.

### 4.2 A* Search Strategy
- **Time Complexity**: $O(E')$ where $E' \le E$ (explores a fraction of the graph by steering towards the goal).
- **Space Complexity**: $O(V + E)$ for tracking open sets and $g$-scores / $f$-scores.
- **Heuristic**: $h(n) = \Delta\text{building} \times 20 + |\Delta\text{floor}| \times 15$. The heuristic is admissible ($h(n) \le \text{true walking distance}$), guaranteeing optimality.

### 4.3 Hierarchical Floyd-Warshall Strategy
- **Precomputation Time**: $O(\sum V_{\text{sub}}^3)$ where $V_{\text{sub}}$ is the number of nodes per floor (e.g., $30^3 = 27,000$ operations, which takes $< 1\text{ms}$).
- **Query Time Complexity**: $O(1)$ lookup for intra-floor routes; $O(\text{Gateways}^2)$ for cross-floor routes.
- **Space Complexity**: $O(\sum V_{\text{sub}}^2)$ to store distance and next-hop matrices per floor.

### 4.4 Multi-Stop TSP Heuristic
- **Time Complexity**: $O(K \cdot (V + E) \log V)$ where $K$ is the number of intermediate stops.
- **Approach**: Evaluates candidate legs using Dijkstra and iteratively visits the nearest unvisited node, then connects to the final destination and stitches the paths.

---

## 5. Real-World Constraints Implementation

1. **Wheelchair Accessibility**:
   - Edges representing stairs have `is_accessible: false` and `accessibility_reason: "Stairs — use Lift instead"`.
   - When `wheelchair=true`, the router skips all inaccessible edges during relaxation. If no accessible path exists, it returns a 404 response explaining that no wheelchair-accessible route is available.

2. **Time-Based Corridor and Bridge Closures**:
   - Edges store operational windows (e.g., `open_hours: "07:00-22:00"` for Bridge A-B; `open_hours: "06:00-21:00"` for the night corridor).
   - Queries validate the query timestamp against these windows. Edges closed during the requested time are bypassed.

3. **Congestion Weighting**:
   - Edges contain a `congestion_weight` multiplier (e.g., 2.0 for the main cafeteria corridor).
   - Effective edge traversal cost is calculated as $\text{cost} = \text{distance} \times \text{congestion\_weight}$, causing the algorithm to prefer less crowded alternative corridors when appropriate.

---

## 6. System Failure Handling and Fault Tolerance

1. **Multi-Tier Cache Fallback**:
   - `cache.service.js` attempts primary read/write operations against Redis.
   - If Redis is unreachable, disconnected, or times out, the service automatically fails over to an in-memory `Map` with TTL expiration. No 500 errors or unhandled rejections are propagated to the user.

2. **Process Lifecycle and Clean Shutdown**:
   - `uncaughtException` and `unhandledRejection` handlers log error details before terminating the process safely.
   - `SIGTERM` signals trigger graceful HTTP server shutdown, completing in-flight requests and closing database pools.

3. **Input Validation and Edge Cases**:
   - Same start and destination node IDs return a structured `400 Bad Request`.
   - Unreachable destination nodes or disconnected subgraphs return a clear `404 Not Found` rather than timing out or crashing.
   - Non-numeric or invalid parameters are intercepted by validation layers before reaching the graph engine.

---

## 7. System Trade-offs and Architectural Decisions

1. **Precomputation vs. Dynamic Real-Time Filtering**:
   - *Precomputing all-pairs paths (Full Floyd-Warshall)* gives $O(1)$ lookups but becomes invalid whenever an edge is closed, congested, or restricted for wheelchair users.
   - *Decision*: We use Dijkstra with dynamic edge relaxation as the primary engine for constrained queries, and limit Floyd-Warshall precomputation to small, static intra-floor subgraphs.

2. **Relational Database (PostgreSQL + Prisma) vs. Native Graph Database (Neo4j)**:
   - *Graph DBs* provide native cypher traversals, but add operational complexity, separate infrastructure costs, and looser relational constraints for user authentication and permissions.
   - *Decision*: PostgreSQL via Neon provides strong relational integrity, ACID transactions for node/edge management, and fast index scans, while the in-memory graph service handles traversals in sub-millisecond execution times.

3. **In-Memory Caching vs. Redis Cluster**:
   - *Decision*: Dual-layer approach. Redis is used as the primary shared cache for multi-instance deployments, while the in-memory fallback guarantees 100% availability during network partitions or Redis outages.

---

## 8. Database Schema and Seed Data

### Relational Entity-Relationship Structure

- **User**: Stores credentials (`username`, `password_hash`, `role`).
- **Node**: Represents a physical location (`id`, `name`, `floor`, `building`, `type`).
- **Edge**: Represents a physical connection (`id`, `start_node`, `end_node`, `distance`, `is_accessible`, `accessibility_reason`, `congestion_weight`, `open_hours`).
- **Poi**: Represents Points of Interest (`id`, `node_id`, `type`, `description`).
- **CachedRoute**: Stores route queries for audit and fallback persistence.

### Key Seed Locations for Testing

| Node ID | Location Name | Building | Floor | Type | Properties |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Reception | A | 1 | Junction | Campus entry point |
| **2** | Main Lobby A | A | 1 | Corridor | Central junction |
| **6** | Washroom Male F1 | A | 1 | Washroom | POI (`washroom`) |
| **8** | Emergency Exit A | A | 1 | Exit | POI (`exit`) |
| **9** | Stairwell A (F1) | A | 1 | Stair | Inaccessible (`is_accessible: false`) |
| **10** | Lift A (F1) | A | 1 | Lift | Accessible elevator |
| **11** | Bridge A-B (F1) | A | 1 | Junction | Open `07:00-22:00` |
| **12** | Stairwell A (F2) | A | 2 | Stair | Inaccessible (`is_accessible: false`) |
| **13** | Lift A (F2) | A | 2 | Lift | Accessible elevator |
| **17** | Meeting Room 4B | A | 2 | Room | Destination room |
| **21** | Lobby B | B | 1 | Corridor | Building B entry |
| **22** | Cafeteria | B | 1 | Room | Congestion `2.0`, POI |
| **24** | Conference Hall | B | 1 | Room | Meeting facility |
| **25** | Emergency Exit B | B | 1 | Exit | POI (`exit`) |
| **26** | Water Point B1 | B | 1 | Washroom | POI (`water_point`) |
| **32** | HR Department | B | 2 | Room | Upper floor office |

---

## 9. Setup and Execution

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL Database (e.g., Neon Postgres)
- Redis Server (Optional, in-memory fallback active by default)

### 1. Configure Environment (`.env`)
```env
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
REDIS_URL="redis://default:password@host:port"
JWT_SECRET="your_secure_jwt_secret_key"
PORT=4000
NODE_ENV=development
```

### 2. Install Dependencies, Migrate Database and Seed Data
```bash
npm install
npx prisma db push
node prisma/seed.js
```

### 3. Start Application

#### Option A: Running with Docker (Single Command)
```bash
docker compose up --build -d
```
The server will build the container, generate Prisma clients, and start on `http://localhost:4000`.

#### Option B: Running Locally with Node.js
```bash
# Development mode
npm run dev

# Production mode
npm start
```

---

## 10. REST API Specification

### Authentication

#### Register User
- **Endpoint**: `POST /api/auth/register`
- **Body**:
  ```json
  {
    "username": "employee1",
    "password": "Password@123",
    "role": "user"
  }
  ```

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "Admin@123"
  }
  ```
- **Response**: Returns JWT bearer token and user profile.

---

### Wayfinding & Navigation (`Authorization: Bearer <TOKEN>`)

#### 1. Shortest Path Route
- **Endpoint**: `GET /api/route`
- **Query Parameters**:
  - `start` (integer, required): Starting node ID (e.g., `1`)
  - `end` (integer, required): Destination node ID (e.g., `17`)
  - `wheelchair` (boolean, optional): `true` to restrict to accessible lifts/ramps
  - `time` (string, optional): Query time formatted as `HH:MM` (e.g., `14:30`)
  - `algorithm` (string, optional): Manual override (`dijkstra`, `astar`, `hierarchical`)
- **Example Call**: `GET /api/route?start=1&end=17&wheelchair=false`
- **Response**:
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

#### 2. Nearest Point of Interest
- **Endpoint**: `GET /api/route/nearest-poi`
- **Query Parameters**:
  - `start` (integer, required): Starting node ID
  - `type` (string, required): POI category (`washroom`, `exit`, `cafeteria`, `water_point`)
- **Example Call**: `GET /api/route/nearest-poi?start=1&type=washroom`

#### 3. Multi-Stop Itinerary Route
- **Endpoint**: `POST /api/route/multi-stop`
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

---

### Dynamic Admin Controls (`role: admin`)

- `GET /api/admin/analytics`: Returns campus network summary (node count, edge count, active closures, congested paths).
- `PATCH /api/admin/edges/:id/close`: Temporarily closes an edge (`{ "reason": "Maintenance" }`).
- `PATCH /api/admin/edges/:id/reopen`: Reopens a closed edge (`{ "open_hours": "07:00-22:00" }`).
- `PATCH /api/admin/edges/:id/congestion`: Sets congestion multiplier (`{ "congestion_weight": 2.5 }`).
- `PATCH /api/admin/edges/:id/accessibility`: Modifies accessibility (`{ "is_accessible": false, "accessibility_reason": "Out of order" }`).

---

### Campus Layout CRUD Endpoints

- **Nodes**: `GET /api/nodes`, `GET /api/nodes/:id`, `POST /api/nodes`, `PUT /api/nodes/:id`, `DELETE /api/nodes/:id`
- **Edges**: `GET /api/edges`, `GET /api/edges/:id`, `POST /api/edges`, `PUT /api/edges/:id`, `DELETE /api/edges/:id`
- **POIs**: `GET /api/poi`, `POST /api/poi`, `DELETE /api/poi/:id`

---

## 11. Testing and Verification

- **Postman Collection**: Import `postman_collection.json` into Postman for end-to-end automated testing.
- **Testing Guide**: See `API_TESTING_GUIDE.md` for parameter matrices, error test cases, and expected status codes.
- **Default Test Accounts**:
  - Admin: `username: admin` | `password: Admin@123`
  - User: `username: yash` | `password: User@123`
