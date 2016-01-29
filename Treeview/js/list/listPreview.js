(function() {
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

  $(document).on('change', '.listBox', function() {
    var select = $(this).attr('id').split('_')[1];
    var i = select;
    console.log('clicked ' + i);

    var selectedID = $(this).val();


    getSelectedChildren(i, selectedID);


  });



})();
