$("body").append($('<div id="app"></div>'))

$('<link/>', {rel: 'stylesheet', type: 'text/css', href: 'https://fonts.googleapis.com/css?family=Roboto&display=swap'}).appendTo('head');
$('<link/>', {rel: 'stylesheet', type: 'text/css', href: 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css'}).appendTo('head');
$('<link/>', {rel: 'stylesheet', type: 'text/css', href: 'http://local.opinautos.com:1234/party.5b5cc299.css'}).appendTo('head');

window.realtimeChatUri = "http://local.opinautos.com:3030";

$.getScript("http://local.opinautos.com:1234/party.5b5cc299.js", function(data, textStatus, jqxhr) {
  // console.log(data); //data returned
  // console.log(textStatus); //success
  // console.log(jqxhr.status); //200
  console.log('Loaded party.js.', jqxhr.status, textStatus);

  $.getScript("http://local.opinautos.com:1234/src.7ed060e2.js", function(data, textStatus, jqxhr) {
    console.log('Loaded src.js.', jqxhr.status, textStatus);
  })
});