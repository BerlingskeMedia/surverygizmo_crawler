const request = require('request');
const {boomify, badImplementation} = require('boom');

class Http {
  static get(url) {
    return Http.request('get', url);
  }

  static post(url, payload) {
    return Http.request('post', url, payload);
  }

  static request(method, uri, payload = null) {
    return new Promise((fulfill, reject) => {
      request({
        uri,
        method,
        json: payload,
      }, (err, response, body) => {
        if (err) {
          reject(err);
        } else if (response.statusCode > 299) {
          reject({response, body});
        } else {
          fulfill(Http.parseResponse(body));
        }
      });
    });
  }

  static parseResponse(response) {
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch (e) {
        return null;
      }
    }

    return response;
  }
}

module.exports = Http;
