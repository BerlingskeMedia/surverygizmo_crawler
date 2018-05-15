const striptags = require('striptags');

module.exports.parseData = ({id, language, ip_address, referer, user_agent, longitude, latitude, country, city, region, postal, dma, survey_data}) => {
  return JSON.stringify({
    response_id : id,
    language,
    ip_address,
    referer,
    user_agent,
    longitude,
    latitude,
    country,
    city,
    region,
    postal,
    dma,
    survey_data: parseSurveyData(survey_data)
  });
};

function parseSurveyData(surveyData) {
  const innerValues = [];

  const newValues = values(surveyData)
    .map(singleAnswerParser(innerValues))
    .filter(answer => !!answer)
    .map(answer => ({q: striptags(answer.q), a: striptags(answer.a)}));

  return newValues.concat(innerValues);
}

function values(object) {
  return Object.keys(object).map(key => object[key]);
}

function singleAnswerParser(innerValues) {
  return (answer) => {
    if (answer.answer) {
      return {q: answer.question, a: answer.answer};
    }

    if (answer.type === 'parent') {
      if (answer.options) {
        innerValues.concat(values(answer.options).map(option => ({
          q: answer.question,
          a: option.answer
        })));
      } else if (answer.subquestions) {
        innerValues.concat(values(answer.subquestions).map(subQuestion => ({
          q: subQuestion.question,
          a: subQuestion.answer
        })));
      }
    }

    return null;
  }
}
