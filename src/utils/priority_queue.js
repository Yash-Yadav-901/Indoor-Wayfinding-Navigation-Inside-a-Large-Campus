export class PriorityQueue {
  constructor() {
    this.heap = []
  }

  enqueue(node, dist) {
    this.heap.push({ node, dist })
    let idx = this.heap.length - 1
    while (idx > 0) {
      let parent = Math.floor((idx - 1) / 2)
      if (this.heap[idx].dist < this.heap[parent].dist) {
        let tmp = this.heap[idx]
        this.heap[idx] = this.heap[parent]
        this.heap[parent] = tmp
        idx = parent
      } else {
        break
      }
    }
  }

  dequeue() {
    if (this.heap.length === 0) return null
    if (this.heap.length === 1) return this.heap.pop()

    let root = this.heap[0]
    this.heap[0] = this.heap.pop()
    let idx = 0
    let len = this.heap.length

    while (2 * idx + 1 < len) {
      let left = 2 * idx + 1
      let right = 2 * idx + 2
      let smallest = left

      if (right < len && this.heap[right].dist < this.heap[left].dist) {
        smallest = right
      }

      if (this.heap[idx].dist > this.heap[smallest].dist) {
        let tmp = this.heap[idx]
        this.heap[idx] = this.heap[smallest]
        this.heap[smallest] = tmp
        idx = smallest
      } else {
        break
      }
    }

    return root
  }

  isEmpty() {
    return this.heap.length === 0
  }
}
