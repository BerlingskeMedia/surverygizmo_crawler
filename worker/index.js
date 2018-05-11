const mdb = require('../lib/mdb_client');
const Sgizmo = require('../lib/surveygizmo_client');

function run() {
  return getSurveysFromGizmo()
    .then(surveys => {
      const mdbRequests = surveys.map(({survey, responses}) => {
        const payload = getMdbPayload(survey, responses);
        // TODO: build sql from payload
        console.log(payload.contactEmail);
        return Promise.resolve();
        // TODO: perform mdb request for this payload
        return mdb.query('INSERT...');
      });

      Promise.all(mdbRequests).then(() => {
        // TODO: clean up mdb after all requests
        // TODO: schedule next walk
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

  for (let i = 0, n = keys.length, answer = response.survey_data[keys[i]]; i < n; i++) {
    if (answer.type === 'parent') {
      const subKeys = Object.keys(answer.subquestions);
      for (let j = 0, m = subKeys.length, subAnswer = answer.subquestions[subKeys[j]]; j < m; j++) {
        if (isValidEmail(subAnswer.answer)) {
          return subAnswer.answer;
        }
      }
    }

    if (isValidEmail(answer.answer)) {
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
        date: response.date_submitted
      };
    }

    return null;
  }).filter(payload => payload !== null);
}

function getPagedResults(getter, pageSize) {
  return new Promise((fulfill, reject) => {
    getter(pageSize, 1).then(firstResponse => {
      const requests = [Promise.resolve(firstResponse)];

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
  return getPagedResults((pageSize, page) => Sgizmo.getSurveys(pageSize, page), 10);
}

function getAllSurveyResponses(surveyId) {
  return getPagedResults((pageSize, page) => Sgizmo.getSurveyResponse(surveyId, pageSize, page), 10);
}

function getSurveysFromGizmo() {
  return getAllSurveys().then(surveys => {
    const allSurveysWithResponses = surveys.map(survey => {
      return getAllSurveyResponses(survey.id).then(responses => ({survey, responses}));
    });

    return Promise.all(allSurveysWithResponses);
  });
}


function itereateSurveryLists({lists, index = 0}){
  // console.log(lists);
  return 1;
  const list = lists[index];

  function listComplete() {
    if (++index === lists.length) {
      console.log('All lists have been cycled through');
      return Promise.resolve()
    } else {
      return itereateSurveryLists({lists: lists, index: index});
    }
  }

  return getSurveyContacts({surveyId: list.id})
  .then(contacts => doSomeStuff({contacts: contacts}))
  .then(() => listComplete());

}


function getSurveyContacts({surveyId}){
  const fakeData = [
      {
      surveyId: 1212,
      surveyName: 'DSADA',
      contactId: 112123,
      contactEmail: 'ddas@fdsfsd.dk',
      date: new Date()
    }
  ];

  return Promise.resolve(fakeData);
}


function doSomeStuff({contacts, index = 0}){

  const contact = contacts[index];

  function contactsComplete() {
    if (++index === contacts.length) {
      console.log('All contacts have been cycled through');
      return Promise.resolve()
    } else {
      return doSomeStuff({contacts: contacts, index: index});
    }
  }

  // This will me an UPSERT where we also set our own date for the last insert/update

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Here we update the MDB database
      console.log(`This user ${contact.contactId} has been updated`);
      return resolve();
    }, 1000);
  });
}


function cleanUpOldRows(){

  // Here we will delete all rows that have not been UPSERT in the last 3 months

  const some_shitty_data = 'sds';
  const sql = `DELETE FROM tbl_survers WHERE dsdsdsds = ${some_shitty_data}`;
  // return mdb.query(sql);
  console.log('Deleting');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Here we update the MDB database
      console.log(`All old rows have been deleted`);
      return resolve();
    }, 2000);
  });
}


function waitUntil({timeout}){
  console.log(`Waiting ${timeout/1000} seconds`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve();
    }, timeout);
  });
}

run();
