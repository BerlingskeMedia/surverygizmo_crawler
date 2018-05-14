const mdb = require('../lib/mdb_client');
const Sgizmo = require('../lib/surveygizmo_client');
const {parseData} = require('../lib/surveygizmo_parser');

function run() {
  return getSurveysFromGizmo()
    .then(surveys => {
      const mdbRequests = surveys
        .map(({survey, responses}) => {
          const payload = getMdbPayload(survey, responses);
          // TODO: perform mdb request for this payload
          return sendPayloadToMdb(payload);
        });

      Promise.all(mdbRequests).then(() => {
        // TODO: clean up mdb after all requests


        // TODO: schedule next walk
        setTimeout(() => run(), 12 * 60 * 60 * 1000);
      });
    })
  .catch(err => {
    console.error(err);
  });

}

function isValidEmail(text) {
  return text.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

function findContactEmail(response) {
  const keys = Object.keys(response.survey_data);

  for (let i = 0, n = keys.length; i < n; i++) {
    const answer = response.survey_data[keys[i]];

    if (answer.type === 'parent') {
      const subKeys = Object.keys(answer.subquestions);
      for (let j = 0, m = subKeys.length; j < m; j++) {
        const subAnswer = answer.subquestions[subKeys[j]];

        if (isValidEmail(subAnswer.answer)) {
          return subAnswer.answer;
        }
      }
    } else if (isValidEmail(answer.answer)) {
      return answer.answer;
    }
  }

  return null;
}

function getMdbPayload(survey, responses) {
  return responses.map(response => {
    const contactEmail = findContactEmail(response);

    if (contactEmail) {
      return {
        surveyId: survey.id,
        surveyName: survey.title,
        contactEmail,
        date: response.date_submitted,
        jsonData: parseData(response)
      };
    }

    return null;
  }).filter(payload => payload !== null);
}

function getPagedResults(getter, pageSize) {
  return new Promise((fulfill, reject) => {
    getter(pageSize, 1).then(firstResponse => {
      const requests = [Promise.resolve(firstResponse)];

      // TODO: count to firstResponse.total_pages
      // for (let i = 2, n = firstResponse.total_pages; i < n; i++) {
      for (let i = 2, n = 1; i < n; i++) {
        requests.push(getter(pageSize, i));
      }

      Promise.all(requests)
        .then(responses => responses.reduce((flat, response) => flat.concat(response.data), []))
        .then(fulfill)
        .catch(reject);
    });
  });
}

function getAllSurveys() {
  return getPagedResults((pageSize, page) => Sgizmo.getSurveys(pageSize, page), 2);
}

function getAllSurveyResponses(surveyId) {
  return getPagedResults((pageSize, page) => Sgizmo.getSurveyResponse(surveyId, pageSize, page), 2);
}

function getSurveysFromGizmo() {
  return getAllSurveys().then(surveys => {
    const allSurveysWithResponses = surveys
      .filter(survey => !!survey.statistics)
      .map(survey => getAllSurveyResponses(survey.id).then(responses => ({
          survey,
          responses
      })));

    return Promise.all(allSurveysWithResponses);
  });
}

function sendPayloadToMdb(payload) {
  const tableName = 'tbl_surveygizmo';
  const tableFields = ['survey_id', 'survey_name', 'email', 'date_submitted', 'json_data'];
  // const deleteQuery = `DELETE from ${tableName} WHERE survey_id=${payload.surveyId};`;
  const insertQuery = `INSERT INTO ${tableName} (${tableFields.join(',')}) VALUES ${payload.map(item => `(${item.surveyId}, '${item.surveyName}', '${item.contactEmail}', '${item.date}', '${item.jsonData}')`).join(', ')};`;

  return Promise.resolve();
}

run();
