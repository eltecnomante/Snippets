(function() {
  var data;
  $.getJSON('/js/resources/profile-data.json', {
    param1: 'value1'
  }, function(json, textStatus) {
    data = json;

    var personal = '<dt>Nombre</dt><dd>' + data.name + '</dd>' +
      '<dt>Apellido 1</dt><dd>' + data.surname1 + '</dd>' +
      '<dt>Apellido 2</dt><dd>' + data.surname2 + '</dd>' +
      '<dt>Correo</dt><dd>' + data.personal.email + '</dd>' +
      '<dt>Direccion</dt><dd>' + data.personal.address + '</dd>' +
      '<dt>Ciudad</dt><dd>' + data.personal.city + '</dd>' +
      '<dt>Teléfono</dt><dd>' + data.personal.mobile_phone + '</dd>';

    $(personal).appendTo($('.personal'));

    var pro = '<dt>Area</dt><dd>' + data.area_code + '</dd>' +
      '<dt>Level</dt><dd>' + data.level_code + '</dd>' +
      '<dt>Oficina</dt><dd>' + data.location_code + '</dd>' +
      '<dt>Responsable</dt><dd>' + data.responsible_initials + '</dd>';

    $(pro).appendTo($('.professional'));

    var holy = '<dt>Dias Anuales</dt><dd>' + data.holidays.period + '</dd>' +
      '<dt>Dias Acumulados</dt><dd>' + data.holidays.overdue + '</dd>' +
      '<dt>Dias asignados</dt><dd>' + (data.holidays.asgined >= 0 ? data.holidays.asigned : 0) + '</dd>' +
      '<dt>Dias disfrutados</dt><dd>' + (data.holidays.asgined >= 0 ? data.holidays.asigned : 0) + '</dd>';

    $(holy).appendTo($('.holidays'));


  }).done(function() {
    console.log("second success");
  }).fail(function() {
    console.log("error");
  });
})();
