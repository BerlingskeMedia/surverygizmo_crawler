
// const mdb = require('./mdb_client');

function run() {

  return fakeGetSurveysFromGizmo()
  .then(lists => itereateSurveryLists({lists: lists}))
  .then(() => cleanUpOldRows())
  .then(() => waitUntilNext())
  .then(() => run())
  .catch(err => console.error(err));

}


function fakeGetSurveysFromGizmo(){
  const fakeSurveryList = [
    {surveyId: 1212},
    {surveyId: 1213}
  ];

  return Promise.resolve(fakeSurveryList);
}


function itereateSurveryLists({lists, index = 0}){

  const list = lists[index];

  function listComplete() {
    if (++index === list.length) {
      console.log('All lists have been cycled through');
      return Promise.resolve()
    } else {
      return itereateSurveryLists({lists: lists, index: index});
    }
  }

  return getSurveyContacts({surveyId: list.surveyId})
  .then(contacts => doSomeStuff({contacts: contacts}))
  .then(() => listComplete())
  .catch(err => console.error(err));

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


function waitUntilNext(){
  console.log('Waiting');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
    }, 4000);
  });
}

run();
