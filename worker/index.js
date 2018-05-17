const mdb = require('../lib/mdb_client');
const Sgizmo = require('../lib/surveygizmo_client');
const {parseData} = require('../lib/surveygizmo_parser');
const RESULTS_PER_PAGE = process.env.SURVEYGIZMO_REST_API_RESULTS_PER_PAGE || 50;
// debugging feature
// process.on('unhandledRejection', r => console.log(r));
function run() {
  return getSurveysFromGizmo()
    .then(() => {
      console.log('schedule next walk');
      setTimeout(() => run(), 12 * 60 * 60 * 1000);
    })
    .catch(err => {
      console.error(err);
    });

}

function isNotEmptyString(text) {
  return typeof text === 'string' && text !== "";
}

function isValidEmail(text) {
  return isNotEmptyString(text) && text.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

function findContactEmail(response) {
  if (!response.survey_data) {
    return null;
  }
  const keys = Object.keys(response.survey_data);

  for (let i = 0, n = keys.length; i < n; i++) {
    const answer = response.survey_data[keys[i]];

    if (answer.type === 'parent') {
      const subKeys = Object.keys(answer.subquestions);
      for (let j = 0, m = subKeys.length; j < m; j++) {
        const subAnswer = answer.subquestions[subKeys[j]];

        if (subAnswer.answer && isValidEmail(subAnswer.answer)) {
          return subAnswer.answer;
        }
      }
    } else if (answer.answer && isValidEmail(answer.answer)) {
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
        contactEmail: contactEmail.toLowerCase(),
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
      for (let i = 2, n = firstResponse.total_pages; i < n; i++) {
      // for (let i = 2, n = 2; i < n; i++) {
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
  return getPagedResults((pageSize, page) => Sgizmo.getSurveys(pageSize, page), RESULTS_PER_PAGE);
}

function getAllSurveyResponses(surveyId) {
  return getPagedResults((pageSize, page) => Sgizmo.getSurveyResponse(surveyId, pageSize, page), RESULTS_PER_PAGE);
}

function getSurveysFromGizmo() {
  return getAllSurveys().then(surveys => {
    const allSurveys = surveys
      .filter(survey => !!survey.statistics);

    allSurveys.forEach(survey => {
      getAllSurveyResponses(survey.id).then(responses => {
        cleanUpMdb(survey.id);
        if (responses && responses.length) {
          const payload = getMdbPayload(survey, responses);
          if (payload.length > 0) {
            sendPayloadToMdb(payload);
          }
        }
      });
    });

    return Promise.resolve();
  });
}

function sendPayloadToMdb(payload) {
  const tableName = 'tbl_surveygizmo';
  const tableFields = ['survey_id', 'survey_name', 'email', 'date_submitted', 'json_data'];
  const insertQuery = `INSERT INTO ${tableName} (${tableFields.join(',')}) VALUES ${payload.map(item => `(${item.surveyId}, '${item.surveyName}', '${item.contactEmail}', '${item.date}', '${item.jsonData.replace(/'/g, "''")}')`).join(', ')};`;

  mdb.query(insertQuery, function (err, result) {
    if (err) {
      console.log('ERROR: unsuccesfull import');
    } else {
      console.log(`INSERT SUCCESS`);
    }
  });
  return Promise.resolve();
}

function cleanUpMdb(surveyId) {
  const tableName = 'tbl_surveygizmo';
  const deleteQuery = `DELETE FROM ${tableName} WHERE survey_id = ${surveyId};`;
  mdb.query(deleteQuery, function (err, result) {
    if (err) {
      console.log('ERROR: unsuccesfull delete from ', surveyId);
    } else {
      console.log(`DELETE for surveyID ${surveyId} SUCCESS`);
    }
  });
}

run();
