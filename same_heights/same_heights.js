var sameHeights = function ($list, elementsInRow) {
    var i, maxHeight,contentHeight;    

    for (i = 0; i < $list.length; i += elementsInRow) {
        var j = 0;
        maxHeight = 0;
        contentHeight = 0;
        for (j; j < elementsInRow; j++) {
            if (maxHeight < $list.eq(i + j).height()) {
                maxHeight = $list.eq(i + j).height();
            }    
        }
        j = 0;
        for (j; j < elementsInRow; j++) {
            $list.eq(i + j).height(maxHeight);
        }
    }

};
