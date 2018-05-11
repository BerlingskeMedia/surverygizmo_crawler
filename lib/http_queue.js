const Http = require('./http');

const ONE_MINUTE = 60000;

class HttpQueue {
  constructor(requestsPerMinute) {
    this.q = [];
    this.firstRequestTime = 0;
    this.requestsPerMinute = requestsPerMinute;
    this.requestsSoFar = 0;
    this.startInterval();
  }

  queue(url) {
    return new Promise((fulfill, reject) => {
      console.log('[http queue] added item to queue', url);
      this.q.push({url, pending: false, fulfill, reject});
    });
  }

  shiftQueue() {
    const qItem = this.q[0];

    console.log('[http queue] shift queue request', qItem.url);
    qItem.pending = true;
    this.requestsSoFar = this.requestsSoFar + 1;

    Http.get(qItem.url)
      .then(response => {
        console.log('[http queue] shift queue response');
        this.q.shift();
        qItem.fulfill(response);
      })
      .catch(response => {
        console.log('[http queue] shift queue response failed');
        this.q.shift();
        qItem.reject(response);
      });
  }

  startInterval() {
    setInterval(() => {
      if (this.q.length === 0) {
        return;
      }

      if (this.q[0].pending) {
        return;
      }

      if (Date.now() - this.firstRequestTime >= ONE_MINUTE) {
        console.log('[http queue] interval step: at least one minute passed', this.firstRequestTime);
        this.requestsSoFar = 0;
        this.firstRequestTime = Date.now();
      }

      if (this.requestsSoFar < this.requestsPerMinute) {
        console.log('[http queue] interval step: requestsSoFar < requestsPerMinute');
        this.shiftQueue();
      }

      console.log('[http queue] interval step: too many requests. Waiting...');
    }, 100);
  }
}

module.exports = HttpQueue;