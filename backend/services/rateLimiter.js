// Simple rate limiter for request throttling

class RateLimiter {
  constructor(requestsPerSecond = 1) {
    this.requestsPerSecond = requestsPerSecond;
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
    this.queue = [];
    this.processing = false;
  }

  async waitForNext() {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequest;
    const waitTime = Math.max(0, this.minInterval - timeSinceLast);

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest = Date.now();
  }

  async throttle(fn) {
    await this.waitForNext();
    return fn();
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift();
      
      try {
        await this.waitForNext();
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  reset() {
    this.lastRequest = 0;
    this.queue = [];
    this.processing = false;
  }
}

module.exports = { RateLimiter };