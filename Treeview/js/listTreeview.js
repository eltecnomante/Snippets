var origin = [];
var transform = [];
var tree = [];

var drawTree = function(level) {
  var final = [];
  transform = [];
  var i = 0,
    j = 0,
    k = 0,
    l = 0;
  $.getJSON('js/families.json', {
    param1: 'value1'
  }).done(function(json, textStatus) {
    origin = json;

    for (i; i < origin.Families_1.length; i++) {
      if (level >= 1) {
        transform.push({
          'id': origin.Families_1[i].Identifier,
          'text': origin.Families_1[i].Text,
          'children': []
        });
      } else {
        transform.push({
          'id': origin.Families_1[i].Identifier,
          'text': origin.Families_1[i].Text
        });
      }
    }

    //Second level
    i = 0;
    j = 0;
    for (i; i < origin.Families_2.length && level >= 2; i++) {

      var text = origin.Families_2[i].ParentId_1;

      var family1;
      var next = 1;
      j = 0;
      while (next && j < transform.length) {

        if (transform[j].id == text) {
          if (level >= 2) {
            transform[j].children.push({
              'id': origin.Families_2[i].Identifier,
              'text': origin.Families_2[i].Text,
              'children': []
            });
          } else {
            transform[j].children.push({
              'id': origin.Families_2[i].Identifier,
              'text': origin.Families_2[i].Text
            });
          }
          next = 0;
        }
        j++;
      }

    }

    //Third level
    i = 0;
    j = 0;
    k = 0;
    var nextGrandParent = 1;
    var next = 1;
    for (i; i < origin.Families_3.length && level >= 3; i++) {

      var text = origin.Families_3[i].ParentId_1;

      var family1 = origin.Families_3[i].ParentId_1;
      var family2 = origin.Families_3[i].ParentId_2;
      j = 0;
      k = 0;
      nextGrandParent = 1;
      next = 1;
      while (nextGrandParent && j < transform.length) {

        if (transform[j].id == family1) {
          nextGrandParent = 0;
          while (next && k < transform[j].children.length) {

            if (transform[j].children[k].id == family2) {
              if (level >= 3) {
                transform[j].children[k].children.push({
                  'id': origin.Families_3[i].Identifier,
                  'text': origin.Families_3[i].Text,
                  'children': []
                });
              } else {
                transform[j].children[k].children.push({
                  'id': origin.Families_3[i].Identifier,
                  'text': origin.Families_3[i].Text
                });
              }
              next = 0;
            }
            k++;
          }
        }
        j++;
      }
    }


    //Fourth nivel
    i = 0;
    j = 0;
    k = 0;
    l = 0;
    var nextGrandParent = 1;
    var nextG3Parent = 1;
    var next = 1;
    for (i; i < origin.Families_4.length && level >= 4; i++) {

      var text = origin.Families_3[i].ParentId_1;

      var family1 = origin.Families_4[i].ParentId_1;
      var family2 = origin.Families_4[i].ParentId_2;
      var family3 = origin.Families_4[i].ParentId_3;
      j = 0;
      k = 0;
      l = 0;
      nextGrandParent = 1;
      nextG3Parent = 1;
      while (nextG3Parent && j < transform.length) {

        if (transform[j].id == family1) {
          nextG3Parent = 0;
          nextGrandParent = 1;
          while (nextGrandParent && k < transform[j].children.length) {

            if (transform[j].children[k].id == family2) {
              nextGrandParent = 0;
              next = 1;
              while (next && l < transform[j].children[k].children.length) {

                if (transform[j].children[k].children[l].id == family3) {
                  transform[j].children[k].children[l].children.push({
                    'id': origin.Families_4[i].Identifier,
                    'text': origin.Families_4[i].Text
                  });
                  next = 0;
                  //  console.log('inserting ' + j + ' ' + k + ' ' + l);
                }
                l++;
              }
            }
            k++;
          }
        }
        j++;
      }
    }

    final.push({
      'text': 'Familias',
      'id': 1,
      children: transform
    });


    $('#tree').jstree({
      'core': {
        'data': final
      },
      'plugins': ['search']
    });
  });
};


var getSelectedChildren = function(level, selectedid) {

  var i = 1,
    j = 1,
    k = 1;
  var next = level;
  next++;

  if (selectedid == "-1") {
    $('#select_' + level + ' option').not('.hidden').each(function() {

      $('#select_' + next + ' option[parentid=' + $(this).val() + ']').removeClass('hidden');
      if (next < 4) {
        getSelectedChildren(next, $(this).val());
        $('#select_' + next + ' option').eq(0).removeClass('hidden');
      }
    });

  } else {

    $('#select_' + next + ' option').addClass('hidden');
    $('#select_' + next + ' option[parentid=' + selectedid + ']').removeClass('hidden');

    $('#select_' + next + ' option[value=-1]').removeClass('hidden');
    $('#select_' + next + ' option').removeAttr('selected');
  }


  var level3id = 0;
  var level2id = 0;
  if (level == 2) {

    $('#select_4 option').addClass('hidden');
    $('#select_3 option:not(.hidden)').each(function() {
      if ($(this).val() != -1) {
        level3id = $(this).val();
        $('#select_4 option[parentid=' + level3id + ']').removeClass('hidden');
      }
    });
    $('#select_4 option').eq(0).removeClass('hidden');
    $('#select_3 option').eq(0).removeClass('hidden');
  }
  if (level == 1) {
    $('#select_3 option').addClass('hidden');

    $('#select_2 option:not(.hidden)').each(function() {
      if ($(this).val() != -1) {
        var level2id = $(this).val();
        $('#select_3 option[parentid=' + level2id + ']').removeClass('hidden');
      }
    });
    $('#select_4 option').addClass('hidden');
    $('#select_3 option:not(.hidden)').each(function() {
      if ($(this).val() != -1) {
        level3id = $(this).val();
        $('#select_4 option[parentid=' + level3id + ']').removeClass('hidden');
      }
    });

    $('#select_4 option').eq(0).removeClass('hidden');
    $('#select_3 option').eq(0).removeClass('hidden');
    $('#select_2 option').eq(0).attr('selected', 'selected');
  }


  if ($('#select_' + level + ' option').not('.hidden').length == 1) {
    $('#select_' + level + ' option').eq(0).addClass('hidden');
  }


};




$(document).on('ready', function() {

  drawTree(4);

  $('input').change(function() {
    if ($(this).is(":checked")) {
      $(this).prevAll().prop('checked', 'checked');
      $(this).nextAll().removeAttr('checked');
    } else {
      $(this).nextAll().removeAttr('checked');
    }
    $('#firstlevel').prop('checked', 'checked');
    $('#secondlevel').prop('checked', 'checked');

    $parent = $('#tree').parent();
    $('#tree').remove();
    $('<div id="tree"></div>').appendTo($parent);
    drawTree($('input[type=checkbox]:checked').length + 2);
  });

  $('#filter').on('keyup', function() {
    $("#tree").jstree(true).search($("#filter").val());
    $('li[aria-level=4]').each(function() {
      if (!$(this).find('.jstree-search').length > 0) {
        $(this).addClass('hidden');
      }
    });
    $('li[aria-level=3]').each(function() {
      if (!$(this).find('.jstree-search').length > 0) {
        $(this).addClass('hidden');
      }
    });
    $('li[aria-level=2]').each(function() {
      if (!$(this).find('.jstree-search').length > 0) {
        $(this).addClass('hidden');
      }
    });
  });

  var families = {};
  $.getJSON('js/families.json', {
    param1: 'value1'
  }).done(function(json, textStatus) {
    families = json;

    var options = '',
      i = 1;

    for (i; i <= 4; i++) {
      options = '';
      families["Families_" + i].map(function(val, ind) {
        options += '<option title="' + val.Text + '" value="' + val.Identifier + '" parentId="' + val["ParentId_" + (i - 1)] + '">' + val.Text + '</option>';
      });

      $('#select_' + i).append(options);
    }
  });

  $(document).on('change', '.listBox', function() {
    var select = $(this).attr('id').split('_')[1];
    var i = select;
    var selectedID = $(this).val();
    getSelectedChildren(i, selectedID);
  });
});
