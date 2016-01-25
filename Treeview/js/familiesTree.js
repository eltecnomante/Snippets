(function() {
  var origin = [];
  var transform = [];
  var tree = [];
  var executeStep4 = function() {
  var final =  [];
    var  i = 0,
      j = 0,
      k = 0,
      l = 0;
    $.getJSON('js/families.json', {
      param1: 'value1'
    }, function(json, textStatus) {
      origin = json;

      for (i; i < origin.Families_1.length; i++) {
        transform.push({
          'Identifier': origin.Families_1[i].Identifier,
          'Text': origin.Families_1[i].Text,
          'children': []
        });
      }

      //Second level
      i = 0;
      j = 0;
      for (i; i < origin.Families_2.length; i++) {

        var text = origin.Families_2[i].ParentId_1;

        var family1;
        var next = 1;
        j = 0;
        while (next && j < transform.length) {

          if (transform[j].Identifier == text) {
            transform[j].children.push({
              'Identifier': origin.Families_2[i].Identifier,
              'Text': origin.Families_2[i].Text,
              'children': []
            });
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
      for (i; i < origin.Families_3.length; i++) {

        var text = origin.Families_3[i].ParentId_1;

        var family1 = origin.Families_3[i].ParentId_1;
        var family2 = origin.Families_3[i].ParentId_2;
        j = 0;
        k = 0;
        nextGrandParent = 1;
        next = 1;
        while (nextGrandParent && j < transform.length) {

          if (transform[j].Identifier == family1) {
            nextGrandParent = 0;
            while (next && k < transform[j].children.length) {

              if (transform[j].children[k].Identifier == family2) {
                transform[j].children[k].children.push({
                  'Identifier': origin.Families_3[i].Identifier,
                  'Text': origin.Families_3[i].Text,
                  'children': []
                });
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
      for (i; i < origin.Families_4.length; i++) {

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

          if (transform[j].Identifier == family1) {
            nextG3Parent = 0;
            nextGrandParent = 1;
            while (nextGrandParent && k < transform[j].children.length) {

              if (transform[j].children[k].Identifier == family2) {
                nextGrandParent = 0;
                next = 1;
                while (next && l < transform[j].children[k].children.length) {

                  if (transform[j].children[k].children[l].Identifier == family3) {
                    transform[j].children[k].children[l].children.push({
                      'Identifier': origin.Families_4[i].Identifier,
                      'Text': origin.Families_4[i].Text
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

      final.push({'text':'Root Node','id':1, children:transform});
      tree= final;
    });

  };


  var start = new Date().getTime();

  executeStep4();


  console.log(new Date().getTime() - start);

})();
