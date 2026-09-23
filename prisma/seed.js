import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.cachedRoute.deleteMany()
  await prisma.poi.deleteMany()
  await prisma.edge.deleteMany()
  await prisma.node.deleteMany()
  await prisma.user.deleteMany()

  console.log('🌱 Seeding nodes...')

  // ─── Building A · Floor 1 ─────────────────────────────────────────────────
  const reception    = await prisma.node.create({ data: { name: 'Reception',               floor: 1, building: 'A', type: 'junction'  } })
  const lobbyA       = await prisma.node.create({ data: { name: 'Main Lobby A',             floor: 1, building: 'A', type: 'corridor'  } })
  const corrA1       = await prisma.node.create({ data: { name: 'Corridor A-1-North',       floor: 1, building: 'A', type: 'corridor'  } })
  const meetA1a      = await prisma.node.create({ data: { name: 'Meeting Room 1A',          floor: 1, building: 'A', type: 'room'      } })
  const meetA1b      = await prisma.node.create({ data: { name: 'Meeting Room 1B',          floor: 1, building: 'A', type: 'room'      } })
  const wmA1         = await prisma.node.create({ data: { name: 'Washroom Male F1',         floor: 1, building: 'A', type: 'washroom'  } })
  const wfA1         = await prisma.node.create({ data: { name: 'Washroom Female F1',       floor: 1, building: 'A', type: 'washroom'  } })
  const exitA        = await prisma.node.create({ data: { name: 'Emergency Exit A',         floor: 1, building: 'A', type: 'exit'      } })
  const stairA1      = await prisma.node.create({ data: { name: 'Stairwell A (F1)',         floor: 1, building: 'A', type: 'stair'     } })
  const liftA1       = await prisma.node.create({ data: { name: 'Lift A (F1)',              floor: 1, building: 'A', type: 'lift'      } })
  const bridgeA      = await prisma.node.create({ data: { name: 'Bridge A-B (F1)',          floor: 1, building: 'A', type: 'junction'  } })

  // ─── Building A · Floor 2 ─────────────────────────────────────────────────
  const stairA2      = await prisma.node.create({ data: { name: 'Stairwell A (F2)',         floor: 2, building: 'A', type: 'stair'     } })
  const liftA2       = await prisma.node.create({ data: { name: 'Lift A (F2)',              floor: 2, building: 'A', type: 'lift'      } })
  const corrA2       = await prisma.node.create({ data: { name: 'Corridor A-2-Main',        floor: 2, building: 'A', type: 'corridor'  } })
  const meetA2a      = await prisma.node.create({ data: { name: 'Meeting Room 2A',          floor: 2, building: 'A', type: 'room'      } })
  const meetA2b      = await prisma.node.create({ data: { name: 'Meeting Room 2B',          floor: 2, building: 'A', type: 'room'      } })
  const meet4B       = await prisma.node.create({ data: { name: 'Meeting Room 4B',          floor: 2, building: 'A', type: 'room'      } })
  const officeWing   = await prisma.node.create({ data: { name: 'Office Wing A2',           floor: 2, building: 'A', type: 'room'      } })
  const wmA2         = await prisma.node.create({ data: { name: 'Washroom Male F2-A',       floor: 2, building: 'A', type: 'washroom'  } })
  const wfA2         = await prisma.node.create({ data: { name: 'Washroom Female F2-A',     floor: 2, building: 'A', type: 'washroom'  } })

  // ─── Building B · Floor 1 ─────────────────────────────────────────────────
  const lobbyB       = await prisma.node.create({ data: { name: 'Lobby B',                 floor: 1, building: 'B', type: 'corridor'  } })
  const cafeteria    = await prisma.node.create({ data: { name: 'Cafeteria',               floor: 1, building: 'B', type: 'room'      } })
  const corrB1       = await prisma.node.create({ data: { name: 'Corridor B-1',            floor: 1, building: 'B', type: 'corridor'  } })
  const confHall     = await prisma.node.create({ data: { name: 'Conference Hall',         floor: 1, building: 'B', type: 'room'      } })
  const exitB        = await prisma.node.create({ data: { name: 'Emergency Exit B',         floor: 1, building: 'B', type: 'exit'      } })
  const waterB1      = await prisma.node.create({ data: { name: 'Water Point B1',           floor: 1, building: 'B', type: 'washroom'  } })
  const stairB1      = await prisma.node.create({ data: { name: 'Stairwell B (F1)',         floor: 1, building: 'B', type: 'stair'     } })
  const liftB1       = await prisma.node.create({ data: { name: 'Lift B (F1)',              floor: 1, building: 'B', type: 'lift'      } })

  // ─── Building B · Floor 2 ─────────────────────────────────────────────────
  const stairB2      = await prisma.node.create({ data: { name: 'Stairwell B (F2)',         floor: 2, building: 'B', type: 'stair'     } })
  const liftB2       = await prisma.node.create({ data: { name: 'Lift B (F2)',              floor: 2, building: 'B', type: 'lift'      } })
  const corrB2       = await prisma.node.create({ data: { name: 'Corridor B-2',             floor: 2, building: 'B', type: 'corridor'  } })
  const hrDept       = await prisma.node.create({ data: { name: 'HR Department',            floor: 2, building: 'B', type: 'room'      } })
  const financeDept  = await prisma.node.create({ data: { name: 'Finance Department',       floor: 2, building: 'B', type: 'room'      } })
  const wmB2         = await prisma.node.create({ data: { name: 'Washroom B Floor 2',       floor: 2, building: 'B', type: 'washroom'  } })

  console.log(`✅ Created ${34} nodes`)

  // ─── EDGES ────────────────────────────────────────────────────────────────
  console.log('🌱 Seeding edges...')

  const edges = [
    // Building A · Floor 1 internal
    { start_node: reception.id,  end_node: lobbyA.id,     distance: 10,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: lobbyA.id,     end_node: corrA1.id,     distance: 15,  is_accessible: true,  congestion_weight: 1.5, accessibility_reason: null },
    { start_node: corrA1.id,     end_node: meetA1a.id,    distance: 5,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA1.id,     end_node: meetA1b.id,    distance: 7,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: lobbyA.id,     end_node: wmA1.id,       distance: 8,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: lobbyA.id,     end_node: wfA1.id,       distance: 8,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: lobbyA.id,     end_node: exitA.id,      distance: 12,  is_accessible: true,  congestion_weight: 1.0 },
    // Stairs: NOT wheelchair accessible
    { start_node: lobbyA.id,     end_node: stairA1.id,    distance: 10,  is_accessible: false, congestion_weight: 1.0, accessibility_reason: 'Stairs — use Lift A instead' },
    // Lift: wheelchair accessible
    { start_node: lobbyA.id,     end_node: liftA1.id,     distance: 12,  is_accessible: true,  congestion_weight: 1.0 },
    // Bridge: time-restricted (closed 22:00–07:00)
    { start_node: lobbyA.id,     end_node: bridgeA.id,    distance: 20,  is_accessible: true,  congestion_weight: 1.0, open_hours: '07:00-22:00' },

    // Vertical connections A (F1 → F2)
    { start_node: stairA1.id,    end_node: stairA2.id,    distance: 20,  is_accessible: false, congestion_weight: 1.0, accessibility_reason: 'Stairs — use Lift A instead' },
    { start_node: liftA1.id,     end_node: liftA2.id,     distance: 15,  is_accessible: true,  congestion_weight: 1.0 },

    // Building A · Floor 2 internal
    { start_node: stairA2.id,    end_node: corrA2.id,     distance: 8,   is_accessible: false, congestion_weight: 1.0, accessibility_reason: 'Stairs — use Lift A instead' },
    { start_node: liftA2.id,     end_node: corrA2.id,     distance: 8,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA2.id,     end_node: meetA2a.id,    distance: 5,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA2.id,     end_node: meetA2b.id,    distance: 7,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA2.id,     end_node: meet4B.id,     distance: 12,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA2.id,     end_node: officeWing.id, distance: 15,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA2.id,     end_node: wmA2.id,       distance: 6,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrA2.id,     end_node: wfA2.id,       distance: 6,   is_accessible: true,  congestion_weight: 1.0 },

    // Bridge → Building B (inter-building, time-restricted)
    { start_node: bridgeA.id,    end_node: lobbyB.id,     distance: 15,  is_accessible: true,  congestion_weight: 1.0, open_hours: '07:00-22:00' },

    // Building B · Floor 1 internal
    { start_node: lobbyB.id,     end_node: cafeteria.id,  distance: 10,  is_accessible: true,  congestion_weight: 2.0 }, // high congestion at lunch
    { start_node: lobbyB.id,     end_node: corrB1.id,     distance: 12,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: lobbyB.id,     end_node: waterB1.id,    distance: 5,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrB1.id,     end_node: confHall.id,   distance: 8,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrB1.id,     end_node: exitB.id,      distance: 10,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrB1.id,     end_node: stairB1.id,    distance: 8,   is_accessible: false, congestion_weight: 1.0, accessibility_reason: 'Stairs — use Lift B instead' },
    { start_node: corrB1.id,     end_node: liftB1.id,     distance: 10,  is_accessible: true,  congestion_weight: 1.0 },
    // Night corridor B1 (closed 21:00–06:00)
    { start_node: cafeteria.id,  end_node: corrB1.id,     distance: 6,   is_accessible: true,  congestion_weight: 1.0, open_hours: '06:00-21:00' },

    // Vertical connections B (F1 → F2)
    { start_node: stairB1.id,    end_node: stairB2.id,    distance: 20,  is_accessible: false, congestion_weight: 1.0, accessibility_reason: 'Stairs — use Lift B instead' },
    { start_node: liftB1.id,     end_node: liftB2.id,     distance: 15,  is_accessible: true,  congestion_weight: 1.0 },

    // Building B · Floor 2 internal
    { start_node: stairB2.id,    end_node: corrB2.id,     distance: 8,   is_accessible: false, congestion_weight: 1.0, accessibility_reason: 'Stairs — use Lift B instead' },
    { start_node: liftB2.id,     end_node: corrB2.id,     distance: 8,   is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrB2.id,     end_node: hrDept.id,     distance: 10,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrB2.id,     end_node: financeDept.id,distance: 12,  is_accessible: true,  congestion_weight: 1.0 },
    { start_node: corrB2.id,     end_node: wmB2.id,       distance: 6,   is_accessible: true,  congestion_weight: 1.0 },
  ]

  await prisma.edge.createMany({ data: edges })
  console.log(`✅ Created ${edges.length} edges`)

  // ─── POIs ─────────────────────────────────────────────────────────────────
  console.log('🌱 Seeding POIs...')

  const pois = [
    { node_id: wmA1.id,        type: 'washroom',    description: 'Male washroom — Building A, Floor 1'   },
    { node_id: wfA1.id,        type: 'washroom',    description: 'Female washroom — Building A, Floor 1' },
    { node_id: exitA.id,       type: 'exit',        description: 'Emergency Exit A — Assembly Point North'},
    { node_id: wmA2.id,        type: 'washroom',    description: 'Male washroom — Building A, Floor 2'   },
    { node_id: wfA2.id,        type: 'washroom',    description: 'Female washroom — Building A, Floor 2' },
    { node_id: cafeteria.id,   type: 'cafeteria',   description: 'Main cafeteria — Building B, Floor 1'  },
    { node_id: waterB1.id,     type: 'water_point', description: 'Water dispenser — Building B, Floor 1' },
    { node_id: exitB.id,       type: 'exit',        description: 'Emergency Exit B — Assembly Point East' },
    { node_id: wmB2.id,        type: 'washroom',    description: 'Washroom — Building B, Floor 2'        },
  ]

  await prisma.poi.createMany({ data: pois })
  console.log(`✅ Created ${pois.length} POIs`)

  // ─── USERS ────────────────────────────────────────────────────────────────
  console.log('🌱 Seeding users...')

  const adminHash = await bcrypt.hash('Admin@123', 10)
  const userHash  = await bcrypt.hash('User@123', 10)

  await prisma.user.createMany({
    data: [
      { username: 'admin', password_hash: adminHash, role: 'admin' },
      { username: 'yash',  password_hash: userHash,  role: 'user'  },
    ],
  })
  console.log('✅ Created 2 users')

  console.log('\n🎉 Seed complete!')
  console.log('\n📍 Key node IDs for testing:')
  console.log(`   Reception         → id: ${reception.id}`)
  console.log(`   Meeting Room 4B   → id: ${meet4B.id}`)
  console.log(`   Cafeteria         → id: ${cafeteria.id}`)
  console.log(`   Emergency Exit A  → id: ${exitA.id}`)
  console.log(`   Lift A (F1)       → id: ${liftA1.id}`)
  console.log(`   HR Department     → id: ${hrDept.id}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
