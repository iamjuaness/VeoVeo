type QueueTask<T = any> = () => Promise<T>;

class RequestQueue {
  private queues: Map<
    string,
    Array<{
      task: QueueTask;
      resolve: (value: any) => void;
      reject: (reason: any) => void;
    }>
  > = new Map();
  
  private processing: Map<string, boolean> = new Map();

  /**
   * Enqueue an asynchronous task associated with a specific key.
   * Tasks with the same key are executed sequentially.
   * Tasks with different keys run concurrently.
   */
  enqueue<T>(key: string, task: QueueTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (!this.queues.has(key)) {
        this.queues.set(key, []);
      }
      this.queues.get(key)!.push({ task, resolve, reject });
      this.process(key);
    });
  }

  private async process(key: string) {
    if (this.processing.get(key)) return;
    this.processing.set(key, true);

    const queue = this.queues.get(key);
    while (queue && queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;

      try {
        const result = await item.task();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.processing.set(key, false);
    if (queue && queue.length === 0) {
      this.queues.delete(key);
      this.processing.delete(key);
    }
  }
}

export const requestQueue = new RequestQueue();
