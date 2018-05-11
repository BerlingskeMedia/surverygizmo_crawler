/*jshint node: true */
'use strict';

const { Client } = require('pg');

//conString format "postgres://username:password@localhost/database";
var conString = 'postgres://' + process.env.MDB_USERNAME + ':' + process.env.MDB_PASSWORD + '@' + process.env.MDB_ADDRESS + ':' + process.env.MDB_PORT + '/' + process.env.MDB_DATABASE;

if(/[:@\/]undefined[:@\/]?/.test(conString)){
  console.log('Database connection ENV vars are missing. Exiting...');
  process.exit(1);
}

console.log(conString);
const client = new Client({connectionString: conString});
client.connect()
.then(() => {
  console.log('Connected to PostgreSQL ' + client.host + '/' + client.database + ' as ' + client.user + '...');
})
.catch((err) => {
  console.error('connection error', err.stack)
});


module.exports.queryWithParam = function (sql, param, callback) {
  if (callback === undefined && typeof param === 'function') {
    callback = param;
    param = null;
  }

  client.query(sql, param, function (err, result) {
    if (err !== null) {
      console.error(Date().toString(), err);
    }
    if (callback !== undefined && typeof callback === 'function') {
      callback(err, result);
    }
  });
};


module.exports.query = function (sql, callback) {
  if (callback) {
    module.exports.queryWithParam(sql, null, callback);
  } else {
    return new Promise((resolve, reject) => {
      module.exports.queryWithParam(sql, null, function(err, result) {
        if(err) {
          reject(err);
        } else {
          resolve(result.rows);
        }
      });
    });
  }
};
