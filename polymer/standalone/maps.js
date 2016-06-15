(function(){

  $.ajax({
    url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=1&user_id=eltecnomante&screen_name=test%20api1',
    type: 'GET',
    dataType: 'default: Intelligent Guess (Other values: xml, json, script, or html)',
    data: {param1: 'value1'}
  })
  .done(function() {
    console.log("success");
  })
  .fail(function() {
    console.log("error");
  })
  .always(function() {
    console.log("complete");
  });

})();
