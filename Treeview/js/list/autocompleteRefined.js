/*
* Autocomplete para etiquetas y busqueda refinada del catalogo
*/
var autocompleteRefined = (function(){

    //AÃ±ade el campo del autocomplete debajo de los filtros
    var createAutoCompleteInput = function(parentDiv){
        var inputAutoComp = $('<div id="autoCompContainer"><input type="text" id="refinementAutocomplete" placeholder="Introduzca caracterÃ­sticas para refinar los resultados"/></div>').hide();
        parentDiv.append(inputAutoComp);
    };
    /**********************************************************************
    * Array con los datos originales del autocomplete
    **********************************************************************/
    var originalAutocompleteSource = [];
    /**********************************************************************
    * Actualiza/crea el origen de datos del autocomplete
    * Cada elemento del autocomplete necesita al menos un label y un value
    *   @originalObject: array original
    *   @isMultiple: boolean
    *   @featureFamilyId: id de la familia seleccionada
    *   @featureId: id de la feature
    *   @featureName: nombre de la caracterÃ­stica
    *   @featureValues: array con los posibles valores de una caracterÃ­stica
    **********************************************************************/
    var createAutompleteDataSource = function (originalObject, isMultiple, featureFamilyId, featureId, featureName, featureValues) {

        $.each(featureValues, function addItem (i, featureValue){
            var autocompleteItem = {};

            autocompleteItem.familyId = featureFamilyId;
            autocompleteItem.featureId = featureId;
            autocompleteItem.IsMultipleChoice =  isMultiple;
            autocompleteItem.label = featureName + ': ' + featureValue;
            autocompleteItem.value = featureValue;

            originalObject.push(autocompleteItem);
        });

        return originalObject;

    };
    /*****************************************************************************
    * Transforma la estructura de datos que envia el dialogo a la del autocomplete
    *****************************************************************************/
    var createAutoCompleteDataStructure = function (obj){
        var tags = [];
        $.each(obj.features, function(f, feature){
            $.each(feature.features, function(v, value){
                var tag = {};
                    tag.family = obj.family;
                    tag.featureId = feature.featureId;
                    tag.isMultiple = feature.isMultiple;
                    tag.value = value;
                    tags.push(tag);
            });
        });
        return tags;
    };
    /************************************************************************
    * Inicializa el autocomplete
    * Crea una etiqueta por cada elemento seleccionado
    ************************************************************************/
    //helpers para el autocomplete
    var _split = function ( val ) {
      return val.split( /,\s*/ );
    };
    var _extractLast = function ( term ) {
      return _split( term ).pop();
    };
    var initAutocompleteComponent = function(container, src){
        container.autocomplete('destroy');
        var tags = container.autocomplete({
            minLength: 0,
            source: src,/*function(req, res){
                res( $.ui.autocomplete.filter(src, _extractLast( req.term ) ) );
            },*/
            focus: function(){
                return false;
            },
            select: function( event, ui ) {
                //TODO
                var terms = _split( ui.item.value );

                $('#tagcontainer').filterTags().addTag(ui.item.label, ui.item.featureId + ui.item.value, ui.item);

                deleteFromAutocompleteSource(ui.item);

                // remove the current input
                terms.pop();

                return false;
            }
        });

        return tags;
    };
    /***************************************************************************
    * Borra elementos del autocomplete cuando se selecciona o crea una etiqueta
    ***************************************************************************/
    var deleteFromAutocompleteSource = function (tag){
        var updatedsrc;
        //La primera vez que se pide el "source" del autocomplete devuelve una funcion
        if (typeof $('#refinementAutocomplete').autocomplete('option','source') === 'function'){
            updatedsrc = autocompleteRefined.originalAutocompleteSource.slice();
        } else {
            updatedsrc = $('#refinementAutocomplete').autocomplete('option','source');
        }
        var itemToDeletePosition = updatedsrc.indexOf(tag);
        var itemsToDelete = $.grep(updatedsrc, function(e){ return e.featureId == tag.featureId; });

        if (tag.IsMultipleChoice){
            updatedsrc.splice(itemToDeletePosition, 1);
        } else {
            updatedsrc.splice(updatedsrc.indexOf(itemsToDelete[0]), itemsToDelete.length);
        }

        //Cuando termine, se le pasa al autocomplete el nuevo array de valores
        $('#refinementAutocomplete').autocomplete('option', 'source', updatedsrc);

    };
    /***************************************************************************
    * Cuando se elimina una etiqueta, se vuelve a poner la opcion/opciones
    * en el autocomplete
    ***************************************************************************/
    var addToAutocompleteSource = function(option){

        var actualAutocompleteSource = $('#refinementAutocomplete').autocomplete('option', 'source');

        if (option.IsMultipleChoice){
            actualAutocompleteSource.push(option);
        } else {
            var familyId = $('#searchFilterGeneric').children("option:selected").val();
            var originalsrc = autocompleteRefined.originalAutocompleteSource.slice();
            var itemToAdd = $.grep(originalsrc, function(e){ return e.featureId == option.featureId && e.familyId == option.familyId; });
            actualAutocompleteSource = actualAutocompleteSource.concat(itemToAdd);
        }

        //Cuando termine, se le pasa al autocomplete el nuevo array de valores
        $('#refinementAutocomplete').autocomplete('option', 'source', actualAutocompleteSource);
    };
    /****************************************************************************
    * Recompone el array del autocomplete en funcion de la familia seleccionada
    ****************************************************************************/
    var showHideAutocompleteOptionsByFamily = function(){
        var familyComboValue = $('#searchFilterGeneric').children("option:selected").val();
        var originalAutocompleteSourceCopy = autocompleteRefined.originalAutocompleteSource.slice();

        var byFamilySrc = $.grep( originalAutocompleteSourceCopy, function(e){ return e.familyId == familyComboValue; });
        return byFamilySrc;
    };
    //Devuelve un objeto con los metodos y propiedades accesibles desde cualquier .js
	return {
		createAutoCompleteInput: createAutoCompleteInput,
        originalAutocompleteSource: originalAutocompleteSource,
        createAutoCompleteDataStructure: createAutoCompleteDataStructure,
        createAutompleteDataSource: createAutompleteDataSource,
        initAutocompleteComponent: initAutocompleteComponent,
        deleteFromAutocompleteSource: deleteFromAutocompleteSource,
        addToAutocompleteSource: addToAutocompleteSource,
        showHideAutocompleteOptionsByFamily: showHideAutocompleteOptionsByFamily
	};
})();
