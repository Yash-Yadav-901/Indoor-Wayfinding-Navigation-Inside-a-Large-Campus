# Indoor Wayfinding and Navigation System Inside a Large Campus

A production-ready RESTful indoor wayfinding API designed for large corporate and university campus environments. The system models complex multi-building and multi-floor layouts as a weighted graph, computing optimal walking routes that account for wheelchair accessibility, time-based corridor closures, congestion weights, Points of Interest (POI) discovery, and multi-stop itinerary planning.

---

## 🎥 Project Demo Video

- **Google Drive Video Link**: [Watch the Demo Video (Google Drive)](https://drive.google.com/file/d/1qmmMr3Z41r3boqQHIG8OpwcSVXKck8UM/view?usp=sharing)
- **Local Video File**: [`demo_video/demo_video_f.mp4`](./demo_video/demo_video_f.mp4)

---

## 🛠️ Tech Stack

| Category | Technology | Description / Usage |
| :--- | :--- | :--- |
| **Runtime & Backend** | **Node.js (v20+)** | Server-side JavaScript runtime with native ES module support |
| **Framework** | **Express.js (v5.x)** | RESTful API framework, modular middleware pipeline & routing |
| **Database** | **PostgreSQL / Neon DB** | Relational database providing ACID transactions & relational graph models |
| **ORM** | **Prisma ORM (v6.x)** | Type-safe database client, schema migrations, and relational seeding |
| **Caching Layer** | **Redis (ioredis)** | Distributed in-memory route and analytics cache |
| **Cache Resilience** | **In-Memory TTL Fallback** | Native Map-based memory cache with auto-failover if Redis is unavailable |
| **Graph Algorithms** | **Dijkstra + Min-Binary Heap** | Shortest-path routing under all constraints (accessibility, time windows, congestion) |
| **Itinerary Planning**| **TSP Heuristic** | Multi-stop shortest-path route sequencing (Greedy Nearest Neighbor) |
| **Authentication** | **JWT (`jsonwebtoken`)** | Stateless bearer token authentication & Role-Based Access Control (RBAC) |
| **Security & Hashing**| **bcryptjs & Helmet** | Salted password hashing and HTTP security headers |
| **Containerization** | **Docker & Docker Compose** | Multi-stage containerized deployment and orchestration |
| **Testing & Tooling** | **Postman & Nodemon** | Automated API collection testing suite & hot-reloading dev environment |

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

## 2. How to Run the Project

### Prerequisites
- Docker & Docker Compose (Recommended) OR Node.js >= 20.0.0
- PostgreSQL Database (e.g., Neon Postgres)
- Redis Server (Optional, automatic in-memory fallback active by default)

### Step 1: Configure Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@host/dbname?sslmode=require"
REDIS_URL="redis://default:password@host:port"
JWT_SECRET="your_secure_jwt_secret_key"
PORT=4000
NODE_ENV=development
```

---

### Step 2: Start the Application

#### Option 1: Single Command with Docker (Recommended)
To build and run the entire containerized application in one command:
```bash
docker compose up --build -d
```
The application will automatically build the container, generate Prisma database clients, and start the web server on `http://localhost:4000`.

#### Option 2: Running Locally with Node.js
```bash
# 1. Install dependencies
npm install

# 2. Push schema to database and seed campus graph data
npx prisma db push
node prisma/seed.js

# 3. Start development server
npm run dev

# (Alternatively for production)
npm start
```

---

### Step 3: Test and Explore the APIs
After the project starts running on `http://localhost:4000`:
- **Import Postman Collection**: Import `postman_collection.json` directly into Postman for end-to-end automated testing across all endpoints, auto-selection routes, and error scenarios.
- **Detailed Testing Manual**: Refer to `API_TESTING_GUIDE.md` for complete request parameter matrices, expected JSON responses, and edge cases.
- **Root Status Check**: Visit `http://localhost:4000/` or `http://localhost:4000/health` to confirm the server status.

---

## 3. Assumptions Made in System Design

To create a realistic, robust, and computationally sound indoor navigation system, the following core assumptions were established:

1. **Graph Bidirectionality**:
   - Unless explicitly defined otherwise, indoor corridors, bridges, and doorways are bidirectional walkable edges. Walking from Node A to Node B incurs the same distance as walking from Node B to Node A.

2. **Vertical Transitions and Accessibility**:
   - Elevators (lifts) and accessible ramps are modeled as accessible edges (`is_accessible: true`).
   - Stairwells are explicitly flagged as inaccessible to wheelchair users (`is_accessible: false`, `accessibility_reason: "Stairs — use Lift instead"`). When wheelchair mode is active, the router strictly eliminates stair edges.

3. **Time Formatting and Operating Hours**:
   - Time-restricted corridors and inter-building bridges follow a 24-hour window format: `HH:MM-HH:MM` (for example, `07:00-22:00` for Bridge A-B).
   - If a request does not specify a `time` query parameter, edges with standard open hours are treated as open unless explicitly closed around-the-clock (`00:00-00:00`).

4. **Congestion Weighting**:
   - Pedestrian traffic congestion is modeled as an effective cost multiplier: `effective_cost = distance * congestion_weight`. An edge with a 10m distance and 2.0 congestion weight incurs an effective traversal cost equivalent to 20m, naturally steering the shortest-path algorithm toward less crowded corridors.

5. **Multi-Stop Itineraries (TSP Heuristic)**:
   - When visiting intermediate POI stops on the way to a destination (e.g., Desk to Water Point to Cafeteria to Meeting Room), the optimal sequence is computed using a greedy nearest-neighbor heuristic that minimizes overall walking distance.

6. **Hierarchical Campus Partitioning**:
   - Campus layouts are partitioned by building and floor. Intra-floor rooms connect locally within floor subgraphs, while elevators, stairs, and bridges act as gateway nodes for inter-floor and inter-building travel.

---

## 4. System Architecture and OOP Design

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
│       └── dijkstra.strategy.js    # Dijkstra with binary heap (O((V + E) log V))
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
   - `CampusGraph` delegates all routing to `DijkstraStrategy` via the `selectOptimalStrategy` method, keeping controllers and routes fully decoupled from algorithm internals.

3. **Separation of Concerns**:
   - Controllers handle HTTP validation and response serialization.
   - Services execute domain business logic and caching.
   - Strategy classes handle mathematical graph traversals.
   - Prisma ORM manages relational persistence.

---

## 5. Routing Engine

Clients make a standard request (`GET /api/route?start=1&end=17`). All routing is handled by a single, unified `DijkstraStrategy` instance:

```
                      [ Incoming Route Query ]
                                 |
                                 v
                    [ Dijkstra + Min-Binary Heap ]
                       O((V + E) log V) Dynamic
                       Edge Relaxation & Filters
                                 |
           +---------------------+---------------------+
           |                     |                     |
    [wheelchair=true]      [time filter]        [Standard Query]
   Skip non-accessible   Skip closed edges    Direct shortest path
        edges
```

- **All Queries**: Dispatched to `DijkstraStrategy` with Min-Binary Heap, guaranteeing optimal shortest-path computation under any combination of constraints.
- **Wheelchair Mode (`wheelchair=true`)**: Dynamically skips edges where `is_accessible: false` (stairwells), routing exclusively through lifts and ramps.
- **Time-Restricted Corridors**: Skips edges whose `open_hours` window does not include the requested `time` parameter.
- **Congestion Weighting**: Edge traversal cost is computed as `distance × congestion_weight`, naturally routing around high-traffic corridors.

---

## 6. Cost Estimation: Time and Space Complexity

### 6.1 Dijkstra with Min-Binary Heap
- **Time Complexity**: `O((V + E) * log(V))`
  - Binary heap insertion (`enqueue`): `O(log(V))`
  - Extract minimum (`dequeue`): `O(log(V))`
  - Edge relaxations: `O(E * log(V))`
- **Space Complexity**: `O(V + E)` for adjacency storage and distance tracking.
- **Why this was chosen over a sorted array**: A naive priority queue using `Array.prototype.sort()` takes `O(N * log(N))` on every insert, resulting in an unacceptable `O(E * V * log(V))` total complexity. The binary heap maintains strict `O(log(V))` priority queue bounds.

### 6.2 Multi-Stop TSP Heuristic
- **Time Complexity**: `O(K * (V + E) * log(V))` where `K` is the number of intermediate stops.
- **Approach**: Evaluates candidate legs using Dijkstra and iteratively visits the nearest unvisited node, then connects to the final destination and stitches the paths.

---

## 7. Choices and System Trade-offs

During the design and implementation of this system, key architectural trade-offs were made:

1. **Single Algorithm (Dijkstra) vs. Multi-Algorithm Strategy Dispatch**:
   - *Trade-off*: A multi-algorithm approach (A*, Floyd-Warshall, Dijkstra) can theoretically save computation for specific query types. However, it dramatically increases code surface area, cognitive load, and the risk of subtle bugs where wrong strategies are dispatched.
   - *Choice*: We use a single, well-understood `DijkstraStrategy` for all queries. On a campus-scale graph (30–100 nodes per floor), Dijkstra with a Min-Binary Heap computes any route in sub-millisecond time — making multi-algorithm complexity unjustified. The route cache (Redis/in-memory TTL) absorbs repeated queries with `O(1)` lookups.

2. **Relational Database (PostgreSQL + Prisma) vs. Native Graph Database (Neo4j)**:
   - *Trade-off*: A native graph database offers Cypher queries, but introduces separate infrastructure complexity, looser constraints for user authentication, and high memory overhead for small-to-medium campus networks.
   - *Choice*: We chose PostgreSQL (via Neon) with Prisma ORM. Relational tables cleanly represent nodes, edges, POIs, and user authentication tables with strict foreign keys and ACID guarantees. In-memory graph services then execute pathfinding algorithms in sub-millisecond times.

3. **Multi-Tier Caching (Redis Primary with In-Memory Fallback) vs. Redis-Only**:
   - *Trade-off*: A distributed Redis cache provides shared caching across multiple backend instances, but creates a single point of failure if the Redis cluster experiences network partitions.
   - *Choice*: We implemented a resilient multi-tier cache. Primary read/writes use Redis, while an automatic, transparent failover activates an in-memory TTL cache if Redis is unavailable, guaranteeing 100% uptime for route queries.

4. **Min-Binary Heap vs. Fibonacci Heap vs. Naive Array Sorting**:
   - *Trade-off*: Fibonacci heaps offer theoretical `O(1)` amortized decrease-key operations, but carry massive practical constant-factor overhead and complex implementation in JavaScript. Naive array sorting degrades performance to `O(E * V * log(V))`.
   - *Choice*: A standard Min-Binary Heap provides the optimal balance of simplicity, cache locality, and `O(log(V))` priority queue bounds.

---

## 8. System Failure Handling and Fault Tolerance

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

## 9. Database Schema and Seed Data

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
  - `algorithm` (string, optional): Reserved for future extensibility (currently always uses `dijkstra`)
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
      "algorithmUsed": "dijkstra",
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

---

## 12. Evaluation Criteria & Plus Points Verification

| Criterion | Implementation Status | Technical Details & Code References |
| :--- | :---: | :--- |
| **1. Authentication** | ✅ **Covered** | • Stateless JWT authentication (`jsonwebtoken`) with role verification (`user` vs `admin`).<br>• Salted password hashing with `bcryptjs`.<br>• Middleware: [`auth.middleware.js`](./src/middleware/auth.middleware.js) protecting routes with `verifyJWT` and `requireRole`. |
| **2. Cost Estimation (Time & Space)** | ✅ **Covered** | • **Dijkstra + Min-Heap**: $O((V + E) \log V)$ time, $O(V + E)$ space via custom [`PriorityQueue`](./src/utils/priority_queue.js).<br>• Binary heap insertion (`enqueue`): $O(\log V)$; Extract minimum (`dequeue`): $O(\log V)$.<br>• **Multi-Stop TSP**: $O(K \cdot (V + E) \log V)$ greedy nearest-neighbor sequencing. |
| **3. Handling System Failure Cases** | ✅ **Covered** | • Multi-tier resilient caching in [`cache.service.js`](./src/services/cache.service.js) with transparent in-memory fallback if Redis fails.<br>• Graceful process lifecycle & termination handlers (`uncaughtException`, `unhandledRejection`, `SIGTERM`) in [`server.js`](./src/server.js).<br>• Safe handling of disconnected subgraphs and unreachable destinations with `404 Not Found`. |
| **4. Object-Oriented Design (OOPS)** | ✅ **Covered** | • **Encapsulation**: [`PriorityQueue`](./src/utils/priority_queue.js), [`CampusGraph`](./src/services/graph.service.js).<br>• **Polymorphism / Strategy Pattern**: Strategy interface in [`algorithms/`](./src/services/algorithms/).<br>• **Inheritance**: Custom [`ApiError`](./src/utils/api_error.js) extending `Error`.<br>• **Layered Architecture**: Clean separation between routes, controllers, services, and ORM. |
| **5. System Trade-offs** | ✅ **Covered** | • Precomputation vs Dynamic Edge Relaxation.<br>• Relational DB (PostgreSQL) vs Graph DB (Neo4j).<br>• Multi-tier Caching vs Redis-only.<br>• Min-Binary Heap vs Fibonacci Heap vs Array sort. (Detailed in Section 7). |
| **6. System Monitoring & Logging** | ✅ **Covered** | • Real-time HTTP request logging via `morgan` in [`app.js`](./src/app.js).<br>• Health status endpoint (`GET /health` and `GET /`).<br>• Campus Analytics monitoring endpoint (`GET /api/admin/analytics`) tracking total nodes, edges, active closures, congestion hotspots, and inaccessible passages. |
| **7. Caching & Eviction Policies** | ✅ **Covered** | • Distributed Redis caching for routes (`route:*`), nearest POIs (`nearest_poi:*`), and graph topology.<br>• TTL eviction policies (300s TTL) for optimal resource utilization.<br>• Event-driven cache invalidation triggered whenever admins modify edges or network state. |
| **8. Error & Exception Handling** | ✅ **Covered** | • Centralized operational error handling via [`ApiError`](./src/utils/api_error.js).<br>• Standardized JSend response envelope via [`ApiResponse`](./src/utils/api_response.js).<br>• Async wrapper [`async_handler.js`](./src/utils/async_handler.js) and global middleware [`error.middleware.js`](./src/middleware/error.middleware.js). |

