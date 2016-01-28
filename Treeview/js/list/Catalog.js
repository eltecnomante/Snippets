$(function () {
    var jsonArticleSchemeList;
    var seeAllSchemes = false;
    var schemaURL;
    var currentSchemeId;
    var currentSchemeType;
    var lastPieceClicked;
    var articlesResultList;

    cleanSearchHash(); //setSearchHash('c45de359f2f5495481b5e03095293f1b');

    var $loading =null,
    isFirstLoad = true; // Controla si es la primera carga de la pagina para decidir las transiciones

    if (!$.showI2IButton()) {
        $('#btnShowDiscounts').hide();
    } else {
        $('#btnShowDiscounts').addClass('showDiscountsLeft');
        $('#btnShowDiscounts').attr('disabled', 'disabled');
        if ($.showDiscounts()) {
            $('#btnShowDiscounts input').attr('checked', 'checked');
        }
        else {
            $('#btnShowDiscounts input').removeAttr('checked');
        }
    }

    $('#btnShowDiscounts').on('click', function (e) {
        if ($('#btnShowDiscounts').attr('disabled') == undefined) {
            if ($.showDiscounts()) {
                UpdateI2IUserConfig(false);
            }
            else {
                UpdateI2IUserConfig(true);
            }
        }
    });

    function UpdateI2IUserConfig(mustShowI2I) {
        $.myAJAX.getJSON($.getServicios("UpdateI2IUserConfig"), { showI2I: '' + mustShowI2I })
            .success(function (stock) {
                window.ShowDiscounts = mustShowI2I;
                if (articlesResultList != undefined)
                    getStockInformation(articlesResultList);
                if (mustShowI2I) {
                    $('#btnShowDiscounts input').attr('checked', 'checked');
                } else {
                    $('#btnShowDiscounts input').removeAttr('checked');
                }
            })
           .error(function () {
               $.setInfoDialog($.getResource('No se ha podido realizar la operación'), $.getResource('Error inesperado'));
           });
    }

    $('#refinatedSearchContainer').hide();
    $('#btnShowRefined input').removeAttr('checked');

    window.navData = $.getParamsFromHash();

    $('div.carData').on('click', 'span', {flag:'breadcrumb'}, backFromBreadCrumb);
    $('div.carData').siblings('input.breadCrumbBackButton').on('click', backFromBreadCrumb);

    /* Asociacion de modelos y motores a sus cajas contenedoras, para que hagan juntas las transiciones */
    $('div.modelos').linkTransitionWith('div.modelosBox');
    $('div.motores').linkTransitionWith('div.motoresBox');

    //Carga histórico de vehiculos y referencias
    $.updateVehicleTypeSearchList();
    $.updateReferenceSearchesList();
    $('#histvehicle ul, #histref ul').on('click', 'li', selectFromHistory);

    $('#histvehicle span.btn').on('click', function() {
        $.myAJAX.getJSON($.getServicios("CleanSearchesHistoricalByUser"), { deleteVehicles: true })
        .success(function (data) {
            if (data === true) {
                $('#histvehicle ul').empty().append('<li><strong>' + $.getResource('utilities_commons_no_vehicles') + '</strong></li>');
            } else {
                $.setInfoDialog($.getResource('multilanguage_commons_unexpected_error'), '');
            }
        })
        .error(function () {
            $.setInfoDialog($.getResource('multilanguage_commons_unexpected_error'), '');
        });
    });

    $('#histref span.btn').on('click', function() {
     $.myAJAX.getJSON($.getServicios("CleanSearchesHistoricalByUser"), { deleteReferences: true })
        .success(function (data) {
            if (data === true) {
              $('#histref ul').empty().append('<li><strong>' + $.getResource('utilities_commons_no_references') + '</strong></li>');
            } else {
                $.setInfoDialog($.getResource('multilanguage_commons_unexpected_error'), '');
            }
        })
        .error(function () {
            $.setInfoDialog($.getResource('multilanguage_commons_unexpected_error'), '');
        });
    });

    //Manejar el click del botón de ver sin filtros
    $('#btnSeeAll').on('click', function (e) {
        $.setParamsFromHash('ShowAll', 'true');
        //reinicial búsqueda refinada
        $.unsetParamsFromHash('refhash');
        $.unsetParamsFromHash('reffam');
        $.unsetParamsFromHash('refsup');
        $.unsetParamsFromHash('reffeat');
        window.navData.theSearch = false;
        window.navData.ShowAll = true;
        $('#btnSeeAll').attr('disabled', true).addClass('btnDisabled');
        $('#btnShowRefined').children("img.loadrefinedimage").show();
        $('#btnShowRefined input').hide();

        $('#btnShowRefined').attr('disabled', 'disabled');
        $('#btnShowDiscounts').attr('disabled', 'disabled');

        var navigationData = window.navData;
        navigationData.page = 0;
        if (navigationData.referenceNum) {
            //TODO: ver de dónde extraer los elementos
            getArticlesForReference(navigationData.productZone, navigationData.referenceNum, navigationData.referenceTypeId, navigationData.page, 10, navigationData.searchLike, navigationData.supplierId, navigationData.genericId); //false
            loadSearchFilters(navigationData, 10, true);
        }
        else {
            searchArticles(navigationData.productZone, navigationData.vehicleTypeId, navigationData.familyId, navigationData.page, 10, navigationData.supplierId, navigationData.genericId, navigationData.quickLink); //false
            loadSearchFilters(navigationData, 10);
        }
    });

    // Botones del comparador
    $('#resultados').on('click', 'a.compareBtn', function () {
        var recambio = $(this).parents('.recambio');

        if (window.navData.compare && window.navData.compare == $(this).attr('data-identifier')) {
            $('body').scrollTop(0);
            $('#compareBox').children('ul').children('li').first().stop(1, 1).effect('pulsate', { times: 2 });
            return false;
        }

        if (window.navData.compare) {
            var link = recambio.find('ul.opt').children('li.btn').children('a').attr('href').split('?')[1];
            window.location.href = '/Catalog/Compare?' + link + '&compareWith=' + window.navData.compare + '&compareWithGeneric=' + window.navData.compareGeneric;
        } else {
            window.navData.compare = $(this).attr('data-identifier');
            window.navData.compareGeneric = $(this).attr('data-genericId');
            $('#compareBox').slideDown(ANIM_SPEED);
            var title = recambio.find('h1').text(),
            reference = recambio.find('a.tdId').text(),
            supplier = recambio.find('p.articleData strong').text();

            $('#compareBox').children('ul').empty().append('<li>' + title + ' - ' + reference + ' ' + supplier + ' <a href="#" class="deleteFromList" title="' + $.getResource('catalog_commons_remove_from_compare') + '">X</a></li>');
            $('body').scrollTop(0);
        }
        return false;
    });

    // Borrar de lista de comparador
    $('#compareBox').on('click', 'ul li a.deleteFromList', function () {
        var li = $(this).parent();
        $('#compareBox').slideUp(ANIM_SPEED, function () {
            li.remove();
        });

        window.navData.compare = false;
        window.navData.compareGeneric = false;
        return false;
    });

    ResolveURL();

    // Resuelve URL
    function ResolveURL() {
        var data = $.getParamsFromHash();
        if (!data.productZone) {
            data.productZone = 1;
        }
        var goResults = data.goResults;
        // Completa datos restantes si es necesario
        if (data) {
            data = getFillBreadCrum(JSON.stringify(data));
        }

        // Actualiza la miga si es necesarioupdatemode
        updateBreadCrumb(data);

        // Solo dos puntos de entrada posibles: HOME Y RESULTADOS
        var refhash = $.getParamsFromHash().refhash;
        if (!goResults) {
            $.unsetParamsFromHash('refhash');
            $.unsetParamsFromHash('reffam');
            $.unsetParamsFromHash('refsup');
            $.unsetParamsFromHash('reffeat');
            loadHome();
        } else {
            if ((data.referenceNum && data.referenceTypeId)
            || (data.productZone && data.manufacturerId && data.vehicleModelId && data.vehicleTypeId && data.familyId)
            || (data.productZone && data.familyId)
            || (refhash)) {
                loadResults();
            } else {
                loadHome();
            }
        }
    }

    // Actualiza la miga
    function updateBreadCrumb(params) {
        var data = window.navData;
        if (params) {
            $.extend(window.navData, params);
        } else {
            window.navData = { productZone: window.navData.productZone };
        }
        $('div.carData span').empty();

        data.manufacturerId && $('span.cd1').attr('data-manu-id', data.manufacturerId).text(data.manufacturerName);
        data.vehicleModelId && $('span.cd2').attr({ 'data-model-id': data.vehicleModelId, 'data-enginenumber': false }).text(data.vehicleModelName);

        if(data.vehicleTypeId)
        {
            var vehicleTypeDesc = data.vehicleTypeName;
            var salesInfo = $('div.tipos tr[data-tipo-id="'+data.vehicleTypeId+'"]').data('salesinfo');

            if(salesInfo && salesInfo.length > 0)
            {
                vehicleTypeDesc += ' '+salesInfo+' '+$.getResource('catalog_commons_unitie_short');
            }

            $('span.cd3').attr('data-tipo-id', data.vehicleTypeId).text(vehicleTypeDesc);
        }

        data.referenceNum && $('span.rs1').attr('data-reference-text', data.referenceNum).text(data.referenceNum);
        (data.referenceTypeId && data.referenceTypeId != -1) && $('span.rs2').attr('data-reference-type-id', data.referenceTypeId).html('<abbr title="' + data.referenceTypeName + '">?</abbr>');
        data.engineNumber && $('span.cd2').attr({ 'data-enginenumber': data.engineNumber, 'data-model-id': false }).text(data.engineName);

        if (data.familyId) {
            var _familySpan;
            if (data.fm == 2) {
                $('span.fm1').empty();
                _familySpan = 'span.fm2';
            } else {
                $('span.fm2').empty();
                _familySpan = 'span.fm1';
            }
            $(_familySpan).attr('data-familyid', data.familyId).text(data.familyName);
        }
    }

    // Lee de los datos de navegacion
    function getNavData(param) {
        return (param) ? window.navData[param] : window.navData;
    }

    // Define datos de navegacion
    function setNavData(param, value) {
        window.navData[param] = value;
    }

    // Completa los datos de la URL
    function getFillBreadCrum(n) {
        var result;
        $.getJSONsync($.getServicios("FillBreadCrum"), { datos: n })
            .success(function (json) {
                if (json) {
                    result = json;
                } else {
                    return n;
                }
            });
        return result;
    }

    /***********************************************
    * Carga Home
    **********************************************/
    function loadHome(isBreadcrumb) {
        window.navData.page = 0;
        window.navData.ShowAll = false;
        $.unsetParamsFromHash('ShowAll');
        $.unsetParamsFromHash('supplierId');
        $.unsetParamsFromHash('genericId');
        $.unsetParamsFromHash('goResults');
        var data = window.navData,
            isExactSearch = !$(this).find('span.toggleExactSearch').hasClass('disabled');
        // Limpia busquedas sobre cajas de familias
        clearFamilySearchFilters();
        // Limpia los filtros de genericos/proveedores
        clearFamilyGenericFilters();
        $('.searchFilters').children('#tagcontainer').remove();
        // Oculta los contenedores dinamicos
        $('div.resultsWrapper').hide();
        $('div.modelos, div.tipos, div.motores, div.motormodel, div.categorias, div.families').hide();
        $('div.homeWrapper').show();
        // Muestra los quickLinks de universal (añadido 14-8-13)
        if(data.productZone === 7){
            $('#universalQuickLinks').show();
        }
        $('#resultados').children('div.pagination').empty();

        // Oculta el boton atras
        $('div.carInfo').children('input.breadCrumbBackButton').addClass('disabled');

        // Vaciar cajas por si se vino por Volver Atras
        $('#engineCode, #referencePc').val('');

        data.theSearch = false;

        if (isFirstLoad) {
            isFirstLoad = false;

            $(window).on('mouseup', function () {
                $('#flashMessage').slideUp(ANIM_SPEED, function () {
                    $(this).empty().addClass('disabled');
                });
            });

            // Configura las tabs
            $('div.searchTabs').tabs({ disabled: [4], selected: -1 });
            $('div.historyTabs').tabs({ selected: 0 });

            // Desactiva el submit de familias
            $('#selFam input:submit').attr("disabled", "disabled");
            $('#selAcc input:submit').attr("disabled", "disabled");

            // Muestra el contenido una vez oculto el HTML inicial
            $('#content').css('display', 'block');

            // Carga las marcas en función de la tab seleccionada
            $('div.searchTabs').bind("tabsselect", function (event, ui) {
                if ($('ul.marcas').children().length) {
                    $.unsetParamsFromHash();
                    updateBreadCrumb({ productZone: ui.index + 1, manufacturerId: null, vehicleModelId: null, vehicleTypeId: null, referenceNum: null, referenceTypeId: null, familyId: null });
                    $('div.modelos, div.tipos, div.motores, div.motormodel, div.categorias, div.families').hide();

                    $(this).parents('section.searchBox').hasClass('collapsed') && $(this).parents('section.searchBox').children('span.toggleButton').trigger('mousedown');
                }

                $('p.allManufact').hide();

                if (ui.index <= 4) {
                    getMarcas(ui.index + 1);
                } else if (ui.index == 6) /* Universal */{
                    $('#selAcc').hide();
                    $('#search_7').startLoading();
                    populateUniversalFamilies();
                    // Consultar universal quick links (añadido 14-8-13)
                    populateUniversalQuickLinks();
                    $('div.carInfo').children('input.breadCrumbBackButton').addClass('disabled');
                }

                $('span.pz').attr('data-pz', ui.index + 1);
                SetURLFor('productZone', ui.index + 1);
            });


            // Interruptores para expandir/colapsar cajas
            $('.searchTabs ul.ui-tabs-nav, .modelosBox h2, span.toggleButton').on('mousedown', function (e) {
                if (e.target.tagName == 'A') {
                    return false;
                }
                var wrapper = $(this);
                if (wrapper.parents('section.searchBox').length) {
                    wrapper = $('section.searchBox').children().first();
                }
                wrapper.parent().toggleClass('collapsed');

                if (wrapper.parent().hasClass('collapsed')) {
                    if (wrapper.attr('class') == 'toggleButton') {
                        wrapper.attr('title', $.getResource('catalog_commons_open')).html('&or;');
                    }
                } else {
                    if (wrapper.attr('class') == 'toggleButton') {
                        wrapper.attr('title', $.getResource('catalog_commons_close')).html('&and;');
                    }
                }

                return false;
            });

            // Interruptor para expandir/colapsar caja de búsqueda al hacer click sobre la pestaña
            $('.searchBox li.ui-state-default').on('mousedown', function (event, ui) {
                if ($(this).hasClass('ui-state-active')) {
                    var button = $('.searchBox span.toggleButton');
                    button.parent().toggleClass('collapsed');
                    if (button.parent().hasClass('collapsed')) {
                        button.attr('title', $.getResource('catalog_commons_open')).html('&or;');
                    } else {
                        button.attr('title', $.getResource('catalog_commons_close')).html('&and;');
                    }

                    return false;
                }
            });

            // Configuracion de la ventana de marcas
            var manufacturersList = $('.manufacturers').dialog({
                autoOpen: false,
                modal: true,
                width: '700',
                height: '500',
                title: $.getResource('catalog_commons_vehicles_manufacturers'),
                draggable: false,
                resizable: false,
                closeOnEscape: true,
                open: function () {
                    getManufacturersList($('div.searchTabs').tabs("option", "selected") + 1)
                }
            });

            if ($('#schemaViewer').length) {
                // Configuracion del visor de esquemas
                var schemaViewer = $('#schemaViewer').dialog({
                    autoOpen: false,
                    modal: true,
                    width: '97%',
                    height: $(window).height() * 0.95,
                    title: 'Esquemas',
                    draggable: false,
                    resizable: false,
                    closeOnEscape: true
                });

                $(window).resize(function () {
                    $("#schemaViewer").dialog("option", "height", $(window).height() * 0.95);
                    $("#schemaViewer").dialog("option", "position", "center");
                });
            }

            // Carga combo de fabricantes de motor
            // TODO: comprobar que es el mismo que el de manufacturers
            var emptyAndDefaultItemValue = $.getResource('catalog_commons_all');
            $('#supplierPc').loadSelectByAction($.getServicios("ManufacturersList"), { productZone: PassengerCar, isEngineManufacturer: true }, emptyAndDefaultItemValue);
            $('#fabricanteVi').loadSelectByAction($.getServicios("ManufacturersList"), { productZone: CommercialVehicles, isEngineManufacturer: true }, emptyAndDefaultItemValue);

            // Carga el combo de referencias
            $('#reftypeVi').loadSelectByAction($.getServicios("ReferenceSearchTypes"), { productZone: ($('div.searchTabs').tabs("option", "selected") + 1) }, emptyAndDefaultItemValue);
            $('#refTypePc').loadSelectByAction($.getServicios("ReferenceSearchTypes"), { productZone: ($('div.searchTabs').tabs("option", "selected") + 1) }, emptyAndDefaultItemValue);
            $('#reftypeAx').loadSelectByAction($.getServicios("ReferenceSearchTypes"), { productZone: ($('div.searchTabs').tabs("option", "selected") + 1) }, emptyAndDefaultItemValue);



            /*********************************************
            * Bindings de la pagina principal
            *********************************************/
            $('p.allManufact').hide().on('click', 'a', function (e) {
                manufacturersList.dialog('open');
                e.preventDefault();
            });

            $('#search_1, #search_2,#search_4,.manufacturers').on('click', '.marcas a', updateModels);
            //$('#search_4').on('click', '.marcas a', updateSeries);

            $('div.modelos').on('click', 'tbody td:not(.dataTables_empty)', updateTipos);
            $('div.tipos').on('click', 'tbody td:not(.dataTables_empty)', updateQuicklinks);
            $('p.esquemas').on('click', 'a.steeringButton', { name: 'schemeSteeringList', title: $.getResource('catalog_schemaviewer_steering_title') }, launchSchemaViewer);
            $('p.esquemas').on('click', 'a.exhaustButton', { name: 'schemeExhaustList', title: $.getResource('catalog_schemaviewer_exhaust_title') }, launchSchemaViewer);
            $('p.esquemas').on('click', 'a.EMSButton', { name: 'schemeEmsList', title: $.getResource('catalog_schemaviewer_ems_title') }, launchSchemaViewer);
            $('div.categorias').on('click', 'li', searchFromQuickLinks);
            $('form.engine').on('submit', updateEngineList);
            $('div.motores').on('click', 'tbody td:not(.dataTables_empty)', updateMotorModel);

            // Selección de modelo para codigo de motor
            // TODO (actual sobre un mock)
            $('div.motormodel').on('click', 'tbody td:not(.dataTables_empty)', updateQuicklinks);

            $('div.categorias').on('click', '.allcat', function () { window.navData.familyId = false; window.navData.iconFamily = -1; updateFamilies(); });
            $('div.families').on('click', '.quicklinks', showQuickLinks);

            // Workaround (bug webkit: no mantiene scrolls al ocultar)
            if ($.browser.webkit) {
                $('#selFam, #selAcc').on('submit', function () {
                    $(this).find('select').each(function () {
                        $(this).data('myScroll', $(this).scrollTop());
                    });
                });
            }

            $('#selFam').on('submit', searchFromFamilies);
            $('#selFam, #selAcc').on('dblclick', 'select', function () {
                if ($(this).val() != '-1' && $(this).val() != null) {
                    $(this).trigger('submit');
                }
            });
            $('#selAcc').on('submit', searchFromAccFamilies);
            $('.reference').on('submit', searchReferenceNumber);
            // Limpiar filtros
            $('#engineCodePc').on('click', function () { $('#referencePc').val(''); $('#refTypePc').val('-1'); });
            $('#supplierPc').on('click', function () { $('#referencePc').val(''); $('#refTypePc').val('-1'); });
            $('#referencePc').on('click', function () { $('#engineCodePc').val(''); $('#supplierPc').val('-1'); });
            $('#refTypePc').on('click', function () { $('#engineCodePc').val(''); $('#supplierPc').val('-1'); });

            $('#engineCodeVi').on('click', function () { $('#referenceVi').val(''); $('#reftypeVi').val('-1'); });
            $('#fabricanteVi').on('click', function () { $('#referenceVi').val(''); $('#reftypeVi').val('-1'); });
            $('#referenceVi').on('click', function () { $('#engineCodeVi').val(''); $('#fabricanteVi').val('-1'); });
            $('#reftypeVi').on('click', function () { $('#engineCodeVi').val(''); $('#fabricanteVi').val('-1'); });

            /* End Bindings **********************************************/

            if ($('#schemaViewer').length) {
                // Bindings del visor de esquemas
                $('#schemaViewer').children('ul.schemeList').on('click', 'li a', loadScheme);
                $('#schemaViewer').children('iframe').on('load', initScheme);
                $('#schemaViewer').children('ul.schemeReferenceList').on('click', 'li', function () {
                    $(this).hasClass('selected') || $(this).addClass('selected').siblings().removeClass('selected');
                });
                /* End Bindings del visor de esquemas ************************/
            }

            // Selecciona la tab correspondiente a la productZone
            $('div.searchTabs').tabs("option", { selected: data.productZone - 1 });

            if (data.fm == 2) {
                updateFamilies();
            }

            // Activa los filtros de familias
            var clearFilterBtn = $('<span>X</span>');

            clearFilterBtn.on('click', function () {
                $(this).hide();
                $('div.familyBoxes').children('div.familySearchFilter').find('strong').hide();
                $(this).siblings('input').val('').trigger('keyup');
            });

            var divFamilySearch;

            divFamilySearch = $('div.familyBoxes').children('div.familySearchFilter');
            divFamilySearch.children('div').append(clearFilterBtn.clone(true).hide());
            divFamilySearch.append($('<button type="button" class="searchFilterBtn btnPrev">' + $.getResource('catalog_commons_previous') + '</button><button type="button" class="searchFilterBtn btnNext">' + $.getResource('catalog_commons_next') + '</button>'));
            divFamilySearch.append($('<strong style="display: none; margin-left: 20px;">' + $.getResource('catalog_commons_no_matches') + '</strong>'));

            //Muestra/oculta el boton de limpiar la caja de busqueda
            $('div.familyBoxes').children('div.familySearchFilter').on('keyup', 'div input', function () {
                var button = $(this).siblings('span');

                if ($.trim($(this).val()).length) {
                    button.show();
                } else {
                    button.hide();
                }
            });
            //Si la tecla que se pulsa es Enter, dispara el click en el boton siguiente
            $('div.familyBoxes').children('div.familySearchFilter').on('keydown', 'div input', function (e) {
                if (e.which == 13) {
                    $(this).parent().nextAll('button.btnNext').first().trigger('click');
                    e.preventDefault();
                }
            });
            //Add clase focused a la caja de busqueda
            $('div.familyBoxes').children('div.familySearchFilter').find('input').on('focus', function () {
                $(this).parent().addClass('focused');
            });
            $('div.familyBoxes').children('div.familySearchFilter').find('input').on('blur', function () {
                $(this).parent().removeClass('focused');
            });
            //Add data values al formulario de filtro (Universal y Todos los grupos)
            $('div.familyBoxes').children('div.familySearchFilter').find('input').data({
                currentSearch: '',
                matches: [],
                currentMatch: -1,
                iconFamily: -1
            });
            //Controla el click de los botones anterior-siguiente
            $('div.familyBoxes').children('div.familySearchFilter').on('click', 'button', function () {
                var input = $(this).prevAll('div').children('input'),
                term = $.trim(input.val()),
                currentSearch = input.data('currentSearch'),
                matches = input.data('matches'),
                currentMatch = input.data('currentMatch'),
                iconFamily = input.data('iconFamily');
                var strongElm = $('div.familyBoxes').children('div.familySearchFilter').find('strong');

                strongElm.hide();

                if (!term) {
                    input.data({
                        currentSearch: '',
                        matches: [],
                        currentMatch: -1
                    });
                    strongElm.show();
                    input.val('').focus();
                    return false;
                }
                //Si se selecciona un shortcut icon
                if ((term != currentSearch) || (window.navData.iconFamily && window.navData.iconFamily != iconFamily)) {
                    matches = [];
                    currentMatch = -1;
                    $(this).parents('div.familyBoxes').children('fieldset').children('select').children().each(function () {
                        if (term && $.transliterate($(this).text()).indexOf($.transliterate(term)) != -1 && $(this).attr('value') != '-1') {
                            matches.push($(this));
                        }
                    });
                    input.data({
                        matches: matches,
                        currentSearch: term,
                        currentMatch: currentMatch,
                        iconFamily: window.navData.iconFamily
                    });
                }

                if (matches.length == 0) {
                    strongElm.show();
                    input.focus();
                    return false;
                }

                if ($(this).hasClass('btnNext')) {
                    if (currentMatch >= matches.length - 1) {
                        currentMatch = -1;
                    }
                    currentMatch++;
                } else {
                    if (currentMatch == -1 || currentMatch == 0) {
                        currentMatch = matches.length;
                    }
                    currentMatch--;
                }

                matches[currentMatch].parents('fieldset').nextAll('fieldset').children('select').each(function () {
                    $(this).focus().get(0).value = -1;
                });
                matches[currentMatch].parent().focus().get(0).value = matches[currentMatch].attr('value');
                matches[currentMatch].parent().trigger('change');
                input.data('currentMatch', currentMatch).focus();
            });
        } else {
            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        }

        // Muestra la caja de busqueda
        $('section.searchBox').fadeIn(ANIM_SPEED);

        // Muestra el resto de componentes segun los datos de la URL
        if (data.manufacturerId) {
            $('div.modelos').html('<div/>').fadeIn(ANIM_SPEED);
            if (!isBreadcrumb){
                getModels(data.productZone, data.manufacturerId, 'sidebar');
            } else {
                getModels(data.productZone, data.manufacturerId, 'breadcrumb');
            }
            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        }
        if (data.vehicleModelId) {
            $('div.tipos').html('<div/>').fadeIn(ANIM_SPEED);
            getTipos(data.productZone, data.vehicleModelId);
            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        }

        if (data.engineCode) {
            $('div.motores').html('<div/>').fadeIn(ANIM_SPEED);

            if (data.productZone === 1) {
                $('#engineCodePc').val(data.engineCode);
                $('#supplierPc').data('selected', data.engineManufacturerId);
            } else {
                $('#engineCodeVi').val(data.engineCode);
                $('#fabricanteVi').data('selected', data.engineManufacturerId);
            }
            if(!isBreadcrumb){
                getEngineList(data.engineCode, data.productZone, data.engineManufacturerId, 'sidebar');
            } else {
                getEngineList(data.engineCode, data.productZone, data.engineManufacturerId, 'breadcrumb');
            }

            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        }


        if (data.referenceNum) {
            if (data.productZone === 1) {
                $('#referencePc').val(data.referenceNum);
                $('#refTypePc').data('selected', data.referenceTypeId);
                (String(data.searchLike).toLowerCase() !== 'true') && $('#referencePc').parents('form').find('.isExactSearch').attr('checked', 'checked');
            } else {
                $('#referenceVi').val(data.referenceNum);
                $('#refTypeVi').data('selected', data.referenceTypeId);
                (String(data.searchLike).toLowerCase() !== 'true') && $('#referenceVi').parents('form').find('.isExactSearch').attr('checked', 'checked');
            }
        }

        if (data.engineNumber) {
            $('div.motormodel').html('<div/>').fadeIn(ANIM_SPEED);
            getMotormodel(data.productZone, data.engineNumber);
            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        }

        if (data.vehicleTypeId) {
            //Obtiene los enlaces rápidos y colapsa la sección de búsqueda
            getQuicklinks(data.productZone, data.vehicleTypeId);
            getSchemaLinks(data.productZone, data.vehicleTypeId);
            // Dos opciones: mostrar enlaces rapidos o familias
            if (data.fm == 2) {
                $('div.modelosBox').hasClass('collapsed') || $('div.modelosBox').children('span.toggleButton').trigger('mousedown');
                $('div.motoresBox').hasClass('collapsed') || $('div.motoresBox').children('span.toggleButton').trigger('mousedown');
                $('div.families').fadeIn(ANIM_SPEED);
            } else {
                $('div.categorias').fadeIn(ANIM_SPEED);
            }
            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        }

        // Workaround (bug webkit: no mantiene scrolls al ocultar)
        if ($.browser.webkit) {
            $('#selFam, #selAcc').find('select').each(function () {
                var scroll = $(this).data('myScroll') || 0;
                $(this).scrollTop(scroll);
            });
        }
    }

    /***********************************************
    * Carga Resultados
    **********************************************/
    function loadResults(page, elements, originFlag) {
        if ($.getParamsFromHash().page) {
            page = $.getParamsFromHash().page - 1
        } else {
            page = page || 0;
        }

        if (elements == undefined) {
            elements = 10;
        }

        window.navData.page = page;
        window.navData.elements = elements;

        var data = window.navData;
        if (isFirstLoad) {
            // Oculta los contenedores dinamicos
            $('div.homeWrapper, div.resultsWrapper').hide();

            // Muestra el contenido una vez oculto el HTML inicial
            $('#content').css('display', 'block');
            $('div.resultsWrapper').show();
        }

        // Muestra el boton atras
        $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');

        // Oculta el Flash Message
        $('#flashMessage').empty().addClass('disabled');

        $('div.homeWrapper').hide();
        $('div.resultsWrapper').show();

        // Opcion ver todos por URL
        if (String($.getParamsFromHash().ShowAll) == 'true') {
            window.navData.ShowAll = true;
        }

        // Lee los filtros de busqueda si los hubiese
        data.supplierId = $.getParamsFromHash().supplierId || null;
        data.genericId = $.getParamsFromHash().genericId || null;

        $('p.noFilterResults').hide().addClass('disabled');
        // Buscar
        if ($.getParamsFromHash().refhash == undefined) {

            if (data.familyId) {
                loadSearchFilters(data, elements);
                searchArticles(data.productZone, data.vehicleTypeId, data.familyId, page, elements, data.supplierId, data.genericId, originFlag);
            } else if (data.referenceNum) {
                loadSearchFilters(data, elements, true);
                getArticlesForReference(data.productZone, data.referenceNum, data.referenceTypeId, page, elements, data.searchLike, data.supplierId, data.genericId, originFlag);
            }
            $.updateVehicleTypeSearchList();
        }
        // Lanzar directamente la búsqueda refinada
        else {
            setSearchHash($.getParamsFromHash().refhash);
            if (data.referenceNum) {
                loadSearchFilters(data, elements, true, true);
            }
            else {
                loadSearchFilters(data, elements, false, true);
            }
            //actualizar el page
            var currentPage = $.getParamsFromHash().page;
            SetURLFor('page', currentPage - 1);
            //Búsqueda refinada
            doRefinedSearch($.getParamsFromHash().page, true);
            //opciones refinadas
            getRefineSearchOptions(true);
        }
    }
    //Añade el campo del autocomplete debajo de los filtros
    function createAutoCompleteInput(parentDiv){
        var inputAutoComp = $('<div id="autoCompContainer"><input type="text" id="refinementAutocomplete" placeholder="Introduzca características para refinar los resultados"/></div>').hide();
        parentDiv.append(inputAutoComp);
    }
    //crea el contenedor de las etiquetas
    function createFilterTagsContainer(parentDiv){
        if($('#tagcontainer').length == 0){
            var tagContainer = $('<div id="tagcontainer">');
            parentDiv.append(tagContainer);
        }
    }
    /***********************************************
    * Crea los filtros para cada busqueda distinta
    ***********************************************/
    function loadSearchFilters(data, elements, referenceSearch, refinedSearchOptionsInURL) {

        if (!window.navData.theSearch) {
            window.navData.theSearch = true;
            var wrapper = $('div.searchFilters').children('div').first().empty(),
            selectSupplier = $('<select id="searchFilterSupplier" disabled="disabled"><option value="null">' + $.getResource('catalog_commons_select') + '</option></select>');
            selectGeneric = $('<select id="searchFilterGeneric" disabled="disabled"><option value="null">' + $.getResource('catalog_commons_select') + '</option></select>');
            //Incorpora el contenedor de etiquetas y el del autocomplete

            createAutoCompleteInput($('div.searchFilters'));
            createFilterTagsContainer($('div.searchFilters'));


            wrapper.append('<div><label for="searchFilterSupplier">' + $.getResource('catalog_commons_manufacturer') + ':</label> </div>');
            wrapper.children('div').first().append(selectSupplier);
            wrapper.append('<div><label for="searchFilterGeneric">' + $.getResource('catalog_commons_generics') + ':</label> </div>');
            wrapper.children('div').last().append(selectGeneric);

            wrapper.find('select').on('change', function () {
                //toggleRefinedSearchControls($('#searchFilterGeneric').val(), autocompleteRefined.originalAutocompleteSource);
                var autocompleteSource = autocompleteRefined.showHideAutocompleteOptionsByFamily();
                toggleRefinedSearchControls($('#searchFilterGeneric').val(), autocompleteSource);
                showHideRefinedOptionByFamily();
                doRefinedSearch();
            });

            $('#resultados').on('EventResultsLoaded', function () {

                getRefineSearchOptions(refinedSearchOptionsInURL);

                if (referenceSearch) {
                    var serviceGenerics = 'GenericsFilterListByReference';
                    var serviceSuppliers = 'SuppliersFilterListByReference';
                    var params = { referenceNumber: data.referenceNum, searchLike: data.searchLike, referenceType: data.referenceTypeId, applyFilters: String(!window.navData.ShowAll) }

                }
                else {
                    var serviceGenerics = 'GenericsFilterList';
                    var serviceSuppliers = 'SuppliersFilterList';
                    var params = { productZone: data.productZone, familyId: data.familyId, vehicleTypeId: data.vehicleTypeId, applyFilters: String(!window.navData.ShowAll) };
                }

                $('#resultados').off('EventResultsLoaded');
            });
        }

    }

    /***********************************************
    * Carga de manufacturers destacados en la HOME
    ***********************************************/
    function getMarcas(pz) {
        setNavData('productZone', pz);

        $('div.carInfo').children('input.breadCrumbBackButton').addClass('disabled');
        var manufacturerList = $('#search_' + pz + ' div:first').children('ul.marcas').empty().startLoading();

        $.myAJAX.getJSON($.getServicios("ManufacturersHomeList"), { productZone: pz })
        .success(function (data) {
            manufacturerList.stopLoading();
            var manufacturerHome = [];

            $.each(data, function (i, stared) {
                manufacturerHome[i] = '<li><a href="#" data-manu-id="' + stared.Identifier + '" title="' + stared.Name + '"><img src="images/logos/' + stared.Name + '.jpg" alt="' + stared.Name + '" /></a></li>';
            });

            var selectedManufacturer = $.getParamsFromHash().manufacturerId || '';

            manufacturerList.empty().append(manufacturerHome.join(''));

            manufacturerList.children('li').children('a[data-manu-id="' + selectedManufacturer + '"]').parent().addClass('selected');

            $('p.allManufact').show();
        })
        .error(function () {
            $('p.allManufact').hide();
            manufacturerList.stopLoading();
            $('#search_1 div:first, #search_2 div:first, #search_4 div:first').append('<p><strong>' + $.getResource('catalog_commons_error_info_manufacturers') + '</strong></p>');
        });
    };

    /***********************************************
    * Dialogo que carga el listado de manufacturers
    ***********************************************/
    function getManufacturersList(pz) {
        $.myAJAX.getJSON($.getServicios("ManufacturersList"), { productZone: pz })
            .success(function (json) {
                var manufacturer = [];
                $.each(json, function (i, manu) {
                    manufacturer[i] = '<li class="_25"><a href="#" data-manu-id="' + manu.Identifier + '">' + manu.Text + '</a></li>';
                });
                $('.manufacturers').html('<ul class="marcas" />').children('ul.marcas').append(manufacturer.join('')).alphabetizeMe();
            })
            .error(function () {
                $('.manufacturers').empty().append('<p><strong>' + $.getResource('catalog_commons_error_info_manufacturers') + '</strong></p>');
            });
    }

    /***********************************************
    * Carga de modelos al seleccionar una marca
    ***********************************************/
    function getModels(pz, marcaId, originFlag) {
        SetURLFor('manufacturerId', marcaId);
        $('div.modelos div').append('<table class="table tsort"><thead><tr><th>' + $.getResource('catalog_commons_model') + '</th><th class="date">' + $.getResource('catalog_commons_year') + ' <abbr title="' + $.getResource('catalog_commons_constructionLong') + '">' + $.getResource('catalog_commons_construction') + '</abbr></th><th class="hiddenCol"></th></tr></thead><tbody></tbody></table>');

        $('div.modelos').startLoading();

        $.myAJAX.getJSON($.getServicios("VehicleModelsListByManufacturer"), { productZone: pz, parentId: marcaId, flag: originFlag })
            .success(function (json) {
                $('div.modelos').stopLoading();

                var modelo = [];
                $.each(json, function (i, model) {
                    modelo[i] = '<tr data-model-id="' + model.Identifier + '"><td><span>' + model.Text + '</span></td><td>' + model.Year + '</td><td>' + (model.Interval || '') + '</td></tr>';
                });

                if (modelo.length === 0) {
                    $('div.modelos tbody').empty().append('<tr><td class="dataTables_empty" colspan="2"><strong>' + $.getResource('catalog_commons_no_models_manufacturer') + '</strong></td></tr>');
                } else {
                    $('div.modelos tbody').empty().append(modelo.join(''));
                    $('div.modelos tbody tr:even').addClass('odd');
                    initTableOrder($('div.modelos table'));

                    if ($.getParamsFromHash().vehicleModelId) {
                        var tr = $('div.modelos tbody tr[data-model-id="' + $.getParamsFromHash().vehicleModelId + '"]').last(),
                        scroll = tr.position().top - tr.parent().position().top;
                        tr.addClass('rowSelected').parents('div.dataTables_scrollBody').scrollTop(scroll);
                    } else {
                        if ($('div.modelos tbody tr.autoClick').length) {
                            $('div.modelos tbody tr.autoClick').children('td').first().trigger('click');
                        }
                    }
                    $('div.modelos tbody tr.autoClick').removeClass('autoClick');
                }
            })
            .error(function () {
                $('div.modelos tbody').empty().append('<tr><td class="dataTables_empty" colspan="2"><strong>' + $.getResource('catalog_commons_no_models_manufacturer') + '</strong></td></tr>');
            });
    }

    function updateModels(e) {
        !$('div.modelosBox').hasClass('collapsed') || $('div.modelosBox').children('span.toggleButton').trigger('mousedown');
        $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');

        $('#referencePc').val('');
        $('#refTypePc').val('-1');
        $('#engineCodePc').val('');
        $('#supplierPc').val('-1');
        $('#referenceVi').val('');
        $('#reftypeVi').val('-1');
        $('#engineCodeVi').val('');
        $('#fabricanteVi').val('-1');

        $('ul.marcas').children('li').removeClass('selected');
        $(this).parent().addClass('selected');

        $('div.modelos tbody tr, div.tipos tbody tr').removeClass('rowSelected');
        $('div.modelos, div.tipos, div.motores, div.motormodel').html('<div/>');
        $('div.motores, div.motormodel, div.categorias, div.families').fadeOut(ANIM_SPEED);

        $('div.modelos').fadeIn(ANIM_SPEED).html('<div></div>');
        var productZone = $('div.searchTabs').tabs("option", "selected") + 1,
            marcaId = $(this).attr('data-manu-id'),
            marcaTxt = $(this).find('img').length ? $(this).find('img').attr('alt') : $(this).text();
        $('div.carInfo').fadeIn();

        updateBreadCrumb({
            manufacturerId: marcaId,
            manufacturerName: marcaTxt.toUpperCase(),
            vehicleModelId: null,
            vehicleModelName: null,
            vehicleTypeId: null,
            vehicleTypeName: null,
            referenceTypeId: null,
            referenceNum: null,
            engineNumber: null,
            engineName: null,
            engineCode: null,
            engineManufacturerId: null,
            familyId: null,
            familyName: null
        });

        getModels(productZone, marcaId);

        $('.manufacturers').dialog('close'); //si es la ventana de seleccion de marca, se cierra
        e.preventDefault();
    };

    /***********************************************
    * Carga las versiones del modelo seleccionado
    ***********************************************/
    function getTipos(pz, modeloId) {
        SetURLFor('vehicleModelId', modeloId);
        if (pz == 4) { /* Ejes */
            $('div.tipos div').append('<table class="table tsort"><thead><tr><th>' + $.getResource('catalog_commons_type') + '</th><th>' + $.getResource('catalog_commons_maximunLoad') + '</th><th class="date">' + $.getResource('catalog_commons_year') + ' <abbr title="' + $.getResource('catalog_commons_constructionLong') + '">' + $.getResource('catalog_commons_construction') + '</abbr></th><th class="hiddenCol"></th></tr></thead><tbody></tbody></table>');
        } else {
            $('div.tipos div').append('<table class="table tsort"><thead><tr><th>' + $.getResource('catalog_commons_type') + '</th><th class="date">' + $.getResource('catalog_commons_year') + ' <abbr title="' + $.getResource('catalog_commons_constructionLong') + '">' + $.getResource('catalog_commons_construction') + '</abbr></th><th>' + $.getResource('catalog_commons_kw_cv') + '</th><th>' + $.getResource('catalog_commons_cc') + '</th><th class="cm">' + $.getResource('catalog_commons_motor_code') + '</th><th class="hiddenCol"></th></tr></thead><tbody></tbody></table>');
        }

        $('div.tipos').startLoading();

        $.myAJAX.getJSON($.getServicios("VehicleTypesListByModel"), { productZone: pz, parentId: modeloId })
            .success(function (json) {
                $('div.tipos').stopLoading();

                var tipo = [];
                $.each(json, function (i, version) {
                    if (pz == 4) { /* Ejes */
                        tipo[i] = '<tr data-tipo-id="' + version.Identifier + '"><td><span>' + version.Text + '</span></td><td>' + version.cv + '</td><td>' + version.Year + '</td><td>' + (version.Interval || '') + '</td></tr>';
                    } else {
                        tipo[i] = '<tr data-tipo-id="' + version.Identifier + '" data-salesInfo="' + version.SalesInfo + '"><td><span>' + version.Text + '</span></td><td>' + version.Year + '</td><td>' + version.kw + '/' + version.cv + '</td><td>' + version.cc + '</td><td>' + version.motorcode + '</td><td>' + (version.Interval || '') + '</td></tr>';
                    }
                });

                if (tipo.length === 0) {
                    var _colspan = (pz == 4) ? '2' : '5';
                    $('div.tipos tbody').empty().append('<tr><td class="dataTables_empty" colspan="' + _colspan + '"><strong>' + $.getResource('catalog_commons_no_vehicle_model') + '</strong></td></tr>');
                } else {
                    $('div.tipos tbody').empty().append(tipo.join(''));
                    $('div.tipos tbody tr:even').addClass('odd');
                    initTableOrder($('div.tipos table'));

                    var vehicleTypeId = $.getParamsFromHash().vehicleTypeId;

                    if (vehicleTypeId) {
                        var tr = $('div.tipos tbody tr[data-tipo-id="' + vehicleTypeId + '"]').last(),
                        scroll = tr.position().top - tr.parent().position().top;
                        tr.addClass('rowSelected').parents('div.dataTables_scrollBody').scrollTop(scroll);

                        var salesInfo = $('div.tipos tr[data-tipo-id="'+vehicleTypeId+'"]').data('salesinfo');
                        var vehicleDescSpan = $('span.cd3').attr('data-tipo-id', vehicleTypeId);
                        var vehicleTypeDesc = vehicleDescSpan.text();
                        if(salesInfo && salesInfo.length > 0 && vehicleTypeDesc.indexOf(salesInfo) == -1)
                        {
                            vehicleTypeDesc += ' '+salesInfo+' '+$.getResource('catalog_commons_unitie_short');
                        }
                        vehicleDescSpan.text(vehicleTypeDesc);

                    } else {
                        if ($('div.tipos tbody tr.autoClick').length) {
                            $('div.tipos tbody tr.autoClick').children('td').first().trigger('click');
                        }
                    }
                    $('div.tipos tbody tr.autoClick').removeClass('autoClick');
                }
            })
            .error(function () {
                $('div.tipos tbody').empty().append('<tr><td class="dataTables_empty" colspan="5"><strong>' + $.getResource('catalog_commons_no_vehicle_model') + '</strong></td></tr>');
            });
    }

    function updateTipos() {
        $('#flashMessage').empty().addClass('disabled');
        var table = $(this).parents('table.tsort').dataTable();
        $.each(table.fnGetNodes(), function (i, item) { $(item).removeClass('rowSelected'); });
        $(this).parent().addClass('rowSelected');

        $('div.categorias, div.families').fadeOut(ANIM_SPEED);
        $('div.tipos').fadeIn(ANIM_SPEED).html('<div/>');

        //almacena el modelo seleccionado
        var modeloId = $(this).parent().attr('data-model-id'),
            modeloTxt = $(this).parent().find('span').text(),
            productZone = $('div.searchTabs').tabs("option", "selected") + 1;

        updateBreadCrumb({
            vehicleModelId: modeloId,
            vehicleModelName: modeloTxt.toUpperCase(),
            vehicleTypeId: null,
            vehicleTypeName: null,
            referenceTypeId: null,
            referenceNum: null,
            engineNumber: null,
            engineName: null,
            engineCode: null,
            engineManufacturerId: null,
            familyId: null,
            familyName: null
        });

        getTipos(productZone, modeloId);
    };

    /*******************************************************
    * Mostrar botones de Esquemas  TODO
    ********************************************************/
    function getSchemaLinks(pz, tipoId) {
        if (!$('#schemaViewer').length) {
            return false;
        }
        $.myAJAX.getJSON($.getServicios("SchemeHomeButton"), { productZone: pz, vehicleTypeId: tipoId })
            .success(function (json) {
                var schemeSteeringList = [],
                schemeExhaustList = [],
                schemeEmsList = [];

                $.each(json.SteeringList, function (i, sch) {
                    schemeSteeringList[i] = '<li><a schemeId="' + sch.Id + '" type="steering" href="/Catalog/Scheme?schemeType=Steering&productZone=' + pz + '&schemeId=' + sch.Id + '">Esquema ' + sch.Id + '</a><p class="schemeDetails">' + sch.Details.join('<br/>') + '</p></li>';
                });

                $.each(json.ExhaustList, function (i, sch) {
                    schemeExhaustList[i] = '<li><a schemeId="' + sch.Id + '" type="exhaust" href="/Catalog/Scheme?schemeType=Exhaust&productZone=' + pz + '&schemeId=' + sch.Id + '">Esquema ' + sch.Id + '</a><p class="schemeDetails">' + sch.Details.join('<br/>') + '</p></li>';
                });

                $.each(json.EmsList, function (i, sch) {
                    schemeEmsList[i] = '<li><a schemeId="' + sch.Id + '" type="ems" href="/Catalog/Scheme?schemeType=Ems&productZone=' + pz + '&schemeId=' + sch.Id + '">Esquema ' + sch.Id + '</a><p class="schemeDetails">' + sch.Details.join('<br/>') + '</p></li>';
                });

                if (schemeSteeringList.length) {
                    $('p.esquemas').data('schemeSteeringList', schemeSteeringList);
                    $('p.esquemas').children('a.steeringButton').removeClass('ui-state-disabled');
                } else {
                    $('p.esquemas').data('schemeSteeringList', []);
                    $('p.esquemas').children('a.steeringButton').addClass('ui-state-disabled');
                }

                if (schemeExhaustList.length) {
                    $('p.esquemas').data('schemeExhaustList', schemeExhaustList);
                    $('p.esquemas').children('a.exhaustButton').removeClass('ui-state-disabled');
                } else {
                    $('p.esquemas').data('schemeExhaustList', []);
                    $('p.esquemas').children('a.exhaustButton').addClass('ui-state-disabled');
                }

                if (schemeEmsList.length) {
                    $('p.esquemas').data('schemeEmsList', schemeEmsList);
                    $('p.esquemas').children('a.EMSButton').removeClass('ui-state-disabled');
                } else {
                    $('p.esquemas').data('schemeEmsList', []);
                    $('p.esquemas').children('a.EMSButton').addClass('ui-state-disabled');
                }
            })
            .error(function () {
                $('p.esquemas').data('schemeList', []);
                $('p.esquemas a').addClass('ui-state-disabled');
            });
    }

    /*******************************************************
    * Mostrar lista de enlaces rapidos disponibles para un coche
    * TODO
    ********************************************************/
    function getQuicklinks(pz, tipoId) {
        SetURLFor('vehicleTypeId', tipoId);
        $('div.categorias p.noResults').remove();
        $('div.categorias ul').empty().startLoading();
        $('div.categorias .more').empty();
        $('div.categorias .esquemas').hide();
        $('section.searchBox').hasClass('collapsed') || $('section.searchBox').children('span.toggleButton').trigger('mousedown');
        $('div.modelosBox, div.motoresBox').each(function () {
            $(this).hasClass('collapsed') && $(this).children('span.toggleButton').trigger('mousedown');
        });

        $.myAJAX.getJSON($.getServicios("FamiliesHomeList"), { productZone: pz, vehicleTypeId: tipoId })
            .success(function (json) {
                $('div.categorias ul').stopLoading();
                $('div.categorias .esquemas').show();

                var familia = [];
                $.each(json, function (i, cat) {
                    familia[i] = '<li class="_25" data-vehicleType="' + tipoId + '" data-familyId="' + cat.Identifier + '"><a href="#" title="' +
                    cat.Text + '">' + ((cat.Text.length <= 23) ? cat.Text : cat.Text.slice(0, 22) + '...') + '</a></li>';
                });

                if (familia.length === 0) {
                    // Si no hay enlaces rápidos, se muestran directamente las familias
                    $('div.categorias').hide();
                    navData.familyId || updateFamilies();

                    $('div.categorias').prepend('<p class="noResults">' + $.getResource('catalog_commons_no_spareparts_model') + '</p>');
                    $('div.categorias .more').append('<a href="#" class="allcat btn2nd" data-vehicleType="' + tipoId + '">' + $.getResource('catalog_commons_all_groups') + '</a>');
                } else {
                    $('div.categorias ul').empty().append(familia.join(''));
                    $('div.categorias .more').append('<a href="#" class="allcat btn2nd" data-vehicleType="' + tipoId + '">' + $.getResource('catalog_commons_all_groups') + '</a>');
                }
            })
            .error(function () {
                $('div.categorias ul').empty();
                $('div.categorias').prepend('<p class="noResults">' + $.getResource('catalog_commons_no_spareparts_model') + '</p>');
            });
    }

    function updateQuicklinks(e) {
        var table = $(this).parents('table.tsort').dataTable();
        $.each(table.fnGetNodes(), function (i, item) { $(item).removeClass('rowSelected'); });
        $(this).parent().addClass('rowSelected');
        $('div.categorias').hide();


        $('div.families').hide();
        $('div.categorias').fadeIn(ANIM_SPEED);

        var productZone = $('div.searchTabs').tabs("option", "selected") + 1,
                tipoId = $(this).parent().attr('data-tipo-id'),
                tipoTxt = $(this).parent().find('span').text();

        updateBreadCrumb({
            vehicleTypeId: tipoId,
            vehicleTypeName: tipoTxt,
            referenceTypeId: null,
            referenceNum: null,
            familyId: null,
            familyName: null
        });
        if (getNavData('vehicleModelId')) {
            updateBreadCrumb({
                engineNumber: null,
                engineName: null,
                engineCode: null,
                engineManufacturerId: null
            });
        }

        getQuicklinks(productZone, tipoId);
        getSchemaLinks(productZone, tipoId);


        //e.preventDefault();
    };

    /**************************************************
    * Lista de resultados
    ***************************************************/
    function searchFromQuickLinks(e) {
        var vType = $(this).attr('data-vehicleType'),
            famId = $(this).attr('data-familyId'),
            famTxt = $(this).children('a').attr('title');

        SetURLFor('familyId', famId);
        $.setParamsFromHash('fm', 1);
        window.navData.quickLink = 'quick';
        // fm: tracking para "volver atras" a lista de familias o enlaces rapidos
        updateBreadCrumb({ familyId: famId, familyName: famTxt, fm: 1 });

        loadResults(null, null, 'quick');

        e.preventDefault();
    };

    /***************************************************
    * Carga contenedores con la seleccion del historico
    ***************************************************/
    function selectFromHistory(e) {

        window.navData.fm = 0;
        window.navData.engineCode = null;
        window.navData.engineNumber = null;

        var params = {
            productZone: $(this).attr('data-pz'),
            manufacturerId: $(this).children('a').attr('data-manu-id'),
            vehicleModelId: $(this).children('a').attr('data-model-id'),
            vehicleTypeId: $(this).children('a').attr('data-tipo-id'),
            referenceNum: $(this).children('a').attr('data-reference-num'),
            referenceTypeId: $(this).children('a').attr('data-reference-type-id'),
            searchLike: $(this).children('a').attr('data-search-like'),
        };

        if (params.productZone <= 0) {
            params.productZone = 1;
        }
        $('div.searchTabs').tabs("option", { selected: params.productZone - 1 });

        $.unsetParamsFromHash();
        $.setParamsFromHash(params);
        window.navData.theSearch = false;

        if (params.referenceNum) {
            $.extend(params, {
                manufacturerId: null,
                vehicleModelId: null,
                vehicleTypeId: null,
                familyId: null,
                familyName: null
            });
            $.setParamsFromHash('goResults', true);

            updateBreadCrumb(params);
            loadResults(null, null, 'sidebar');
        } else {
            $.extend(params, {
                manufacturerName: $(this).attr('data-manu-name'),
                vehicleModelName: $(this).attr('data-model-name'),
                vehicleTypeName: $(this).attr('data-type-name'),
                familyId: null,
                familyName: null,
                referenceNum: null
            });

            updateBreadCrumb(params);
            loadHome();
        }
        e.preventDefault();
    };

    /*******************************
    * Busqueda x codigo de motor
    *******************************/
    function getEngineList(motorCode, pz, manufacturer, originFlag) {
        $('div.motores div').append('<table class="table tsort"><thead><tr><th class="motorDescr" >' + $.getResource('catalog_commons_motor') + '</th><th class="ci">' + $.getResource('catalog_commons_cc_kw_cv_ci') + '</th></tr></thead><tbody></tbody></table>')

        SetURLFor('engineSearch', motorCode, manufacturer);

        $('div.motores').startLoading();

        $.myAJAX.getJSON($.getServicios("EnginesList"), { engineCode: motorCode, productZone: pz, manufacturerId: manufacturer, flag: originFlag })
            .success(function (json) {
                $('div.motores').stopLoading();

                var motorData = [];
                $.each(json, function (i, motor) {
                    //                    motorData[i] = '<tr data-manufacturerId="' + motor.ManufacturerId + '" data-engineNumber="' + motor.EngineNumber + '" data-engineCode="' + motor.EngineCode + '"><td>' + motor.Manufacturer +
                    //                        ' ' + motor.EngineCode + '</td><td>' + motor.DescriptionSales + '</td><td>' + motor.cc + '</td><td>' + motor.KW + ' / ' + motor.HP + '</td><td>' + motor.CylindersNum + '</td></tr>';
                    motorData[i] = '<tr data-manufacturerId="' + motor.ManufacturerId + '" data-engineNumber="' + motor.EngineNumber + '" data-engineCode="' + motor.EngineCode +
                                    '"><td class="motorDescr">' + motor.Manufacturer + ' ' + motor.EngineCode + '</td><td colspan="3">' + motor.Description + '</td></tr>';
                });

                if (motorData.length === 0) {
                    $('div.motores tbody').empty().append('<tr><td class="dataTables_empty" colspan="5"><strong>' + $.getResource('catalog_commons_no_motor_code') + '</strong></td></tr>');
                } else {
                    $('div.motores tbody').empty().append(motorData.join(''));
                    $('div.motores tbody tr:even').addClass('odd');
                    initTableOrder($('div.motores table'));

                    if ($.getParamsFromHash().engineNumber) {
                        var tr = $('div.motores tbody tr[data-enginenumber="' + $.getParamsFromHash().engineNumber + '"]').last(),
                        scroll = tr.position().top - tr.parent().position().top;
                        tr.addClass('rowSelected').parents('div.dataTables_scrollBody').scrollTop(scroll);
                    } else {
                        if ($('div.motores tbody tr.autoClick').length) {
                            $('div.motores tbody tr.autoClick').children('td').first().trigger('click');
                        }
                    }
                    $('div.motores tbody tr.autoClick').removeClass('autoClick');
                }

            })
            .error(function () {
                $('div.motores tbody').empty().append('<tr><td class="dataTables_empty" colspan="5"><strong>' + $.getResource('catalog_commons_no_motors_recovered') + '</strong></td></tr>');
            });
    }

    function updateEngineList(e) {
        !$('div.motoresBox').hasClass('collapsed') || $('div.motoresBox').children('span.toggleButton').trigger('mousedown');
        $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');
        var pz = getNavData('productZone');

        if (pz == 1) {
            var motorCode = $('#engineCodePc').val();
            var manufacturer = $('#supplierPc').val();
        } else {
            var motorCode = $('#engineCodeVi').val();
            var manufacturer = $('#fabricanteVi').val();
        }

        if (motorCode != '' || manufacturer != -1) {
            $('div.motores tbody tr, div.motormodel tbody tr').removeClass('rowSelected');
            $('div.modelos, div.tipos, div.motores, div.motormodel, div.categorias, div.families').fadeOut(ANIM_SPEED);
            $('div.modelos table, div.tipos table, div.motores table, div.motormodel table').fadeOut(ANIM_SPEED, function () { $(this).remove() });

            $('section.searchBox').find('ul.marcas').children('li').removeClass('selected');

            $('div.motores').html('<div/>').fadeIn(ANIM_SPEED);

            updateBreadCrumb({
                engineCode: motorCode,
                engineManufacturerId: manufacturer,
                vehicleTypeId: null,
                vehicleTypeName: null,
                familyId: null,
                fm: null,
                box: null,
                manufacturerId: null,
                vehicleModelId: null,
                vehicleModelName: null
            });

            getEngineList(motorCode, pz, manufacturer);

        }
        e.preventDefault();
    }

    /******************************
    * Seleccion de codigo de motor
    *******************************/
    function getMotormodel(pz, engNum) {
        SetURLFor('engineNumber', engNum);
        //$('div.motormodel div').append('<table class="table tsort"><thead><tr><th>Denominación</th><th>Año <abbr title="construcción">const.</abbr></th><th>KW/CV</th><th>cc</th><th>Tipo <abbr title="construcción">const.</abbr></th></tr></thead><tbody></tbody></table>');
        $('div.motormodel div').append('<table class="table tsort"><thead><tr><th>' + $.getResource('catalog_commons_denomination') + '</th><th class="date">' + $.getResource('catalog_commons_year') + ' <abbr title="' + $.getResource('catalog_commons_constructionLong') + '">' + $.getResource('catalog_commons_construction') + '</abbr></th><th>' + $.getResource('catalog_commons_tonnage') + '</th><th class="hiddenCol"></th></tr></thead><tbody></tbody></table>');

        $('div.motormodel').startLoading();
        //$.myAJAX.getJSON("/Scripts/data/mcodemodel.json", { productZone: pz, engineCode: engCode })//local
        $.myAJAX.getJSON($.getServicios("VehicleTypesByEngineNum"), { productZone: pz, engineNumber: engNum })//¿algun dato mas que necesite el servicio?
            .success(function (json) {
                $('div.motormodel').stopLoading();

                var motormodel = [];
                $.each(json, function (i, item) {
                    motormodel[i] = '<tr data-tipo-id="' + item.Identifier + '" data-parent-id="' + item.ParentId +
                                    '"><td><span>' + item.Text + '</span></td><td class="date">' + item.Year + '</td><td><span>' + item.Tonnage + '</span></td><td>' + (item.Interval || '') + '</td></tr>';
                    //motormodel[i] = '<tr data-tipo-id="' + item.Identifier + '" data-parent-id="' + item.ParentId + '"><td><span>' + item.Text + '</span></td><td>' + item.Year + '</td><td>' + item.kw + '/' + item.cv + '</td><td>' + item.cc + '</td></tr>';
                    //motormodel[i] = '<tr data-tipo-id="' + item.Identifier + '" data-parent-id="' + item.ParentId + '"><td><span>' + item.Text + '</span></td><td>' + item.Year + '</td><td>' + item.kw + '/' + item.cv + '</td><td>' + item.cc + '</td><td>' + item.construccion + '</td></tr>';
                })
                if (motormodel.length === 0) {
                    $('div.motormodel tbody').empty().append('<tr><td class="dataTables_empty" colspan="5"><strong>' + $.getResource('catalog_commons_no_models_code') + '</strong></td></tr>');
                } else {
                    $('div.motormodel tbody').empty().append(motormodel.join(''));
                    $('div.motormodel tbody tr:even').addClass('odd');
                    initTableOrder($('div.motormodel table'));

                    if ($.getParamsFromHash().vehicleTypeId) {
                        var tr = $('div.motormodel tbody tr[data-tipo-id="' + $.getParamsFromHash().vehicleTypeId + '"]').last(),
                        scroll = tr.position().top - tr.parent().position().top;
                        tr.addClass('rowSelected').parents('div.dataTables_scrollBody').scrollTop(scroll);
                    } else {
                        if ($('div.motormodel tbody tr.autoClick').length) {
                            $('div.motormodel tbody tr.autoClick').children('td').first().trigger('click');
                        }
                    }
                    $('div.motormodel tbody tr.autoClick').removeClass('autoClick');
                }
            })
            .error(function () {
                $('div.motormodel tbody').empty().append('<tr><td class="dataTables_empty" colspan="5"><strong>' + $.getResource('catalog_commons_no_models_recovered') + '</strong></td></tr>');
            });

    }

    function updateMotorModel() {
        var table = $(this).parents('table.tsort').dataTable();

        $.each(table.fnGetNodes(), function (i, item) { $(item).removeClass('rowSelected'); });
        $(this).parent().addClass('rowSelected');

        $('div.motormodel table').fadeOut(ANIM_SPEED, function () { $(this).remove() });
        $('div.categorias').fadeOut(ANIM_SPEED);
        $('div.families').hide();
        $('div.motormodel').html('<div/>').fadeIn(ANIM_SPEED);

        var engNum = $(this).parent().attr('data-engineNumber'), //
            pz = $('div.searchTabs').tabs("option", "selected") + 1,
            engName = $(this).parent().children().first().text();

        updateBreadCrumb({
            engineNumber: engNum,
            engineName: engName,
            manufacturerId: null,
            vehicleModelId: null,
            vehicleModelName: null,
            vehicleTypeId: null,
            vehicleTypeName: null,
            familyId: null,
            fm: null,
            box: null
        });

        getMotormodel(pz, engNum);
    }

    /*********************************************
    * Enlaces desde "su seleccion"
    **********************************************/
    function backFromBreadCrumb(e) {

        //Los elimino sino vengo del detalle
        if ($.getParamsFromHash().goResults) {
            $.unsetParamsFromHash('refhash');
            $.unsetParamsFromHash('reffam');
            $.unsetParamsFromHash('refsup');
            $.unsetParamsFromHash('reffeat');
        }

        if ($('div.homeWrapper').is(':visible') && $(this).hasClass('breadCrumbBackButton')) {
            if ($('div.modelosBox').is(':visible')) {
                if ($('#gruposFamilias').is(':visible')) {
                    if (window.navData.iconFamily) {
                        $.unsetParamsFromHash('iconFamily');
                        updateBreadCrumb({
                            iconFamily: null
                        });
                        $('#quickStartIconsList').children().removeClass('selected');
                    }
                    // Oculto familias y muestro enlaces rápidos
                    $('#gruposFamilias').hide();
                    showQuickLinks();

                    $.unsetParamsFromHash('fm, familyId, box');
                    updateBreadCrumb({
                        fm: null, familyId: null, box: null
                    });
                } else {
                    if ($('div.categorias').is(':visible')) {
                        // Oculto enlaces rápidos y esquemas, quito selección de tipo
                        $('div.categorias').hide();
                        $('div.tipos tbody tr').removeClass('rowSelected');

                        $.unsetParamsFromHash('vehicleTypeId');
                        updateBreadCrumb({
                            vehicleTypeId: null,
                            familyId: null,
                            fm: null,
                            box: null
                        });
                        $('.searchBox').hasClass('collapsed') && $('.searchBox span.toggleButton').trigger('mousedown');

                    } else {
                        if ($('div.tipos tbody tr').is(':visible')) {
                            // Oculto tipos
                            $('div.tipos').hide();
                            $('div.modelos tbody tr').removeClass('rowSelected');
                            $.unsetParamsFromHash('vehicleModelId');
                            updateBreadCrumb({
                                vehicleModelId: null,
                                vehicleTypeId: null,
                                familyId: null,
                                fm: null,
                                box: null
                            });

                        } else {
                            if ($('div.modelos').is(':visible')) {
                                $('div.modelos').hide();
                                $('.searchBox').hasClass('collapsed') && $('.searchBox span.toggleButton').trigger('mousedown');
                                $('ul.marcas li').removeClass('selected');
                                $.unsetParamsFromHash('manufacturerId');
                                updateBreadCrumb({
                                    manufacturerId: null,
                                    vehicleModelId: null,
                                    vehicleTypeId: null,
                                    familyId: null,
                                    fm: null,
                                    box: null
                                });
                                $('div.carInfo').children('input.breadCrumbBackButton').addClass('disabled');
                            }
                        }
                    }
                }
            }
            if ($('div.motoresBox').is(':visible')) {
                if ($('#gruposFamilias').is(':visible')) {
                    // Oculto familias y muestro enlaces rápidos
                    $('#gruposFamilias').hide();
                    showQuickLinks();

                    $.unsetParamsFromHash('fm, familyId, box');
                    updateBreadCrumb({
                        fm: null, familyId: null, box: null
                    });

                } else {
                    if ($('div.categorias').is(':visible')) {
                        // Oculto enlaces rápidos y esquemas, quito selección de tipo;
                        $('div.categorias').hide();
                        $('div.motormodel tbody tr').removeClass('rowSelected');

                        $.unsetParamsFromHash('vehicleTypeId');
                        updateBreadCrumb({
                            vehicleTypeId: null,
                            familyId: null
                        });
                        $('.searchBox').hasClass('collapsed') && $('.searchBox span.toggleButton').trigger('mousedown');

                    } else {
                        if ($('div.motormodel').is(':visible')) {
                            // Oculto modelos
                            $('div.motormodel').hide();
                            $('div.motores tbody tr').removeClass('rowSelected');
                            $.unsetParamsFromHash('engineNumber, engineManufacturerId, engineCode');
                            updateBreadCrumb({
                                engineNumber: null, engineManufacturerId: null, engineCode: null
                            });
                        } else {
                            if ($('div.motores').is(':visible')) {
                                $('div.motores').hide();
                                $('.searchBox').hasClass('collapsed') && $('.searchBox span.toggleButton').trigger('mousedown');
                                $('div.carInfo').children('input.breadCrumbBackButton').addClass('disabled');
                            }
                        }
                    }
                }
            }


        } else {

            if ($(this).parents('.ui-state-disabled').length) {
                return false;
            }
            // Boton atras
            if ($(this).hasClass('breadCrumbBackButton')) {
                $('div.carData').find('span').not(':empty').last().trigger('click');
                return false;
            }


            $.unsetParamsFromHash('fm, familyId, referenceTypeId, referenceNum, page, searchLike');
            updateBreadCrumb({
                page: null
            });

            if ($(this).attr('class') == 'cd3') {
                $.unsetParamsFromHash('familyId', 'familyName');
                updateBreadCrumb({
                    familyId: null, familyName: null
                });
            } else {
                if ($(this).attr('class') == 'cd2') {
                    $.unsetParamsFromHash('vehicleTypeId', 'vehicleTypeName', 'familyId', 'familyName');
                    updateBreadCrumb({
                        vehicleTypeId: null, vehicleTypeName: null, familyId: null, familyName: null
                    });
                } else {
                    if ($(this).attr('class') == 'cd1') {
                        $.unsetParamsFromHash('vehicleModelId', 'vehicleModelName', 'vehicleTypeId', 'vehicleTypeName', 'familyId', 'familyName');
                        updateBreadCrumb({
                            vehicleModelId: null, vehicleModelName: null, vehicleTypeId: null, vehicleTypeName: null, familyId: null, familyName: null
                        });
                    }
                }
            }

            loadHome(e.data);//isBreadcrumb

            if ($(this).attr('class') == 'cd3') {
                $('div.families').hide();
                $('div.categorias').show();
                $('.searchBox').find('span.toggleButton').trigger('mousedown');
            }

        }
    };


    /************************************************
    * Muestra los filtros de seleccion de categorias
    *************************************************/

    function filterData(data, column, value) {
        if (data == undefined) {
            return data;
        }
        if (data.length > 0) {
            return jlinq.from(data).equals(column, value).select();
        } else {
            return data;
        }
    }

    function updateFamilies() {
        $('#selFam').hide();
        $('#gruposFamilias').startLoading();
        $('#gruposFamilias').children('p.noResults').remove();
        $('#quickStartIconsList').empty();
        $('div.carData span.fm1').empty();
        $('div.categorias').hide();

        $('section.searchBox').hasClass('collapsed') || $('section.searchBox').children('span.toggleButton').trigger('mousedown');
        $('div.families')
            .fadeIn(ANIM_SPEED)
            .find('#divQuickStartIcons').children('p.more')
            .html('<button class="quicklinks btn2nd">' + $.getResource('catalog_commons_quick_links') + '</button>');


        var pz = $('div.searchTabs').tabs("option", "selected") + 1;
        var vType = $('span.cd3').attr('data-tipo-id');

        if (pz != 4) {
            $.myAJAX.getJSON($.getServicios('FamiliesByVehicleTypeIdList'), { vehicleTypeId: vType, productZone: pz }, populateFamiliesListsVehicles);
            $.myAJAX.getJSON($.getServicios('QuickStartIconsAndFamiliesByVehicleTypeId'), { vehicleTypeId: vType, productZone: pz }, populateQuickStartIcons);
        } else {
            $.myAJAX.getJSON($.getServicios('FamiliesByVehicleTypeIdList'), { vehicleTypeId: vType, productZone: pz }, populateFamiliesListsVehicles);
        }

        disableBtnQuickLinks();

        return false;
    };

    // 0_0 Esto estaba dentro de updateFamilies, antes de disableBtnQuickLinks()
    // se cambio para poder resetear los grupos de familias cuando todos tiene seleccionado Todos
    $('#selFam').on('change', 'select', function (e) {
        if (($('#families_1').val() == -1 || $('#families_1').val() == null) &&
            ($('#families_2').val() == -1 || $('#families_2').val() == null) &&
            ($('#families_3').val() == -1 || $('#families_3').val() == null) &&
            ($('#families_4').val() == -1 || $('#families_4').val() == null)) {
            //$('#selFam').find(':submit.btn').attr('disabled', 'disabled');
            $('#searchGrupoFamilias').attr('disabled', 'disabled');
        } else {
            //$('#selFam').find(':submit.btn').removeAttr('disabled');
            if($('#searchGrupoFamilias').is(':disabled')){
                $('#searchGrupoFamilias').attr('disabled', false);
            }
        }
    });
    /**************************************************
    * Desactivar boton de enlaces rápidos
    **************************************************/
    //Si no hay enlaces rápidos se desactiva el botón
    function disableBtnQuickLinks() {
        if ($('div.categorias').has('div').has('ul').has('li').length) {
            $('#divQuickStartIcons').children('p.more').children('button.quicklinks').removeAttr('disabled');
        } else {
            $('#divQuickStartIcons').children('p.more').children('button.quicklinks').attr('disabled', 'disabled');
        }
    }

    /**************************************************
    * Mostrar enlaces rápidos
    **************************************************/
    function showQuickLinks() {
        $('span.fm1, span.fm2').empty().attr('data-familyId', '');

        $('div.families').fadeOut(ANIM_SPEED, function () {
            $('div.modelosBox, div.motoresBox').each(function () {
                $(this).hasClass('collapsed') && $(this).children('span.toggleButton').trigger('mousedown');
            });

            if ($('div.categorias').find('ul').children('li').length) {
                $('div.categorias').fadeIn(ANIM_SLOW_SPEED);
            } else {
                $('div.categorias').show();
                $('input.breadCrumbBackButton').trigger('click');
            }
        });
        return false;
    };

    /**************************************************
    * Mostrar recambios a partir de las categorias
    **************************************************/
    function searchFromFamilies(e) {
        // fm: tracking para "volver atras" a lista de familias o enlaces rapidos
        $('div.familyBoxes').children('div.familySearchFilter').find('strong').hide();

        var familyData = getFamilySelection('families');
        familyData.fm = 2, familyData.box = $(this).data('box');

        SetURLFor('familyId', familyData.familyId);
        $.setParamsFromHash({ fm: 2, box: familyData.box });
        updateBreadCrumb(familyData);

        loadResults(null, null, 'fam');

        e.preventDefault();
    };

    function searchFromAccFamilies(e) {
        // fm: tracking para "volver atras" a lista de familias o enlaces rapidos
        var familyData = getFamilySelection('Accessories');
        familyData.fm = 3, familyData.box = $(this).data('box');

        SetURLFor('familyId', familyData.familyId);
        $.setParamsFromHash({ fm: 3, box: familyData.box });
        updateBreadCrumb(familyData);

        loadResults(null, null, 'acc');

        e.preventDefault();
    };

    function getFamilySelection(listId) {
        var list1 = $('#' + listId + '_' + 1),
        list2 = $('#' + listId + '_' + 2),
        list3 = $('#' + listId + '_' + 3),
        list4 = $('#' + listId + '_' + 4);

        if ((list4.val() != null) && ((list4.val() != -1))) {
            famId = list4.val();
            famTxt = list4.find('option:selected').text();
        } else if ((list3.val() != null) && ((list3.val() != -1))) {
            famId = list3.val();
            famTxt = list3.find('option:selected').text();
        } else if ((list2.val() != null) && ((list2.val() != -1))) {
            famId = list2.val();
            famTxt = list2.find('option:selected').text();
        } else if (list1.val() != -1) {
            famId = list1.val();
            famTxt = list1.find('option:selected').text();

        } else {
            $('div.families :submit').attr('disabled', 'disabled');
            famId = -1; //TODO: Validar antes de enviar
            famTxt = $.getResource('catalog_commons_all_groups')
        }

        return { familyId: famId, familyName: famTxt };
    }

    function searchArticles(pz, vType, familyId, pg, el, filterBySupplier, filterByGeneric, originFlag) {//, applyFilters
        //var pz = $.getParamsFromHash().productZone;
        //        if (applyFilters === undefined) {
        //            applyFilters = true;
        //        }

        $.setParamsFromHash({
            page: (pg) ? pg + 1 : 1,
            engineCode: getNavData('engineCode'),
            engineNumber: getNavData('engineNumber'),
            engineManufacturerId: getNavData('engineManufacturerId')
        });
        $('#flashMessage').hide();
        $('div.pagination').empty();

        $('#resultados').children('ul').html($loading.clone());
        $('div.carInfo').addClass('ui-state-disabled');
        cleanSearchHash();
        $('#btnShowRefined input').removeAttr('checked');
        $.myAJAX.getJSON("/Catalog/SearchArticles", { productZone: pz, vehicleTypeId: vType, familyId: familyId, page: pg, elements: el, filterBySupplier: filterBySupplier, filterByGeneric: filterByGeneric, applyFilters: String(!window.navData.ShowAll), flag: originFlag })
            .success(function (articulos) {
                if (articulos != undefined) {
                    setSearchHash(articulos.Hash);
                    setSearchKey(articulos.Key);
                }
                $('div.carInfo').removeClass('ui-state-disabled');
                showResults(articulos, pz, familyId, vType, null, null, window.navData.ShowAll);
            })
           .error(function () {
               $('div.carInfo').removeClass('ui-state-disabled');
               $('#resultados ul').empty().append('<li><strong>' + $.getResource('catalog_commons_no_articles_vehicle') + '</strong></li>');
           });
    }

    function showResults(articlesList, prodZone, familyId, vehTypeId, referenceTypeId, referenceNum, seeAll) {
        articlesResultList = articlesList;

        if (seeAll === undefined) {
            seeAll = false;
        }

        var generic = null;
        var vType = $('span.cd3').attr('data-tipo-id'); //lo toma de la miga que se genera

        if (($('#families_4').val() != null) && (($('#families_4').val() != -1))) {
            famId = $('#families_4').val();
            famTxt = $('#families_4 option:selected').text();
        } else if (($('#families_3').val() != null) && (($('#families_3').val() != -1))) {
            famId = $('#families_3').val();
            famTxt = $('#families_3 option:selected').text();
        } else if (($('#families_2').val() != null) && (($('#families_2').val() != -1))) {
            famId = $('#families_2').val();
            famTxt = $('#families_2 option:selected').text();
        } else if ($('#families_1').val() != -1) {
            famId = $('#families_1').val();
            famTxt = $('#families_1 option:selected').text();

        } else {
            $('div.families :submit').attr('disabled', 'disabled');
            famId = -1; //TODO: Validar antes de enviar
            famTxt = $.getResource('catalog_commons_all_groups')
        }

        if (referenceTypeId != null) {
            var rsTypeText = $('#refTypePc').children('[value=' + referenceTypeId + ']').text();
            if (referenceTypeId == -1)
                $('span.rs2').empty().attr('data-reference-type-id', referenceTypeId);
            else
                $('span.rs2').empty().attr('data-reference-type-id', referenceTypeId).html('<abbr title="' + rsTypeText + '">?</abbr>');
        }
        else if (articlesList != null && articlesList.TotalCount > 0) {
            generic = articlesList.List[0].GenericArticleId;
        }

        if (referenceNum != null) {
            $('span.rs1').empty().attr('data-reference-text', referenceNum).text(referenceNum);
        }

        drawListOfArticles(articlesList, familyId, vehTypeId, prodZone, referenceTypeId, referenceNum, seeAll, false, false);

        if (articlesList.TotalCount > 0) {
            $('#resultados').trigger('EventResultsLoaded');
        }
        else {
            $('#btnShowRefined').children("img.loadrefinedimage").hide();
            $('div.pagination').children('ul.ui-state-disabled').hide();
        }

        getArticlesFeatures(articlesList, prodZone, vehTypeId, generic);

        if (articlesList != undefined && articlesList.TotalCount > 0)
            getStockInformation(articlesList);

    }

    $('#resultados').on('click', '.addToChart', function (e) {
        var codRef = $(e.target).attr('codRef');
        var codStock = $(e.target).attr('codStock');
        var total = $(e.target.parentNode.parentNode).siblings('.quantity').children('.stockValue').children('input').val();
        if (total != "")
            addArticleToChart(codRef, codStock, total);
        else
            $.setInfoDialog($.getResource('catalog_stock_error_quantity'), $.getResource('catalog_stock_dialog_title'));
    });

    function getStockInformation(articlesList) {
        var references = "";
        var suppliers = "";
        var cont = 0;
        if ($.invokeToi2i()) {
            $('.stockInfo').html('');
            $('#articleResults a').removeClass('stock_painted');
            $('#articleResults div.stockInfo').removeClass('has_content');

            $.each(articlesList.List, function (i, article) {
                if (cont > 0) {
                    references += "@";
                    suppliers += ",";
                }
                references += article.ArticleTecDocId.toString();
                suppliers += article.SupplierId.toString();
                cont++;
            });
            $('.stockInfo').startLoading();
            $.myAJAX.getJSON("/Services/ArticlesStock", { references: references, suppliers: suppliers })
            .success(function (stock) {
                $('.stockInfo').stopLoading();

                $('#btnShowDiscounts').removeAttr('disabled');

                var json = $.parseJSON(stock.json);
                var codigo = (json == null) ? stock.json.Data.codigo : json.codigo;
                if (codigo == -1) {
                    $.setInfoDialog($.getResource('catalog_stock_error_info'), $.getResource('catalog_stock_dialog_title'));
                }
                else if (codigo == 1) {
                    $.setInfoDialog($.getResource('catalog_stock_error_token'), $.getResource('catalog_stock_dialog_title'));
                }
                else {
                    drawStockInfo(stock);
                }
            })
           .error(function () {
               $('.stockInfo').stopLoading();
               $('#btnShowDiscounts').removeAttr('disabled');
               if (window.location.pathname.search('goResults') != -1)
                   $.setInfoDialog($.getResource('catalog_stock_error_call'), $.getResource('catalog_stock_dialog_title'));
           });
        }
    }

    function drawStockInfo(stock) {
        var json = $.parseJSON(stock.json);
        var totalCount = (json == null) ? stock.json.Data.TotalCount : json.TotalCount;
        var view_discounts = stock.Discounts;
        var view_prices = stock.Prices;
        var view_stock = stock.Stock;

        if (totalCount > 0) {
            var _ulRes = $('#articleResults');

            $.each(json.List, function (i, article) {
                var _element = _ulRes.children('.recambio').children('.description').children('.articleData').children('a.tdId[tecDocId="' + article.ArticleTecDocId + '"]');
                if (!_element.hasClass('stock_painted')) {
                    if (article.CodReferCecauto != null && article.Precio != null && article.Descuento != null && article.Stock != null) {
                        var _ulStock = "<ul class=\"stockData\">";
                        if (view_discounts) {
                            $.each(article.Descuento, function (i, descuento) {
                                _ulStock += "<li><div class=\"stockHeader\">" + $.getResource('catalog_stock_discount') + " " + (i + 1) + "</div><div class=\"stockValue\">" + descuento + " %</div></li>";
                            });
                        }
                        if (view_prices) {
                            _ulStock += "<li><div class=\"stockHeader\">" + $.getResource('catalog_stock_price') + "</div><div class=\"stockValue\">" + article.Precio + " " + $.getResource('catalog_stock_money') + "</div></li>";
                        }
                        var _quantityHTML = "<li class=\"quantity\"><div class=\"stockHeader\">" + $.getResource('catalog_stock_quantity_short') + "</div><div class=\"stockValue\"><input type=\"text\"  value=\"1\"></div></li>";
                        var _stocksHTML = "";
                        var cant = 0;
                        $.each(article.Stock, function (i, stock) {
                            cant += (stock.CodAlmacen != null) ? ((stock.Unidades !== -1) ? stock.Unidades : 1) : 0;
                            _stocksHTML += "<li codStock=\"" + stock.CodAlmacen + "\"><div class=\"stockHeader\">" + stock.Almacen + "</div><div class=\"stockValue\">" +
                            ((stock.CodAlmacen != null && (stock.Unidades > 0 || stock.Unidades === -1 )) ? (" <img class=\"addToChart\" codStock=\"" + stock.CodAlmacen + "\" codRef=\"" + article.CodReferCecauto + "\" alt=\"Pedir\" title=\"" + $.getResource('catalog_stock_Add') + "\" src=\"/Images/icons/shopping-cart.png\">") : "") +
                            ((stock.CodAlmacen != null && (stock.Unidades > 0 || stock.Unidades === -1 )) ? ("<div class=\"available\">" + (stock.Unidades >= 1 ? stock.Unidades : '' ) + "</div>") : ("<div>" + stock.Unidades + "</div>")) + "</div></li>";
                        });
                        if (cant > 0)
                            _ulStock += _quantityHTML + _stocksHTML;
                        else
                            _ulStock += _stocksHTML;
                        _ulStock += "</ul>";
                        _element.addClass('stock_painted');
                        _element.parent().parent().children('.stockInfo[tecDoc="' + article.ArticleTecDocId + '"]').addClass('has_content').html(_ulStock);
                    }
                    else {
                        _element.parent().parent().children('.stockInfo[tecDoc="' + article.ArticleTecDocId + '"]').addClass('has_content').html($.getResource('catalog_stock_no_stock_info'));
                    }
                }
            });
        }
    }

    function addArticleToChart(codRef, codStock, total) {
        $('#resultados').addOverlay(true, $.getResource('catalog_stock_overlay'));
        $.myAJAX.getJSON("/Services/AddArticlesToShoppingCart", { CodRefCecauto: codRef, CodAlmacen: codStock, total: total })
            .success(function (resp) {
                $('#resultados').removeOverlay();
                var json = $.parseJSON(resp.json);
                var codigo = (json == null) ? resp.json.Data.codigo : json.codigo;
                if (codigo == 0) {
                    $.setInfoDialog($.getResource('catalog_stock_ok'), $.getResource('catalog_stock_dialog_title'));
                }
                else if (codigo == 1)
                    $.setInfoDialog($.getResource('catalog_stock_error_token'), $.getResource('catalog_stock_dialog_title'));
                else if (codigo == 2)
                    $.setInfoDialog($.getResource('catalog_stock_error_system'), $.getResource('catalog_stock_dialog_title'));
                else if (codigo == 3)
                    $.setInfoDialog($.getResource('catalog_stock_error_stock'), $.getResource('catalog_stock_dialog_title'));
                else if (codigo == 4)
                    $.setInfoDialog($.getResource('catalog_stock_error_format'), $.getResource('catalog_stock_dialog_title'));
                else if (codigo == -1)
                    $.setInfoDialog($.getResource('catalog_stock_error_info'), $.getResource('catalog_stock_dialog_title'));
            })
           .error(function () {
               $('#page').removeOverlay();
               $.setInfoDialog($.getResource('catalog_stock_error_call'), $.getResource('catalog_stock_dialog_title'));
           });
    }

    function drawListOfArticles(articlesList, familyId, vehTypeId, prodZone, referenceTypeId, referenceNum, seeAll, isRefined) {
        if (seeAll === undefined) {
            seeAll = false;
        }

        if (isRefined === undefined) {
            isRefined = false;
        }

        $('div.pagination').empty();

        var totalCount = articlesList.TotalCount, page = articlesList.Page + 1, totalPages = articlesList.TotalPages, eleStart = articlesList.ElementStart, eleEnd = articlesList.ElementEnd, hasPrev = articlesList.HasPrev, hasNext = articlesList.HasNext;
        var oPages = articlesList.PageList;
        var resultado = [];
        var pz = $('div.searchTabs').tabs("option", "selected") + 1;
        var applyFilters = articlesList.ApplyFilters;
        var canShowAll = articlesList.CanShowAll;

        //Mostrar/ocultar botón de "Ver todos"
        //(si no le ha dado al botón y el usuario puede consultar sin filtros, se muestra)
        if (seeAll == false && canShowAll == true) {
            $('#btnShowDiscounts').addClass('showDiscountsNormal');
            $('#btnShowDiscounts').removeClass('showDiscountsLeft');
            $('#btnSeeAll').show().attr('disabled', false).removeClass('btnDisabled');
        } else if (seeAll == true && canShowAll == true) {
            $('#btnShowDiscounts').addClass('showDiscountsNormal');
            $('#btnShowDiscounts').removeClass('showDiscountsLeft');
            $('#btnSeeAll').show().attr('disabled', true).addClass('btnDisabled');
        } else {
            $('#btnSeeAll').hide();
        }

        //se pintan los resultados si el usuario no puede hacer una petición sin filtro o el número de artículos es > 0
        if (totalCount > 0 || canShowAll == false || seeAll == true || isRefined) {
            $.each(articlesList.List, function (i, recambio) {
                var detailLink = '';

                if (referenceNum == null || referenceNum == undefined) {
                    detailLink = '/Catalog/Details?articleId={0}&genericArticleId={1}&familyId={2}&vehicleTypeId={3}&productZone={4}&fm={5}&box={6}&page={7}&iconFamily={8}';
                    if ($.getParamsFromHash().engineNumber) {
                        detailLink += '&engineNumber=' + $.getParamsFromHash().engineNumber
                    }
                    if ($.getParamsFromHash().engineCode) {
                        detailLink += '&engineCode=' + $.getParamsFromHash().engineCode
                    }
                    if ($.getParamsFromHash().engineManufacturerId) {
                        detailLink += '&engineManufacturerId=' + $.getParamsFromHash().engineManufacturerId
                    }
                    detailLink = detailLink.format(recambio.Identifier, recambio.GenericArticleId, familyId, vehTypeId, prodZone, $.getParamsFromHash().fm || 1, window.navData.box || -1, page || 1, window.navData.iconFamily >= 0 ? window.navData.iconFamily : -1);
                } else {
                    detailLink = '/Catalog/Details?articleId={0}&genericArticleId={1}&referenceTypeId={2}&referenceNum={3}&productZone={4}&page={5}&searchLike={6}';
                    detailLink = detailLink.format(recambio.Identifier, recambio.GenericArticleId, referenceTypeId, referenceNum, prodZone, page || 1, $.getParamsFromHash().searchLike || 'false');
                }

                if ($.getParamsFromHash().genericId) {
                    detailLink += '&genericId=' + $.getParamsFromHash().genericId
                }
                if ($.getParamsFromHash().supplierId) {
                    detailLink += '&supplierId=' + $.getParamsFromHash().supplierId
                }
                if (window.navData.ShowAll == true) {
                    detailLink += '&ShowAll=true';
                }
                //refined search
                if ($.getParamsFromHash().refhash) {
                    detailLink += '&refhash=' + $.getParamsFromHash().refhash;
                }
                if ($.getParamsFromHash().reffam) {
                    detailLink += '&reffam=' + $.getParamsFromHash().reffam;
                }
                if ($.getParamsFromHash().refsup) {
                    detailLink += '&refsup=' + $.getParamsFromHash().refsup;
                }
                if ($.getParamsFromHash().reffeat) {
                    detailLink += '&reffeat=' + $.getParamsFromHash().reffeat;
                }

                resultado[i] = '<li class="recambio ' + (recambio.IsCecauto ? 'cecauto' : '') + '" data-articleId="' + recambio.Identifier + '" ><div class="imgPlaceholder"><img class="logo" src="' +
                        (recambio.SupplierImage ? recambio.SupplierImage : "/Images/65x40.gif") + '" alt="' + recambio.SupplierName + '" />' + '<a href="' + detailLink + '"><img class="photo" src="' +
                        (recambio.Images && recambio.Images.length > 0 ? (recambio.Images[0].ArticleImage.split('.').pop().toLowerCase() == 'pdf' ? "/Images/icons/icon-pdf.png" : recambio.Images[0].ArticleImage) : "/Images/100x100.gif") + '" alt="" /></a></div><div class="description"><h1 class="recName"><a href="' + detailLink + '">' +
                        recambio.Name + '</a></h1><p class="articleData"><a class="tdId" tecDocId="' + recambio.ArticleTecDocId + '" href="' + detailLink + '">' + recambio.ArticleTecDocId + '</a><span class="sDesc">' + (recambio.Description ? recambio.Description : '') + ' </span><strong>(' + recambio.SupplierName + ')</strong> </p>' +
                        (articlesList.RefSearch <= 0 ? '<p class="foundBy">' + $.getResource('catalog_commons_find_by') + ' ' + recambio.ReferenceSearchType + ': ' + recambio.Reference + '</p>' : '') +

                        ((recambio.SupersededArticles && recambio.SupersededArticles.length) || (recambio.SupersedingArticles && recambio.SupersedingArticles.length) ? '<div class="ssData">' : '') +
                        (recambio.SupersededArticles && recambio.SupersededArticles.length > 0 ? '<p>' + $.getResource('catalog_commons_replace_to') + ' : ' + supersedingOrSupersededList(recambio.SupersededArticles, familyId, vehTypeId, prodZone, referenceTypeId, referenceNum) + '</p>' : '') +
                        (recambio.SupersedingArticles && recambio.SupersedingArticles.length > 0 ? '<p>' + $.getResource('catalog_commons_replaced_by') + ' : ' + supersedingOrSupersededList(recambio.SupersedingArticles, familyId, vehTypeId, prodZone, referenceTypeId, referenceNum) + '</p>' : '') +
                        ((recambio.SupersededArticles && recambio.SupersededArticles.length) || (recambio.SupersedingArticles && recambio.SupersedingArticles.length) ? '</div>' : '') +

                        (recambio.References ? '<p class="links">' + articleLinks(recambio.References) + '</p>' : '') + '<p class="featureList">' + '<img src="/Images/refined/refined_loading_page.gif" />' + '</p><p class="topActions"><a href="#" data-identifier="' + recambio.Identifier + '" data-genericId="' + recambio.GenericArticleId + '" class="compareBtn" title="' + $.getResource('catalog_commons_compare') + '"><img src="../../Images/icons/icon-compare.png" alt="' + $.getResource('catalog_commons_compare') + '" /></a></p><ul class="opt"><li class="btn"><a data-identifier="' + recambio.Identifier +
                        '" href="' + detailLink + '">' + $.getResource('catalog_commons_see_details') + '</a></li></ul><div tecDoc="' + recambio.ArticleTecDocId + '" class="stockInfo"></div></li>';
            });


            if (totalCount > 0 && (($.getParamsFromHash().supplierId != null && $.getParamsFromHash().supplierId != "null") ||
                ($.getParamsFromHash().genericId != null && $.getParamsFromHash().genericId != "null"))) {
                $('p.noFilterResults').hide().addClass('disabled');
                $('#resultados ul').empty().hide().append(resultado.join('')).fadeIn(ANIM_SPEED);
                paginate(prodZone, totalCount, page, totalPages, eleStart, eleEnd, hasPrev, hasNext, vehTypeId, familyId, oPages);
            } else {
                if (resultado.length) {
                    $('#resultados ul').empty().hide().append(resultado.join('')).fadeIn(ANIM_SPEED);
                    paginate(prodZone, totalCount, page, totalPages, eleStart, eleEnd, hasPrev, hasNext, vehTypeId, familyId, oPages);
                } else {
                    if (!isRefined) {
                        showFlashMessage(totalCount);
                    } else {
                        $('#articleResults').stopLoading().prepend('<li class="recambio "><p class="noResults">' + $.getResource('catalog_commons_no_results') + '</p></li>');
                    }

                }

            }

            if ($.showI2IButton()) {
                if (!$.invokeToi2i()) {
                    $('#btnShowDiscounts').removeAttr('disabled');
                }
            }
        }
        else {
            // Si el usuario puede ver sin filtros y no hay resultados con filtros, se lanza la petición sin filtros
            if (canShowAll == true && totalCount == 0 && seeAll == false) {
                $('#btnSeeAll').trigger('click');
            }
            else if (totalCount == -1) {
                showFlashMessage(totalCount);
            }
        }
    }

    function showFlashMessage(totalCount) {
        var txtResults = ((totalCount == 0) ? $.getResource('catalog_commons_no_results') : (totalCount == -1) ? $.getResource('catalog_commons_too_many_results') : "");
        $('#flashMessage').html(txtResults + '<span style="position:absolute;right:10px;top:3px;cursor:pointer;"><img src="../../Images/icons/button-cross.png" alt="' + $.getResource('catalog_commons_close') + '" /></span>').removeClass('disabled').show();
        if ($('#flashMessage').hasClass('disabled')) {
            $('#flashMessage').removeClass('disabled');
        }
        else {
            $('#flashMessage').show();
        }
        $('div.carInfo').children('input.breadCrumbBackButton').trigger('click');
    }

    //Pinta los enlaces sustituye a - sustituido por
    function supersedingOrSupersededList(articles, familyId, vehTypeId, prodZone, referenceTypeId, referenceNum) {
        if (articles !== null) {

            var arts = [];
            $.each(articles, function (i, currentArticle) {

                var detailLink = '';

                if (referenceNum == null || referenceNum == undefined) {
                    detailLink = '/Catalog/Details?articleId={0}&genericArticleId={1}&familyId={2}&vehicleTypeId={3}&productZone={4}&fm={5}&box={6}&page={7}';
                    if ($.getParamsFromHash().engineNumber) {
                        detailLink += '&engineNumber=' + $.getParamsFromHash().engineNumber
                    }
                    if ($.getParamsFromHash().engineCode) {
                        detailLink += '&engineCode=' + $.getParamsFromHash().engineCode
                    }
                    if ($.getParamsFromHash().engineManufacturerId) {
                        detailLink += '&engineManufacturerId=' + $.getParamsFromHash().engineManufacturerId
                    }
                    detailLink = detailLink.format(currentArticle.Identifier, currentArticle.GenericArticleId, familyId, vehTypeId, prodZone, $.getParamsFromHash().fm || 1, window.navData.box || -1, $.getParamsFromHash().page);
                } else {
                    detailLink = '/Catalog/Details?articleId={0}&genericArticleId={1}&referenceTypeId={2}&referenceNum={3}&productZone={4}&page={5}&searchLike={6}';
                    detailLink = detailLink.format(currentArticle.Identifier, currentArticle.GenericArticleId, referenceTypeId, referenceNum, prodZone, $.getParamsFromHash().page, $.getParamsFromHash().searchLike || 'false');
                }

                if ($.getParamsFromHash().genericId) {
                    detailLink += '&genericId=' + $.getParamsFromHash().genericId
                }
                if ($.getParamsFromHash().supplierId) {
                    detailLink += '&supplierId=' + $.getParamsFromHash().supplierId
                }

                arts[i] = '<a href="' + detailLink + '">' + currentArticle.ArticleTecDocId + '</a>';
            })
            var articleList = arts.join(', ');

            return articleList;
        } else {
            return '';
        }
    }

    //Pinta las caracteristicas de cada articulo
    //Recoge el objeto/array y el elemento en que se pinta (x si se utiliza para los enlaces)
    function generateArticleFeaturesContent(features) {

        if (features !== null) {

            var feat = [];
            $.each(features, function (i, key) {
                feat[i] = ' <span class="key">' + key.Name + ':  </span><span class="value">' + key.Text + '</span>';
            })
            var featureList = feat.join('  -  ');

            return featureList;
        } else {
            return '';
        }
    };


    /*************************
    * Paginacion
    *************************/
    function paginate(prodZone, totalCount, page, totalPages, eleStart, eleEnd, hasPrev, hasNext, vType, familyId, oPaginas) {
        $('div.pagination').empty();
        if (totalPages == 0) {
            eleStart = 0;
            var txtResults = $.getResource('catalog_commons_no_results');
            $('p.noFilterResults').html(txtResults).removeClass('disabled').show();
        }

        $('div.pagination').first().append('<p class="show">' + $.getResource('catalog_commons_show_results_of_total').format(eleStart, eleEnd, totalCount) + '</p>');


        if (totalPages > 1) {
            var lis = [],
            currentPage = page,
            start = (totalPages > 12) ? Math.max(currentPage - 3, 1) : 1,
            end = (totalPages > 12) ? Math.min(start + 6, totalPages) : totalPages;

            $('div.pagination').append('<ul class="pages"/>');

            if (start > 1) {
                lis.push('<li><a href="#">1</a></li>');
                if (currentPage > 5) {
                    lis.push('<li>...</li>');
                }
            }

            for (var i = start; i <= end; i++) {
                if (i === currentPage) {
                    lis.push('<li><strong>' + i + '</strong></li>');
                } else {
                    lis.push('<li><a href="#">' + i + '</a></li>');
                }
            }

            if (totalPages > end) {
                if (currentPage < totalPages - 4) {
                    lis.push('<li>...</li>');
                }
                lis.push('<li><a href="#">' + totalPages + '</a></li>');
            }
            $('ul.pages').append(lis.join(''));

            if (hasPrev) {
                $('ul.pages').prepend('<li><a href="#" class="prev">&laquo; ' + $.getResource('catalog_commons_previous_plural') + '</a></li>')
            }
            if (hasNext) {
                $('ul.pages').append('<li><a href="#" class="next">' + $.getResource('catalog_commons_next_plural') + ' &raquo;</a></li>')
            }

            SetURLFor('page', currentPage);
        }



        $('div.pagination').unbind('click');
        $('div.pagination').on('click', 'ul.pages li a', function (e) {

            var filterBySupplier = $('#searchFilterSupplier').children('option:selected').val();
            var filterByGeneric = $('#searchFilterGeneric').children('option:selected').val();

            var pageToGo = 0;

            if ($(this).hasClass('next')) {
                pageToGo = page;
            } else if ($(this).hasClass('prev')) {
                pageToGo = page - 2;
            } else {
                pageToGo = 0 + $(this).text() - 1;
            }

            window.navData.page = pageToGo;
            showHideRefinedOptionByFamily();
            doRefinedSearch(pageToGo);

            e.preventDefault();
            e.stopPropagation();

        });


        var uldisabled = $('<ul class="pages ui-state-disabled"><li><img src="/Images/refined/refined_loading_page.gif" /></li></ul>');
        $.each($('div.pagination').children('ul.pages').first().find('a, strong'), function (i, item) {
            uldisabled.append($('<li><span>' + $(this).text() + '</span></li>'));
        });

        $('div.pagination').append(uldisabled);


        $('div.pagination').children('ul.pages').hide();
        $('div.pagination').children('ul.ui-state-disabled').show();

    }

    /************************
    * Ordenacion de tablas
    ************************/
    function initTableOrder(table) {
        var oTable = table.dataTable({
            "aoColumnDefs": [
                { "bVisible": false, "aTargets": ['hiddenCol'] }
            ],
            "bFilter": true,
            "bAutoWidth": false,
            "bSort": true,
            "sScrollY": "200px",
            "bScrollCollapse": true,
            "bPaginate": false,
            "bRetrieve": true,
            "bInfo": false,
            "sDom": 'tf',
            "oLanguage": {
                "sLengthMenu": $.getResource('catalog_commons_show_results_page').format('_MENU_'),
                "sZeroRecords": $.getResource('catalog_commons_no_results_found'),
                "sInfo": $.getResource('catalog_commons_show_results_of_total').format('_START_', '_END_', '_TOTAL_'),
                "sInfoEmpty": $.getResource('catalog_commons_show_results_empty'),
                "sSearch": "",
                "oPaginate": {
                    "sFirst": $.getResource('catalog_commons_first'),
                    "sLast": $.getResource('catalog_commons_last'),
                    "sNext": $.getResource('catalog_commons_next'),
                    "sPrevious": $.getResource('catalog_commons_previous')
                }
            },
            "fnInitComplete": function () {
                var _table = this,
                _filter = _table.parents('div.dataTables_wrapper').find('div.dataTables_filter').children('label'),
                _button = $('<span>X</span>');

                _button.on('click', function () {
                    $(this).hide();
                    $(this).siblings('input').val('').trigger('keyup');
                });

                _filter.css('position', 'relative').append(_button.hide());

                _filter.on('keyup', 'input', function () {
                    if ($.trim($(this).val()).length) {
                        _button.show();
                    } else {
                        _button.hide();
                    }
                });

                if (_table.fnGetNodes().length === 1) {
                    var _tr = $(_table.fnGetNodes()[0]);
                    _tr.addClass('autoClick');
                }
            },
            "fnDrawCallback": function () {
                var tr = this.find('tbody tr.rowSelected');

                if (tr.length) {
                    var scroll = tr.position().top - tr.parent().position().top;
                    tr.parents('div.dataTables_scrollBody').scrollTop(scroll);
                }
            }
        });

        $('#page').data('tables').push(oTable);
    }

    /*******************************
    * Busqueda x referencia
    *******************************/
    function searchReferenceNumber(e, page, elems) {
        var pz = $('div.searchTabs').tabs("option", "selected") + 1,
        searchLike = $(this).find('input.isExactSearch').length ? !$(this).find('input.isExactSearch').attr('checked') : getNavData('searchLike'),
        refNum, refTypeId, refType;

        switch (pz) {
            case 1:
                refNum = $('#referencePc').val();
                refTypeId = $('#refTypePc').val();
                refType = $('#refTypePc').find("option:selected").text();
                break;
            case 2:
                refNum = $('#referenceVi').val();
                refTypeId = $('#reftypeVi').val();
                refType = $('#reftypeVi').find("option:selected").text();
                break;
            case 4:
                refNum = $('#referenceAx').val();
                refTypeId = $('#reftypeAx').val();
                refType = $('#reftypeAx').find("option:selected").text();
                break;
        }

        if (refNum != '') {

            var filterBySupplier = $('#searchFilterSupplier').children('option:selected').val();
            var filterByGeneric = $('#searchFilterGeneric').children('option:selected').val();

            $.unsetParamsFromHash();
            $.setParamsFromHash({
                referenceNum: refNum,
                referenceTypeId: refTypeId,
                searchLike: searchLike,
                page: (page) ? page + 1 : 1
                //supplierId: filterBySupplier,
                //genericId: filterByGeneric
            });
            updateBreadCrumb({ engineCode: null, engineManufacturerId: null, engineNumber: null, familyId: null, manufacturerId: null, vehicleModelId: null, vehicleTypeId: null, referenceNum: refNum, referenceTypeName: refType, referenceTypeId: refTypeId, searchLike: searchLike });

            loadResults(page, elems);
        }
        if (e != null)
            e.preventDefault();
    }

    function getArticlesForReference(pz, referenceNum, referenceTypeId, page, elements, searchLike, filterBySupplier, filterByGeneric, originFlag) {//, applyFilters
        //        if (applyFilters == undefined) {
        //            applyFilters = true;
        //        }

        $('#flashMessage').hide();

        $('div.carInfo').addClass('ui-state-disabled');
        $('div.pagination').empty();

        $('#resultados').children('ul').html($loading.clone());
        $('#btnShowRefined input').removeAttr('checked');
        $.myAJAX.getJSON("/Catalog/SearchArticlesByReference", { productZone: pz, referenceNum: referenceNum, referenceTypeId: referenceTypeId, searchLike: searchLike, page: page, elements: elements, filterBySupplier: filterBySupplier, filterByGeneric: filterByGeneric, applyFilters: String(!window.navData.ShowAll), flag: originFlag })
                    .success(function (json) {
                        if (json != undefined) {
                            setSearchHash(json.Hash);
                            setSearchKey(json.Key);
                        }
                        $('div.carInfo').removeClass('ui-state-disabled');
                        $.updateReferenceSearchesList();
                        showResults(json, pz, null, null, referenceTypeId, referenceNum, window.navData.ShowAll);
                    })
                    .error(function () {
                        $('div.carInfo').removeClass('ui-state-disabled');
                        $('div.motores tbody').empty().append('<tr><td colspan="5"><strong>' + $.getResource('catalog_commons_no_motors_recovered') + '</strong></td></tr>');
                    });
    }

    /***********************************************
    * Actualiza parametros en la URL, cuidando la
    * relacion entre ellos
    ***********************************************/
    function SetURLFor(key, value) {
        var unsetParamList = ['referenceTypeId', 'referenceNum', 'page'];

        if (key == 'referenceSearch') {
            var page = $.getParamsFromHash().page || 0;
            // Caso especial: buscar por referencia (utiliza dos parametros)
            $.unsetParamsFromHash();
            $.setParamsFromHash({ goResults: true, referenceTypeId: arguments[1], referenceNum: arguments[2], page: page });
        } else if (key == 'engineSearch') {
            // Caso especial: buscar por motor (utiliza dos parametros)
            $.unsetParamsFromHash();
            $.setParamsFromHash({ engineCode: arguments[1], engineManufacturerId: arguments[2] });
        } else {
            switch (key) {
                case 'productZone':
                    value = (value > 0) ? value : 1;
                    break;
                case 'manufacturerId':
                    unsetParamList.push('vehicleModelId', 'vehicleTypeId', 'familyId', 'fm', 'box', 'engineNumber', 'engineCode', 'engineManufacturerId', 'supplierId', 'genericId', 'goResults');
                    break;
                case 'vehicleModelId':
                    unsetParamList.push('vehicleTypeId', 'familyId', 'fm', 'box', 'engineNumber', 'engineCode', 'engineManufacturerId', 'supplierId', 'genericId', 'goResults');
                    break;
                case 'vehicleType':
                    unsetParamList.push('familyId', 'fm', 'box', 'engineNumber', 'engineCode', 'engineManufacturerId', 'supplierId', 'genericId', 'goResults');
                    break;
                case 'familyId':
                    if (getNavData('vehicleModelId')) {
                        unsetParamList.push('engineNumber', 'engineCode', 'engineManufacturerId');
                    }
                    $.setParamsFromHash('goResults', true);
                    break;
                case 'engineNumber':
                    unsetParamList.push('manufacturerId', 'vehicleModelId', 'vehicleTypeId', 'familyId', 'fm', 'box', 'supplierId', 'genericId', 'goResults');
                    break;
                case 'page':
                case 'refhash':
                case 'reffam':
                case 'refsup':
                case 'reffeat':
                    $.setParamsFromHash('goResults', true);
                    unsetParamList.splice($.inArray('referenceTypeId', unsetParamList), 1);
                    unsetParamList.splice($.inArray('referenceNum', unsetParamList), 1);
                    unsetParamList.splice($.inArray('page', unsetParamList), 1);
                    break;
            }
            if (unsetParamList.length > 0) {
                $.unsetParamsFromHash(unsetParamList.join(','));
            }
            $.setParamsFromHash(key, value);
        }
    }

    function updateSeries(e) {
        !$('div.modelosBox').hasClass('collapsed') || $('div.modelosBox').children('span.toggleButton').trigger('mousedown');

        $('#referenceAx').val('');
        $('#reftypeAx').val('-1');

        $(this).parent().addClass('selected').siblings().removeClass('selected');
        $('div.modelos tbody tr, div.tipos tbody tr').removeClass('rowSelected');
        $('div.modelos table, div.tipos table, div.motores table, div.motormodel table').fadeOut().remove()
        $('div.motores, div.motormodel, div.categorias, div.families').fadeOut(ANIM_SPEED);

        $('div.modelos').fadeIn(800).html('<div></div>');
        var productZone = $('div.searchTabs').tabs("option", "selected") + 1,
            marcaId = $(this).attr('data-manu-id'),
            marcaTxt = $(this).find('img').length ? $(this).find('img').attr('alt') : $(this).text();
        $('div.carInfo').fadeIn();
        $('span.cd1, span.cd2, span.cd3, span.fm1, span.fm2, span.rs1, span.rs2').empty();
        $('span.cd1').empty().attr('data-manu-id', marcaId).text(marcaTxt.toUpperCase());

        getModels(productZone, marcaId);

        //hoList.dialog('close'); //si es la ventana de seleccion de marca, se cierra
        e.preventDefault();
    }

    function getAxlesModels(pz, marcaId) {
        SetURLFor('manufacturerId', marcaId);
        $('div.modelos div').append('<table class="table tsort"><thead><tr><th>' + $.getResource('catalog_commons_model') + '</th><th class="date">' + $.getResource('catalog_commons_year') + ' <abbr title="' + $.getResource('catalog_commons_constructionLong') + '">' + $.getResource('catalog_commons_construction') + '</abbr></th></tr></thead><tbody></tbody></table>');

        $.myAJAX.getJSON($.getServicios("VehicleModelsListByManufacturer"), { productZone: pz, parentId: marcaId })
            .success(function (json) {
                var modelo = [];
                $.each(json, function (i, model) {
                    modelo[i] = '<tr data-model-id="' + model.Identifier + '"><td><span>' + model.Text + '</span></td><td>' + model.Year + '</td></tr>';
                });

                if (modelo.length === 0) {
                    $('div.modelos tbody').empty().append('<tr><td class="dataTables_empty" colspan="2"><strong>' + $.getResource('catalog_commons_no_models_manufacturer') + '</strong></td></tr>');
                } else {
                    $('div.modelos tbody').empty().append(modelo.join(''));
                    $('div.modelos tbody tr:even').addClass('odd');
                    initTableOrder($('div.modelos table'));

                    if ($.getParamsFromHash().vehicleModelId) {
                        var tr = $('div.modelos tbody tr[data-model-id="' + $.getParamsFromHash().vehicleModelId + '"]').last(),
                        scroll = tr.position().top - tr.parent().position().top;
                        tr.addClass('rowSelected').parents('div.dataTables_scrollBody').scrollTop(scroll);
                    } else {
                        if ($('div.modelos tbody tr.autoClick').length) {
                            $('div.modelos tbody tr.autoClick').children('td').first().trigger('click');
                        }
                    }
                    $('div.modelos tbody tr.autoClick').removeClass('autoClick');
                }
            })
            .error(function () {
                $('div.modelos tbody').empty().append('<tr><td class="dataTables_empty" colspan="2"><strong>' + $.getResource('catalog_commons_no_models_manufacturer') + '</strong></td></tr>');
            });
    }
    //Pide familias de Universal
    function populateUniversalFamilies() {
        $.myAJAX.getJSON($.getServicios("FamiliesForUniversalSearch"), {}, populateFamiliesListsUniversal);
        $('input.ui-autocomplete-input').val('');
    }
    //Pide los enlaces rápidos de universal (añadido 14-8-13)
    function populateUniversalQuickLinks(){
        $.myAJAX.getJSON($.getServicios("FamiliesHomeList"), { productZone: 7, vehicleTypeId: null })
            .success(function (json) {
                var familia = [];
                $.each(json, function (i, cat) {
                    familia[i] = '<li class="_25" data-familyId="' + cat.Identifier + '"><a href="#" title="' +
                    cat.Text + '">' + ((cat.Text.length <= 23) ? cat.Text : cat.Text.slice(0, 22) + '...') + '</a></li>';
                });

                if (familia.length !== 0){
                    $('#universalQuickLinks div ul').empty().append(familia.join(''));
                    $('#universalQuickLinks').show();
                }
            })
            .error(function () {
            });
    }
    //Carga lo select de Universal
    function populateFamiliesListsUniversal(data) {
        populateFamiliesLists(data, $('#selAcc'), $('#Accessories_1'), $('#Accessories_2'), $('#Accessories_3'), $('#Accessories_4'));
    }

    function populateFamiliesListsVehicles(data) {
        if (data["Families_1"].length) {
            $('div.modelosBox, div.motoresBox').each(function () {
                $(this).hasClass('collapsed') || $(this).children('span.toggleButton').trigger('mousedown');
            });
            populateFamiliesLists(data, $('#selFam'), $('#families_1'), $('#families_2'), $('#families_3'), $('#families_4'));
        } else {
            $('#gruposFamilias').stopLoading().prepend('<p class="noResults">' + $.getResource('catalog_commons_noFamiliesResults') + '</p>');
            $('div.modelosBox').hasClass('collapsed') && $('div.modelosBox').find('span.toggleButton').trigger('mousedown');
        }
        clearFamilySearchFilters();
        $('#selFam').show();
    }

    function populateQuickStartIcons(data) {
        var quickStartIcons = data;
        $('#divQuickStartIcons').hide();

        if (quickStartIcons != null) {
            $('#selFam').data('quickStartIcons', quickStartIcons);

            $.each(quickStartIcons, function (i, icon) {
                if (icon != null) {
                    var newLi = $(document.createElement("li"));

                    var newImg = $(document.createElement("img"));
                    newImg.attr({ src: '/Images/' + icon.Imagefilename, title: icon.IconDescription, alt: icon.IconDescription });
                    newImg.appendTo(newLi);

                    newLi.click(function () {
                        if ($(this).hasClass('selected')) {
                            $.setParamsFromHash({ iconFamily: -1 }); updateBreadCrumb({ iconFamily: -1 });
                            $(this).removeClass('selected');
                            $('#selFam').data('currentFamiliesList', $('#selFam').data('originalFamiliesList'));
                        } else {
                            $.setParamsFromHash({ iconFamily: newLi.index() }); updateBreadCrumb({ iconFamily: newLi.index() });
                            $(this).addClass('selected').siblings().removeClass('selected');
                            $('#selFam').data('currentFamiliesList', icon.RelatedFamilies);
                        }
                        reloadFamilies();
                    });

                    newLi.appendTo($('#quickStartIconsList'));
                }
            });
        }

        $('#divQuickStartIcons').show();
    }

    function reloadFamilies() {
        var list1 = $('#families_1');
        var list2 = $('#families_2');
        var list3 = $('#families_3');
        var list4 = $('#families_4');

        list1.empty();
        list2.empty();
        list3.empty();
        list4.empty();

        var emptyAndDefaultItemValue = $.getResource('catalog_commons_select');

        list1.loadSelectByData($('#selFam').data('currentFamiliesList').Families_1, emptyAndDefaultItemValue);
        list2.loadSelectByData($('#selFam').data('currentFamiliesList').Families_2, emptyAndDefaultItemValue);
        list3.loadSelectByData($('#selFam').data('currentFamiliesList').Families_3, emptyAndDefaultItemValue);
        list4.loadSelectByData($('#selFam').data('currentFamiliesList').Families_4, emptyAndDefaultItemValue);

    }

    function populateFamiliesLists(data, parentForm, list1, list2, list3, list4) {
        $('div.familyBoxes').children('div.familySearchFilter').find('strong').hide();
        var lists = [list1, list2, list3, list4];
        var emptyAndDefaultItemValue = $.getResource('catalog_commons_select'),
        familiesList = data;
        parentForm.data('originalFamiliesList', familiesList);
        parentForm.data('currentFamiliesList', familiesList);

        var filteredNames = [];
        var filteredData = [];
        $.each(data.FamiliesWithSynonyms, function () {
            if (filteredNames.indexOf(this.label) == -1) {
                filteredNames.push(this.label);
                filteredData.push(this);
            }
        });

        //cargar autocomplete
        $('div.familySearchFilter input').autocomplete({
            minLength: 3,
            source: filteredData,
            focus: function (event, ui) {
                $('input.ui-autocomplete-input').val(ui.item.label);
                return false;
            },
            select: function (event, ui) {
                if ($('.grupoAccesorios').is(':visible')) {
                    var option = $('.grupoAccesorios option[value="' + ui.item.value + '"]');
                    $('input.ui-autocomplete-input').val(option.text());
                } else {
                    var option = $('.grupoFamilias option[value="' + ui.item.value + '"]');
                    $('input.ui-autocomplete-input').val(option.text());
                }
                //TODO: Se comporta diferente cuando se pulsa Enter o se selecciona con el raton
                if (event.originalEvent.which != 13) {
                    $(this).parent().siblings('.btnNext').trigger('click');
                    //$('.searchFilterBtn.btnNext').trigger('click');
                }
                return false;
            }
        });

        parentForm.on('click keyup', 'select', function (e) {
            clearFamilySearchFilters(true);
            $('#flashMessage').empty().addClass('disabled');
            if (e.type == 'click' || (e.which >= 37 && e.which <= 40)) {
                var currentFamiliesList = parentForm.data('currentFamiliesList'),
                familyBox = parseInt($(this).attr('id').split('_')[1]);

                // Change familyBox children depending on value selected
                for (var i = familyBox + 1; i <= 4; i++) {
                    if ($(this).val() != -1) {
                        lists[i - 1].loadSelectByData(filterData(currentFamiliesList['Families_' + i], "ParentId_" + familyBox, parseInt($(this).val())), emptyAndDefaultItemValue);
                    } else {
                        for (var j = i - 1; j > 0; j--) {
                            var parentId = j,
                            parentValue = parseInt(lists[j - 1].val());
                            if (parentValue != -1) {
                                lists[i - 1].loadSelectByData(filterData(currentFamiliesList['Families_' + i], "ParentId_" + parentId, parseInt(lists[j - 1].val())), emptyAndDefaultItemValue);
                            } else if (parentId == 1) {
                                lists[i - 1].loadSelectByData(currentFamiliesList['Families_' + i], emptyAndDefaultItemValue);
                            }
                        }
                    }
                }
            }

        });

        list1.loadSelectByData(familiesList.Families_1, emptyAndDefaultItemValue);
        list2.loadSelectByData(familiesList.Families_2, emptyAndDefaultItemValue);
        list3.loadSelectByData(familiesList.Families_3, emptyAndDefaultItemValue);
        list4.loadSelectByData(familiesList.Families_4, emptyAndDefaultItemValue);
        $(parentForm).parent().stopLoading();
        $(parentForm).show();
        $(parentForm).find('select').scrollTop(0);


        parentForm.children('fieldset').children('select').off('change');
        parentForm.on('change', 'fieldset select', function () {
            var parentId = parseInt($(this).val()),
            familyBox = parseInt($(this).attr('id').split('_')[1]);

            parentForm.data('box', familyBox);

            // Change familyBox parents if value is selected
            if ($(this).val() != -1) {
                for (var i = familyBox - 1; i > 0; i--) {
                    lists[i - 1].focus().get(0).value = $(this).children().eq(this.selectedIndex).data('ParentId_' + i);
                }
            }
            $(this).focus();

            $('span.fm1, span.fm2').empty().attr('data-familyid', '');
            if ($(this).children('option:selected').index() != 0) {
                $('span.fm2').attr('data-familyid', $(this).val()).text($(this).children('option:selected').text());
                window.navData.fm = 0;
                window.navData.familyId = false;
            }

            if (($('#Accessories_1').val() == -1 || $('#Accessories_1').val() == null)) {
                $('#selAcc').find(':submit.btn').attr('disabled', 'disabled');
            } else {
                $('#selAcc').find(':submit.btn').removeAttr('disabled');
            }

            if (($('#families_1').val() == -1 || $('#families_1').val() == null)) {
                $('#selFam').find(':submit.btn').attr('disabled', 'disabled');
            } else {
                $('#selFam').find(':submit.btn').removeAttr('disabled');
            }

        });

        if (window.navData.box && window.navData.familyId) {
            if (window.navData.iconFamily >= 0) {
                $('#quickStartIconsList').children().eq(window.navData.iconFamily).trigger('click');
            }
            var str = '';
            var typeBox = '';
            var currentFamiliesList = parentForm.data('currentFamiliesList');
            if (parentForm.attr('id') == 'selAcc' && window.navData.fm == 3) {
                str = '#Accessories_' + window.navData.box;
                typeBox = '#Accessories_';
            } else if (parentForm.attr('id') == 'selFam' && window.navData.fm == 2) {
                str = '#families_' + window.navData.box;
                typeBox = '#families_';
            } else {
                return;
            }

            $(str).focus().get(0).value = window.navData.familyId;
            var level = window.navData.box;

            // Set FamilyBox parents
            for (var i = level - 1; i > 0; i--) {
                lists[i - 1].focus().get(0).value = $(str).children().eq($(str).get(0).selectedIndex).data('ParentId_' + i);
            }

            //Set FamilyBos children
            for (var i = parseInt(level) + 1; i <= 4; i++) {
                lists[i - 1].loadSelectByData(filterData(currentFamiliesList['Families_' + i], "ParentId_" + level, parseInt($(str).val())), emptyAndDefaultItemValue);
            }

            $(str).focus();
        }
    };

    function launchSchemaViewer(e) {
        var schemeList = $('p.esquemas').data(e.data.name);
        if (schemeList.length) {
            // Lista de enlaces a esquemas
            $('#schemaViewer').children('ul.schemeList').empty().append(schemeList.join(''));

            // Iframe para mostrar el esquema
            $('#schemaViewer').children('iframe').attr('src', '');

            // Lista de enlaces para la pieza seleccionada
            $('#schemaViewer').children('ul.schemeReferenceList').empty();

            // Controles de esquema
            $('#schemaViewer').children('div.schemeControls').children('span.zoomSlider').slider({
                min: 0.2,
                max: 1,
                step: 0.01,
                orientation: "vertical",
                slide: function (event, ui) {
                    _transform = 'scale(' + ui.value + ',' + ui.value + ')';

                    $('#schemaViewer').children('iframe').contents().find('html').css({
                        transform: _transform,
                        webkitTransform: _transform,
                        MozTransform: _transform,
                        msTransform: _transform,
                        oTransform: _transform
                    });
                }
            });

            $('#schemaViewer').children('div.schemeControls').on('mouseleave', function () {
                // Evita que el slider se quede pegado
                $('#schemaViewer').children('div.schemeControls').children('span.zoomSlider').trigger('mouseup');
            });

            $('#schemaViewer').dialog('option', 'title', $('div.carData span').text() + ' - ' + e.data.title);
            $('#schemaViewer').dialog('open');

            // Carga el primer esquema por defecto
            seeAllSchemes = false;
            $('#schemeFilterButtons').children('input').attr('disabled', false);

            $('#schemaViewer').children('ul.schemeList').children('li').children('a').first().trigger('click');
        }
        return false;
    }

    $('#schemeFilterButtons').children('input').on('click', function () {
        seeAllSchemes = true;
        currentSchemeId = $('#schemaViewer').children('ul.schemeList').children('li.current').children('a').attr('schemeId');
        loadScheme();
    });

    function getArticleSuppliersTecdoc(schemeId, type, seeAll) {
        $.myAJAX.getJSON($.getServicios("ArticlesScheme"), { schemeId: schemeId, schemeType: type, seeAll: seeAll })
            .success(function (json) {
                jsonArticleSchemeList = json;
                if (json.CanSeeAll && json.SeeAll) {
                    $('#schemeFilterButtons').children('input').attr('disabled', true);
                }
            })
    }

    function loadScheme() {
        $('#schemaViewer').children('ul.schemeReferenceList').empty();
        if (!seeAllSchemes) {
            currentSchemeId = $(this).attr('schemeId');
            currentSchemeType = $(this).attr('type');
            $('#schemeFilterButtons').children('input').attr('disabled', false);
            getArticleSuppliersTecdoc(currentSchemeId, currentSchemeType, seeAllSchemes);
            schemaURL = $(this).attr('href');
            $(this).parent().addClass('current').siblings().removeClass('current');
        }
        else {
            getArticleSuppliersTecdoc(currentSchemeId, currentSchemeType, seeAllSchemes);
            seeAllSchemes = false;
        }

        $('#schemaViewer').children('iframe').contents().find('body').empty();
        $('#schemaViewer').children('iframe').attr('src', schemaURL);

        $('#schemaViewer').children('div.schemeControls').hide();
        $('#schemeFilterButtons').hide();
        $('#schemaViewer').startLoading();
        $('#schemaViewer').children('img.loader').css({
            position: 'absolute',
            top: $('#schemaViewer').children('iframe').height() / 2 - 100 + 'px',
            left: $('#schemaViewer').children('iframe').width() / 2 + 110 + 'px'
        });
        return false;
    }

    function initScheme() {
        $('#schemaViewer').stopLoading();
        var origWidth = $(this).contents().width(),
        factor = Math.floor($(this).width() / (origWidth + 40) * 100) / 100,
        _transform = 'scale(' + factor + ',' + factor + ')';

        $(this).contents().find('html').css({
            transform: _transform,
            webkitTransform: _transform,
            MozTransform: _transform,
            msTransform: _transform,
            oTransform: _transform
        });

        $('#schemaViewer').children('div.schemeControls').show();
        $('#schemaViewer').children('div.schemeControls').children('span.zoomSlider').slider("option", "value", factor);
        $('#schemaViewer').children('div.schemeControls').children('a.newWindow').attr('href', $(this).attr('src'));

        $(this).show();
        $(this).contents().find('div.esquema').children('ul').on('click', 'li a', function (e) {
            lastPieceClicked = $(this).attr('temotId');
            $(this).parent().addClass('selected').siblings().removeClass('selected');
            loadArticleParts();
            return false;
        });

        currentSchemeId = $('#schemaViewer').children('ul.schemeList').children('li').children('a').first().attr('schemeId');
        currentSchemeType = $('#schemaViewer').children('ul.schemeList').children('li').children('a').first().attr('type');
        if (jsonArticleSchemeList != null && jsonArticleSchemeList.CanSeeAll && jsonArticleSchemeList.SeeAll) {
            loadArticleParts();
        }
        return false;
    }

    function loadArticleParts() {
        var _htmlRet = "";
        var temotId = lastPieceClicked;
        if (jsonArticleSchemeList.CanSeeAll) {
            if (!$('#schemaViewer').children('ul.schemeReferenceList').hasClass('schemeReferenceListFiltered')) {
                $('#schemaViewer').children('ul.schemeReferenceList').addClass('schemeReferenceListFiltered');
            }
            $('#schemeFilterButtons').show();
        }
        if (jsonArticleSchemeList != null) {
            $.each(jsonArticleSchemeList.List, function (i, item) {
                if (temotId == item.ArticleIdTemot.toString()) {
                    var detailLink = '/Catalog/Details?articleId={0}';
                    detailLink = detailLink.format(item.ArticleId);
                    _htmlRet += "<li><span class=\"temotLogoContainer\"><img class=\"temotLogo\" alt=\"" + item.SupplierName + "\" src=\"" + ((item.SupplierLogo != null && item.SupplierLogo != "") ? item.SupplierLogo : "/Images/100x100.gif") + "\"></span><span class=\"manufacturer\">" + item.SupplierName + "</span><span class=\"reference\">" + item.TecdocId + "</span><a target=\"_blank\" href=\"" + detailLink + "\">" + $.getResource('catalog_commons_go_detail') + "</a></li>";
                }
            });
            var resultsList = $('#schemaViewer').children('ul.schemeReferenceList');
            if (_htmlRet == "") {
                resultsList.empty().append('<p class="noResults">' + $.getResource('catalog_commons_no_results') + '</p>');
            }
            else {
                resultsList.empty().append(_htmlRet);
            }
        }
        return false;
    }

    function getSearchHash() {
        return window.SearchHash; //'c45de359f2f5495481b5e03095293f1b';
    }

    function setSearchHash(hash) {
        window.SearchHash = hash;
    }

    function getSearchKey() {
        return window.SearchKey;
    }

    function setSearchKey(key) {
        window.SearchKey = key;
    }

    function cleanSearchHash() {
        window.SearchHash = undefined;
    }

    function setNowRefined(isNowRefined) {
        window.IsNowRefined = isNowRefined;
    }

    function getNowRefined() {
        return window.IsNowRefined;
    }

    function cleanNowRefined() {
        window.IsNowRefined = undefined;
    }

    function clearFamilySearchFilters(keepText) {
        $('div.familyBoxes').children('div.familySearchFilter').find('input').data({
            currentSearch: '',
            matches: [],
            currentMatch: -1,
            iconFamily: -1
        }).siblings('span').hide();

        if (!keepText) {
            $('div.familyBoxes').children('div.familySearchFilter').find('input').val('');
        }
    }

    function clearFamilyGenericFilters() {
        $('#searchFilterSupplier').val(null);
        $('#searchFilterGeneric').val(null);
    }


    // Pedir datos de opciones de refinamiento
    function getRefineSearchOptions(getSelectedFromURL) {
        $('#refinatedSearchContainer').empty();
        $('#btnShowRefined').children("img.loadrefinedimage").show();
        $('#btnShowRefined input').hide();
        $('#btnShowRefined').attr('disabled', 'disabled');
        $.myAJAX.getJSON($.getServicios("RefinedSearchOptions"), { hash: getSearchHash(), key: getSearchKey() })
            .success(function (json) {
                if(json.Error)
                {
                    if(window.ErrorDoingRefinedSearch)
                        return;
                    $.setInfoDialog($.getResource('catalog_getRefined_error'), $.getResource('catalog_error_tittle'));
                    $('#btnShowRefined').children("img.loadrefinedimage").hide();
                    $('div.pagination').children('ul.ui-state-disabled').hide();
                    return;
                }

                drawRefinatedSearchOptions(json, getSelectedFromURL);
                if (getSelectedFromURL != undefined) {
                    var optionsSelected = getRefinedSearchOptionsSelectedFromURL();
                    drawTagsFromData(optionsSelected);
                };
                $('div.pagination').children('ul.pages').show();
                $('div.pagination').children('ul.ui-state-disabled').hide();

            }
        );
    }

    function drawRefinatedSearchOptions(data, getSelectedFromURL) {

        $('#btnShowRefined').children("img.loadrefinedimage").show();
        $('#btnShowRefined input').hide();
        $('#btnShowRefined').attr('disabled', 'disabled');
        $('#btnShowRefined').on('click', function () {
            if ($('#btnShowRefined').attr('disabled') == undefined) {
                showRefinedSearchOptions();
            }

        });

        $('#btnShowRefined input').on('click', function (e) {
            $(this).parent().trigger('click');
            e.preventDefault();
        });


        if (data != undefined && data.Suppliers != undefined && data.Suppliers.length > 0) {
            $('#searchFilterSupplier').empty();
            if (data.Suppliers.length > 1) {
                $('#searchFilterSupplier').append($('<option value="null">' + $.getResource('catalog_commons_select') + '</option>'));
            }
            $.each(data.Suppliers, function (i, suppliers) {
                $('<option value="' + suppliers.SupplierId + '">' + suppliers.SupplierName + '</option>').appendTo($('#searchFilterSupplier'));
            });
            if (data.Suppliers.length > 1) {
                $('#searchFilterSupplier').removeAttr('disabled');
            }
            var refSup = $.getParamsFromHash().refsup;
            if (refSup != undefined) {
                $('#searchFilterSupplier').val(refSup);
            }
        }

        if (data != undefined && data.Families != undefined && data.Families.length > 0) {
            $('#searchFilterGeneric').empty();
            if (data.Families.length > 1) {
                $('#searchFilterGeneric').append($('<option value="null">' + $.getResource('catalog_commons_select') + '</option>'));
            }
            $.each(data.Families, function (i, family) {
                $('<option value="' + family.FamilyId + '">' + family.FamilyName + '</option>').appendTo($('#searchFilterGeneric'));
            });
            if (data.Families.length > 1) {
                $('#searchFilterGeneric').removeAttr('disabled');
            }
            var refFam = $.getParamsFromHash().reffam;
            if (refFam != undefined) {
                $('#searchFilterGeneric').val(refFam);
            }
        }

        if (data != undefined && data.Features != undefined && data.Features.length > 0) {
            var datasourceobject = [];

            $.each(data.Features, function (i, family) {

                var featureFamilyId = family.FamilyId;
                $.each(family.Features, function (h, feature) {
                    var divToAdd;

                    if (feature.IsMultiple) {
                        divToAdd = getRefinatedSearchOptionsMultiple(featureFamilyId, feature.FeatureId, feature.FeatureName, feature.FeatureValues);
                    } else {
                        divToAdd = getRefinatedSearchOptionsSingle(featureFamilyId, feature.FeatureId, feature.FeatureName, feature.FeatureValues);
                    }

                    datasourceobject = autocompleteRefined.createAutompleteDataSource(datasourceobject, feature.IsMultiple, featureFamilyId, feature.FeatureId, feature.FeatureName, feature.FeatureValues);

                    $('#refinatedSearchContainer').append(divToAdd);
                });
            });

            autocompleteRefined.originalAutocompleteSource = datasourceobject.slice();

            var updatedatasource = autocompleteRefined.showHideAutocompleteOptionsByFamily();

            toggleRefinedSearchControls($('#searchFilterGeneric').val(), updatedatasource);
            //$('#refinementAutocomplete').autocomplete('options', 'source', datasourceobject);
        }

        var refinedSearchOptionsSelected;
        if (!getSelectedFromURL) {
            refinedSearchOptionsSelected = getRefinedSearchOptionsSelected(1);
        }
        else {
            refinedSearchOptionsSelected = getRefinedSearchOptionsSelectedFromURL();
            checkRefinedSearchOptionsSelected(refinedSearchOptionsSelected);
        }

        if (isRefinedOrPaginateOnly(refinedSearchOptionsSelected)) {
            $('#btnShowRefined input').attr('checked', 'checked');
        } else {
            $('#btnShowRefined input').removeAttr('checked');
        }

        $('#btnShowRefined').children("img.loadrefinedimage").hide();
        $('#btnShowRefined input').show();
    }

    function checkRefinedSearchOptionsSelected(options) {
        if (options.features.length >= 1){
            $.each(options.features, function (i, feat) {
                var id = feat.featureId;
                var values = feat.features;
                var element = $('#refinatedSearchContainer').children('[data-id = ' + id + ']');
                if (element.hasClass('refinatedSingle')) {
                    element.children('select').attr('value', feat.features[0]);
                }
                else if (element.hasClass('refinatedMultiple')) {
                    $.each(feat.features, function (i, f) {
                        element.children('ul').children('li').children('label').children('[data-value = "' + f + '"]').attr('checked', true);
                    });
                }
            });
        } else {
            cleanRefinedSearchOptions();
        }
    }

    function showHideRefinedOptionByFamily() {
        var familyComboValue = $('#searchFilterGeneric').children("option:selected").val();
        var familyId = (familyComboValue != "null" && familyComboValue != '' && familyComboValue != undefined) ? familyComboValue : undefined;
        $('#refinatedSearchContainer').children('div').not('[data-familyid="' + familyId + '"]').removeClass('visibleOption').addClass('invisibleOption').hide();
        $('#refinatedSearchContainer').children('div').filter('[data-familyid="' + familyId + '"]').removeClass('invisibleOption').addClass('visibleOption').show();
        if ($('#refinatedSearchContainer').children('div.visibleOption').length <= 0) {
            $('#btnShowRefined').attr('disabled', 'disabled');
        }
    }

    function showRefinedSearchOptions() {

        var buttonRefineText = $.getResource('catalog_commons_filter');
        var buttonCancelText = $.getResource('catalog_commons_close');
        var buttonCleanText = $.getResource('catalog_commons_clean');
        var refinedTitle = $.getResource('catalog_refinedoptions_title');
        var buttons = {};

        showHideRefinedOptionByFamily();

        buttons[buttonRefineText] = function () { $(this).dialog("close"); doRefinedSearch(); };
        buttons[buttonCleanText] = function () { cleanRefinedSearchOptions(); };
        buttons[buttonCancelText] = function () { $(this).dialog("close"); };

        var widthDivs = 240;
        var widthDivsMenor = 320;
        var widthContainer = 180;
        var elementsDivs = $('#refinatedSearchContainer').children('div.visibleOption').length;

        switch (elementsDivs) {
            case 0:
                $('#btnShowRefined').attr('disabled', 'disabled');
                return false;
            case 1:
                widthContainer = 320;
                break;
            case 2:
                widthContainer = 600;
                break;
            default:
                widthContainer = widthContainer + (3 * widthDivs);
        }
        var optionsDialog = {
            title: refinedTitle,
            modal: true,
            resizable: false,
            buttons: buttons,
            draggable: false,
            width: widthContainer,
            position: 'center',
            close: closeRefinedSearch,
            open: openRefinedSearch
        };

        window.OptionsDialog = optionsDialog;

        $.when($('#refinatedSearchContainer').dialog(optionsDialog))
        .done(function () {
            $.each($('#refinatedSearchContainer').children('div'), function () {
                $(this).css('width', widthDivs);
            })

            $.when(function () {
                if ($('#refinatedSearchContainer').find('.masonry-brick').length > 0) {
                    $('#refinatedSearchContainer').masonry('destroy').masonry({ itemSelector: '.visibleOption' });
                } else {
                    $('#refinatedSearchContainer').masonry({ itemSelector: '.visibleOption' });
                }
            }).done(function () {
                var heightContainer = $('#refinatedSearchContainer').height() >= 450 ? 450 : $('#refinatedSearchContainer').height();
                $('#refinatedSearchContainer').css({ height: heightContainer + 'px', minHeight: '' });
            });


        });
    }

    function getRefinatedSearchOptionsSingle(featureFamilyId, featureId, featureName, featureValues) {

        /*
        <div class="refinatedSingle" data-id="f1234">
        <label>Nombre Caracteristica</label>
        <select>
        <option value="18mm">18mm</option>
        <option value="20mm">20mm</option>
        <option value="25mm">25mm</option>
        <option value="35mm">35mm</option>
        </select>
        </div>
        */
        var featurediv = $('<div class="refinatedSingle" data-familyId="' + featureFamilyId + '" data-type="S" data-id="' + featureId + '" />');
        var featureLabel = $('<label>' + featureName + '</label>');
        var featureSelect = $('<select />');
        var featureValueDefault = $.getResource('catalog_commons_select');

        featureSelect.append($('<option value="-1">' + featureValueDefault + '</option>'));
        $.each(featureValues, function (i, featureValue) {
            featureSelect.append($('<option value="' + featureValue + '">' + featureValue + '</option>'));
        });

        featurediv.append(featureLabel);

        featurediv.append(featureSelect);

        return featurediv;

    }

    function getRefinatedSearchOptionsMultiple(featureFamilyId, featureId, featureName, featureValues) {
        /*
        <div class="refinatedMultiple" data-id="f1234">
        <label>Nombre Caracteristica</label>
        <ul>
        <li><input type="checkbox" data-value="v1234"></input><label>18mm</label></li>
        <li><input type="checkbox" data-value="v1235"></input><label>20mm</label></li>
        <li><input type="checkbox" data-value="v1236"></input><label>25mm</label></li>
        <li><input type="checkbox" data-value="v1237"></input><label>35mm</label></li>
        </ul>
        </div>


        */
        var featurediv = $('<div class="refinatedMultiple" data-familyId="' + featureFamilyId + '" data-type="M" data-id="' + featureId + '" />');
        var featureLabel = $('<label>' + featureName + '</label>');
        var featureUl = $('<ul />');

        $.each(featureValues, function (i, featureValue) {
            featureUl.append($('<li><label><input type="checkbox" data-value="' + featureValue + '"></input>' + featureValue + '</label></li>'));
        });

        featurediv.append(featureLabel);

        featurediv.append(featureUl);

        return featurediv;
    }

    function isRefinedOrPaginateOnly(refinedSearchOptionsSelected) {

        var isEmpty = !(refinedSearchOptionsSelected === undefined ||
                (
                    (refinedSearchOptionsSelected.features == undefined || refinedSearchOptionsSelected.features.lenght == undefined || refinedSearchOptionsSelected.features.lenght == 0) &&
                    (refinedSearchOptionsSelected.supplier == undefined || refinedSearchOptionsSelected.supplier == 'null') &&
                    (refinedSearchOptionsSelected.family == undefined || refinedSearchOptionsSelected.family == 'null')
                )
        );

        return isEmpty;
    }

    function doRefinedSearch(page, getOptionsFromURL) {
        var refinedSearchOptionsSelected;
        if (getOptionsFromURL) {
            refinedSearchOptionsSelected = getRefinedSearchOptionsSelectedFromURL();
        }
        else {
            refinedSearchOptionsSelected = getRefinedSearchOptionsSelected(page);
        }
        $('#flashMessage').hide();
        if (isRefinedOrPaginateOnly(refinedSearchOptionsSelected)) {
            $('#btnShowRefined input').attr('checked', 'checked');
        } else {
            $('#btnShowRefined input').removeAttr('checked');
        }

        $('div.pagination').empty();


        $('#resultados').children('ul').html($loading.clone());
        $('div.carInfo').addClass('ui-state-disabled');
        //pinta las etiquetas correspondientes
        drawTagsFromData(refinedSearchOptionsSelected);

        return makeRefinedSearchRequest(refinedSearchOptionsSelected);

    }

    //Llamada AJAX al servicio que devuelve la busqueda refinada
    //El segundo parametro identifica la busqueda por etiquetas
    function makeRefinedSearchRequest(params){
        window.ErrorDoingRefinedSearch = false;
        $.ajax("/Catalog/SearchArticlesByRefinedOptions", {
            type: 'POST',
            dataType: 'json',
            async: true,
            data: { datos: JSON.stringify(params) }
        }).done(function (articlesList) {
            if(articlesList.Error)
            {
                window.ErrorDoingRefinedSearch = true;
                //showFlashMessage(totalCount)
                //$.setInfoDialog($.getResource('Ha ocurrido un error realizando la búsqueda. No es posible mostrar resultados.'), $.getResource('Error inesperado'));
                 $('#resultados ul').empty().append('<li><strong>' + $.getResource('catalog_error_search') + '</strong></li>');
                return;
            }

            var familyId = $('div.carData').find('span.fm1, span.fm2').filter('[data-familyId!=""]').attr('data-familyid');
            var vehTypeId = $('div.carData').find('span.cd3').attr('data-tipo-id');
            var prodZone = $('div.carData').find('span.pz').attr('data-pz');
            var genericId = $.getParamsFromHash().reffam;
            var referenceTypeId = $('div.carData').find('span.rs2').attr('data-reference-type-id');
            var referenceNum = $('div.carData').find('span.rs1').attr('data-reference-text');

            if ((referenceTypeId == undefined || referenceTypeId == '') && referenceNum != undefined && referenceNum != '') {
                referenceTypeId = $.getParamsFromHash().referenceTypeId;
            }

            familyId = (familyId == '') ? undefined : familyId;
            vehTypeId = (vehTypeId == '') ? undefined : vehTypeId;
            prodZone = (prodZone == '') ? undefined : prodZone;
            referenceTypeId = (referenceTypeId == '') ? undefined : referenceTypeId;
            referenceNum = (referenceNum == '') ? undefined : referenceNum;

            articlesResultList = articlesList;

            drawListOfArticles(articlesList, familyId, vehTypeId, prodZone, referenceTypeId, referenceNum, window.navData.ShowAll, true);

            getArticlesFeatures(articlesList, prodZone, vehTypeId, genericId);

            if (articlesList != undefined && articlesList.TotalCount > 0) {
                getStockInformation(articlesList);
            }
            $('div.carInfo').children('input.breadCrumbBackButton').removeClass('disabled');

            $('div.pagination').children('ul.pages').show();
            $('div.pagination').children('ul.ui-state-disabled').hide();
            $('div.carInfo').removeClass('ui-state-disabled');

        }).fail(function () {
            $('div.carInfo').removeClass('ui-state-disabled');
            $('#resultados ul').empty().append('<li><strong>' + $.getResource('catalog_commons_no_articles_vehicle') + '</strong></li>');
        });
    }

    /*************************************************************************
    * Repinta las etiquetas seleccionadas a partir de los parametros de la URL
    *************************************************************************/
    function drawTagsFromData(tags){
        var refinedSearchOptionsSelected = tags;
        $('body').off('tagCreated.filterTags', '#tagcontainer');
        $('#tagcontainer .btn-tag').remove();
        //las opciones del dialogo tienen convertirse a la estructura del autocomplete
        var optionsFromDialog = autocompleteRefined.createAutoCompleteDataStructure(refinedSearchOptionsSelected);
        //se recupera el array original del autocomplete
        var autocompleteOriginalDataSource = autocompleteRefined.originalAutocompleteSource.slice();
        //se sacan los equivalentes seleccionadas en el dialogo del array del autocomplete
        $.each(optionsFromDialog, function(o, tag){
            var optionMatch = $.grep(autocompleteOriginalDataSource, function(e){ return e.featureId == tag.featureId && e.value == tag.value });
            if (optionMatch.length >= 1){
                $('#tagcontainer').filterTags().addTag(optionMatch[0].label, optionMatch[0].featureId + optionMatch[0].value, optionMatch[0]);
                autocompleteRefined.deleteFromAutocompleteSource(optionMatch[0]);
            }
        });

        $('body').on('tagCreated.filterTags', '#tagcontainer', onTagCreated);
    }

    function cleanRefinedSearchOptions(invisibleOnly) {

        $.each($('#refinatedSearchContainer').children((invisibleOnly) ? 'div.invisibleOption' : 'div').find("input"), function (i, itemchk) {
            $(this).removeAttr("checked")
        });

        $.each($('#refinatedSearchContainer').children((invisibleOnly) ? 'div.invisibleOption' : 'div').find("select"), function (i, itemselect) {
            $(this).children().first().attr("selected", "selected")
        });
    }

    function openRefinedSearch() {
        $(window).on('resize', function () {
            var optionsDialog = window.OptionsDialog;
            $('#refinatedSearchContainer').dialog('close');
            $.when($('#refinatedSearchContainer').dialog(optionsDialog))
                .done(function () {
                    $.each($('#refinatedSearchContainer').children('div'), function () {
                        $(this).css('width', 240);
                    })

                    if ($('#refinatedSearchContainer').find('.masonry-brick').length > 0) {
                        $('#refinatedSearchContainer').masonry('destroy').masonry({ itemSelector: '.visibleOption' })
                    } else {
                        $('#refinatedSearchContainer').masonry({ itemSelector: '.visibleOption' })
                    }
                });
        });
    }

    function closeRefinedSearch() {
        if ($('#refinatedSearchContainer').find('.masonry-brick').length > 0) {
            $('#refinatedSearchContainer').masonry('destroy').masonry({ itemSelector: '.visibleOption' })
        }

        window.OptionsDialog = undefined;

        $(window).off('resize');
    }

    function toggleRefinedSearchControls(familyId, autocompletesource) {
        if (familyId != 'null' && familyId != undefined) {
            //$('#tagcontainer').children('.btn-tag').remove();
            $('#btnShowRefined').removeAttr('disabled');
            if (autocompletesource.length > 0){
                autocompleteRefined.initAutocompleteComponent( $('#refinementAutocomplete'), autocompletesource );
                $('#autoCompContainer').fadeIn();//muestra el contenedor para el autocomplete
            } else {
                $('#autoCompContainer').fadeOut();
            }
            $('#tagcontainer').filterTags();//inicializa el plugin de etiquetas
        } else {
            $('#btnShowRefined').attr('disabled', 'disabled');
            $('#autoCompContainer').fadeOut();
            cleanRefinedSearchOptions();
        }
    }

    function getRefinedSearchOptionsSelected(page) {
        cleanRefinedSearchOptions(true);
        var features = [];
        $.each($('#refinatedSearchContainer').children('div'), function (i, featureItem) {
            var featureId = $(this).attr('data-id');
            var isMultiple;
            var featureValues = [];
            var addToList = false;
            if ($(this).attr('data-type') == "S") {
                var value = $(this).children('select').val()
                if (value != undefined && value != "null" && value != "" && value != "-1") {
                    featureValues.push(value);
                    addToList = true;
                }
                isMultiple = false;
            } else {
                $.each($(this).find("input"), function (i, itemchk) {
                    if (itemchk['checked']) {
                        featureValues.push(itemchk.attributes["data-value"].value);
                        addToList = true;
                    }
                });
                isMultiple = true;
            }
            if (addToList) {
                features.push({ featureId: featureId, isMultiple: isMultiple, features: featureValues });

            }
        });

        var supplier = $('#searchFilterSupplier option:selected').val();
        var family = $('#searchFilterGeneric option:selected').val();

        supplier = ((supplier != "null") ? supplier : undefined);
        family = ((family != "null") ? family : undefined);

        var refinedSearchOptionsSelected = {
            hash: getSearchHash(),
            features: features,
            supplier: supplier,
            family: family,
            page: ((page == undefined) ? 0 : page)
        };

        addRefinedSearchOptionsSelectedToURL(refinedSearchOptionsSelected);

        return refinedSearchOptionsSelected;
    }

    function getRefinedSearchOptionsSelectedFromURL() {
        var params = $.getParamsFromHash();
        var family = params.reffam;
        var supplier = params.refsup;
        var page = params.page;
        var chunks = [];
        var features = [];
        var reffeat = params.reffeat;
        if (reffeat != undefined) {
            chunks = reffeat.split('$$');
            if (chunks.length > 0) {
                var featureValues = [];
                $.each(chunks, function (i, feat) {
                    var id = feat.split('[[')[0];
                    var values = feat.split('[[')[1];
                    featureValues = values.split(']]')[0].split('||');
                    var isMultiple = values.split(']]')[1];
                    features.push({ featureId: id, features: featureValues, isMultiple: (isMultiple == 1) ? true : false });
                });
            }
        }

        var refinedSearchOptionsSelected = {
            hash: getSearchHash(),
            features: features,
            supplier: supplier,
            family: family,
            page: ((page == undefined) ? 0 : page)
        };

        return refinedSearchOptionsSelected;
    }

    function addRefinedSearchOptionsSelectedToURL(options) {

        $.unsetParamsFromHash('reffam');
        $.unsetParamsFromHash('refsup');
        $.unsetParamsFromHash('reffeat');
        if (options.family != undefined) {
            SetURLFor('reffam', options.family);
        }
        if (options.supplier != undefined) {
            SetURLFor('refsup', options.supplier);
        }
        SetURLFor('refhash', options.hash);
        if (options.features.length > 0) {
            var arrayFeatures = [];
            var features = '';
            $.each(options.features, function (i, feature) {
                var arrayValues = [];
                var values = '';
                $.each(feature.features, function (i, f) {
                    arrayValues.push(f);
                });
                values = arrayValues.join('||');
                var content = feature.featureId + '[[' + values + ']]' + (feature.isMultiple ? '1' : '0');
                arrayFeatures.push(content);
            });
            features = arrayFeatures.join('$$');
            SetURLFor('reffeat', features);
        }
    }

    function getArticlesFeatures(articlesList, productZone, vehicleType, generic) {
        var articles = "";

        $.each(articlesList.List, function (i, article) {
            articles += article.Identifier.toString() + ';';
        });
        $.myAJAX.getJSON("/Services/ArticlesFeatures", { articles: articles, productZoneId: productZone, vehicleTypeId: vehicleType, familyId: generic })
            .success(function (articlesFeatures) {
                fillArticleFeatures(articlesFeatures);
            })
           .error(function () {
           });
    }

    function fillArticleFeatures(articlesFeatures) {
        var featuresContent;
        var element;
        if (articlesFeatures != null) {
            $.each(articlesFeatures.List, function (i, article) {
                featuresContent = generateArticleFeaturesContent(article.Features);
                element = $('#articleResults li.recambio').filter('[data-articleId=' + article.Identifier + ']').find('div.description').find('p.featureList');
                element.hide().empty().append(featuresContent).fadeIn(ANIM_SPEED);
            });
        }
    }

    /****************************************************************************
    * Cuando se crea una etiqueta, debe actualizarse el dialogo con las opciones
    * de refinamiento y eliminarse la etiqueta del autocomplete
    * Devuelve un callback que tiene como parametro un objeto con la siguiente estructura
    *   Hay que crear un objeto de este tipo, donde una featureId puede llevar varios valores
    *   {
    *        "hash":"0655cad500574f9da1b64a6088282090",
    *        "features":
    *            [
    *                {
    *                    "featureId":"232",
    *                    "features":[
    *                        "Ventilación interna"
    *                    ]
    *                }
    *            ],
    *        "family":"82",
    *        "page":0
    *    }
    ****************************************************************************/
    function updateRefinedSearchControls(tags){
        var supplier = $('#searchFilterSupplier option:selected').val();
        var family = $('#searchFilterGeneric option:selected').val();
        var page = window.navData.page;
        var hash = getSearchHash();
        var tagSelected = {};
            tagSelected.hash = hash;
            tagSelected.supplier = ((supplier != "null") ? supplier : undefined);
            tagSelected.originFlag = 'tags';
            tagSelected.family = family;
            tagSelected.page = ( (page === undefined) ? 0 : page );
            tagSelected.features = [];

            if (tags.length >= 1 ){
                //para cada etiqueta se crea un objeto que se incorpora a features
                $.each(tags, function(i, tag){
                    var values = {};
                        values.features = [];

                    var featureInObject = $.grep( tagSelected.features, function(e){
                        return e.featureId == $(tag).data('originalTag')['featureId'];
                    });

                    if (featureInObject.length >= 1){
                        $.each(tagSelected.features, function(n, value){
                            if (value.featureId == $(tag).data('originalTag')['featureId']){
                                value.features.push($(tag).data('originalTag')['value']);
                            }
                        });
                    } else {
                        values.featureId = $(tag).data('originalTag')['featureId'];
                        values.features.push($(tag).data('originalTag')['value']);
                        tagSelected.features.push(values);
                    }
                });
            }
        return tagSelected;
    }

    //Listener para el borrado de etiquetas
    $('body').on('tagRemoved.filterTags', '#tagcontainer', onTagRemoved);

    function onTagRemoved (e, data){
        //tagId de la etiqueta eliminada = $(data).data('tagId');
        var refinedOptions = updateRefinedSearchControls($('.btn-tag').not(data));

        cleanRefinedSearchOptions();
        checkRefinedSearchOptionsSelected(refinedOptions);
        addRefinedSearchOptionsSelectedToURL(refinedOptions);
        autocompleteRefined.addToAutocompleteSource($(data).data('originalTag'));

        $('div.pagination').empty();

        $('#resultados').children('ul').html($loading.clone());
        $('div.carInfo').addClass('ui-state-disabled');
        makeRefinedSearchRequest(refinedOptions);
    }
    //Listener para la creacion de etiquetas
    $('body').on('tagCreated.filterTags', '#tagcontainer', onTagCreated);

    function onTagCreated(e, data) {
        //tagId de la etiqueta eliminada = $(data).data('tagId');
        //Se procesan las etiquetas para obtener el objecto que necesita la busqueda refinada
        var refinedOptions = updateRefinedSearchControls($('.btn-tag'));
        //Limpiamos todos los checks
        cleanRefinedSearchOptions();
        checkRefinedSearchOptionsSelected(refinedOptions);
        addRefinedSearchOptionsSelectedToURL(refinedOptions);

        $('div.pagination').empty();

        $('#resultados').children('ul').html($loading.clone());
        $('div.carInfo').addClass('ui-state-disabled');
        makeRefinedSearchRequest(refinedOptions);

    }
});
