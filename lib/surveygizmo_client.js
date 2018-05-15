const HttpQueue = require('./http_queue');
const httpQueue = new HttpQueue(process.env.SURVEYGIZMO_REST_API_MAXIMUM_FETCHES_PER_MINUTE);

class SGClient {
  static withCredentials(path) {
    path = `${process.env.SURVEYGIZMO_REST_API_URL}${path}`;
    return `${path}?api_token=${process.env.SURVEYGIZMO_REST_API_AUTH_KEY}&api_token_secret=${process.env.SURVEYGIZMO_REST_API_AUTH_SECRET_KEY}`;
  }

  static getSurveys (pageSize, page){
    const path = SGClient.withCredentials('/survey');
    return httpQueue.queue(`${path}&resultsperpage=${pageSize}&page=${page}`);
  }

  static getSurveyResponse(surveyId, pageSize, page) {
    const path = SGClient.withCredentials(`/survey/${surveyId}/surveyresponse`);
    return httpQueue.queue(`${path}&resultsperpage=${pageSize}&page=${page}`);
  }
}

module.exports = SGClient;
