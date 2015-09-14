// var spawnApp = angular.module('spawnApp', ['columnize']);
angular.module('columnize', []).directive('columnize', function($timeout) {
    return {
        restrict: 'A',
        scope:{},
        controller: function($scope, $element, $attrs) {
            console.log('init');
            $scope.col_count = $attrs.colCount || 3;
            $scope.col_width = $element.width() / $scope.col_count;
            $scope.elem_width = $element.width();
            $scope.openSize = $scope.col_count == 1 ? 1 : 0.7;
            $scope.currentElemIndex = 0;
            $scope.widths = {};
            $scope.heights = {};
            $scope.openElemHeight = 100;
            $scope.minimumHeight = 100;
            $scope.elems = [];
            this.init = function(){
                $scope.elems = $element.children().map(function(index, el) {
                    var $el = $(el);
                    var $this = $(this);
                    //init elems, place customization code here
                    $el.css('display', 'inline-block')
                        .css('margin-right', '0px')
                        .css('transition', 'all 500ms ')
                        .click(function() {
                            if( $scope.currentElemIndex == $(this).index()) return;
                            $scope.toggleItem($(this).index());
                        })
                        .children().first()
                        .css('text-overflow', 'clip')
                        .css('white-space', 'nowrap')
                        .css('overflow', 'hidden')
                    return $el;
                });
                $scope.elems.each(function(indx){
                    $scope.toggleItem(indx);
                })
                $scope.toggleItem(0);
            }

            function getOpenHeight($elem, content) {
                var $clone = $elem.clone();
                $clone.css('height', 'auto')
                    .find('div')
                    .css('display','inline-block')
                    .css('width', $scope.widths.item_open);
                $element.append($clone);
                var h = $($clone).height();
                $elem.css('height', h);
                $clone.remove();
                return h;
            }

            $scope.states = {
                'ITEM_OPEN': function(elemIndex) {
                    $scope.currentElemIndex = elemIndex;
                    $scope.elems[elemIndex]
                        .css('width', $scope.widths.item_open)
                        .css('height', $scope.openElemHeight)
                        .css('float', 'left')
                        .addClass('zoomInUp')
                        .children().first().next().fadeIn(1000);
                },
                'ROW_OPEN': function(elemIndex) {
                    $scope.elems[elemIndex]
                        .css('width', $scope.widths.row_open)
                        .css('height', $scope.openElemHeight)
                        .css('float', 'left')
                        .children().first().next().css('display','none');
                },
                'ROW_CLOSED': function(elemIndex) {
                    $scope.elems[elemIndex]
                        .css('width', $scope.widths.row_closed)
                        .css('height',$scope.minimumHeight)
                        .children().first().next().css('display','none');
                }
            }

            function setElemState(elemIndex, item_state) {
                if ($scope.states[item_state]) $scope.states[item_state](elemIndex);
            }

            function setOpenRow(elemIndex) {
                var from = Math.floor(elemIndex / $scope.col_count) * $scope.col_count;
                range(from, parseInt($scope.col_count, 10)).forEach(function(index) {
                    if (index >= $scope.elems.length) return;
                    setElemState(index, 'ROW_OPEN');
                });
            }

            function setClosedRow(elemIndex) {
                var from = Math.floor(elemIndex / $scope.col_count) * $scope.col_count;
                var openElemRowArray = range(from, parseInt($scope.col_count, 10));
                $scope.elems.each(function(index) {
                    if (openElemRowArray.indexOf(index) < 0) {
                        setElemState(index, 'ROW_CLOSED');
                    }
                });
            }

            $scope.setColumnWidths = function() {
                $scope.col_width = $scope.elem_width / $scope.col_count;
                var elemExpandedWidth = $scope.elem_width * parseFloat($scope.openSize);
                var rowExpandedWidth = ($scope.elem_width - elemExpandedWidth) / ($scope.col_count - 1);
                $scope.widths.item_open = elemExpandedWidth + 'px';
                $scope.widths.row_open = rowExpandedWidth + 'px';
                $scope.widths.row_closed = $scope.col_width + 'px';
            }

            function setOpenElemHeight(elemIndex) {
                var elemContent = $scope.elems[elemIndex].children().first().next().html();
                var elemOpenHeight = getOpenHeight($scope.elems[elemIndex], elemContent);
                $scope.openElemHeight = elemOpenHeight >= $scope.minimumHeight ? elemOpenHeight : $scope.minimumHeight;
            }

            $scope.toggleItem = function(elemIndex) {
                $scope.setColumnWidths();
                setOpenElemHeight(elemIndex);
                setOpenRow(elemIndex);
                setClosedRow(elemIndex);
                setElemState(elemIndex, 'ITEM_OPEN');
            }

            function range(start, count) {
                return Array.apply(0, Array(count)).map(function(el, index) {
                    return index + start;
                });
            }
            $scope.$watch('elem_width',function(newVal, oldVal) {
                $scope.toggleItem($scope.currentElemIndex);
            });

        },
        link: function(scope, element, attrs, controller) {
            controller.init();
            window.onresize = function() {
                scope.$apply(
                    function(scope){
                        log('1');
                        log('elwidth: '+element.width());
                        scope.col_width = element.width() / scope.col_count;
                        scope.setColumnWidths();
                        // return $scope.col_width
                    },
                    function(newValue, oldValue) {
                        log('2');
                        $scope.col_width = $element.width() / $scope.col_count;
                        $scope.elem_width = $element.width();
                })
            }
        }
    }
});

function log(str) {
    console.log(str)
}