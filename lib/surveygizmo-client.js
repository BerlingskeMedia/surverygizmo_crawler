const Http = require('./http');

class SGClient {
  static withCredentials(path) {
    path = `${process.env.SURVEYGIZMO_REST_API_URL}${path}`;
    return `${path}?api_token=${process.env.SURVEYGIZMO_REST_API_AUTH_KEY}&api_token_secret=${process.env.SURVEYGIZMO_REST_API_AUTH_SECRET_KEY}`;
  }

  static getSurveys (params){
    const path = SGClient.withCredentials('/survey');
    return Http.get(`${path}&resultsperpage=10&page=1`);
  }

  static getSurveyResponse(surveyId) {
    const path = SGClient.withCredentials(`/survey/${surveyId}/surveyresponse`);
    return Http.get(`${path}&resultsperpage=10&page=1`);
  }
}

module.exports = SGClient;
