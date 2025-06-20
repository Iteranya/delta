class AsyncQueue {
  constructor() {
    this.queue = [];
    this.resolvers = [];
    this.pendingTasks = 0;
    this.joinResolvers = [];
  }

  enqueue(item) {
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift();
      this.pendingTasks++;
      resolve(item);
    } else {
      this.queue.push(item);
    }
  }

  dequeue() {
    return new Promise((resolve) => {
      if (this.queue.length > 0) {
        this.pendingTasks++;
        resolve(this.queue.shift());
      } else {
        this.resolvers.push(resolve);
      }
    });
  }

  task_done() {
    this.pendingTasks--;
    if (this.pendingTasks === 0) {
      while (this.joinResolvers.length > 0) {
        this.joinResolvers.shift()();
      }
    }
  }

  join() {
    return new Promise((resolve) => {
      if (this.pendingTasks === 0) {
        resolve();
      } else {
        this.joinResolvers.push(resolve);
      }
    });
  }
}

module.exports = queue;
