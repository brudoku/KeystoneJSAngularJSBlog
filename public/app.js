(function () {
 app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate', 'plangular'])
.config(function config($stateProvider, $urlRouterProvider, plangularConfigProvider, $sceProvider) {
	$sceProvider.enabled(false);
	plangularConfigProvider.clientId = '84e9cf5d4eb301b3521fb5448ccf0535';
	$stateProvider
	.state('topView',{
		url: '',
		abstract: true,
		reload: false,
		templateUrl: '/components/home/main.html',
			controller: 'NavCtrl as nav',
			resolve: {
				postTitlesCats: function(PostHelper) {
					return PostHelper.postCatFn();
				}
			}
	})
	.state('topView.posts',{
		url: '/',
		views: {
			'posts':{
				templateUrl: '/components/home/posts.html',
				controller: 'PostsViewCtrl as postsView'
			}
		},
		resolve: {
			postTitlesCats: function(PostHelper) {
				return PostHelper.postCatFn();
			}
		}
	})
	.state('topView.filterPosts',{
		url: '/category/:catName',
		views: {
			'posts':{
				templateUrl: '/components/home/posts.html',
				controller: 'PostsViewCtrl as postsView'
			}
		},
		resolve: {
			postTitlesCats: function(PostHelper) {
				return PostHelper.postCatFn();
			}
		}
	})
	.state('topView.single', {
		url: '/:slug/',
		views: {
			'single':{
				templateUrl: '/components/single/singleView.html',
				controller: 'SingleViewCtrl as singleView'
			}
		},
		resolve: {
			singlePost: function(PostHelper, $stateParams) {
				return PostHelper.singlePostFn($stateParams.slug);
			},
			postTitlesCats: function(PostHelper){
				return PostHelper.postCatFn();
			}
		}
	})
})
.controller('NavCtrl', nav)
.controller('PostsViewCtrl', postsView)
.controller('SingleViewCtrl', singleView)
.factory('PostsCache', function($cacheFactory){
	return $cacheFactory('cachedPosts')
})
.factory('hoverHighlightService', function($rootScope){
	var shared = {};
	shared.message = '';
	shared.menuActive = function(msg){
		this.message = msg;
		this.broadcastActive();
	}
	shared.broadcastActive = function(){
		$rootScope.$broadcast('broadcastActive');
	}
	shared.menuInactive = function(msg){
		this.message = msg;
		this.broadcastInactive();
	}
	shared.broadcastInactive = function(){
		$rootScope.$broadcast('broadcastInactive');
	}
	return shared;
})
.service('PostHelper', function(PostsAPI, $q, PostsCache, $timeout) {
	var getPostTitlesAndCat = function(){
		return function(){
			var deferred = $q.defer();
			PostsAPI.postTitlesFn().then(function(postData){
				PostsAPI.catsFn().then(function(categoryData){
					var postsCats = _.map(postData, function(post, index) {
						var catName = _.filter(categoryData, function(cat) {
							return post.category == cat._id})[0].key;
							var clone = _.clone(post);
						return _.extend(clone, {isCategorySelected: true, category: catName});
					});
					$timeout(function(){ deferred.resolve(postsCats)}, 100);
				});
			});
			return deferred.promise;
		}();
	}
	var getSinglePost = function(postId){
		return function(){
				var deferred = $q.defer();
				PostsAPI.singlePostFn(postId).then(function(singlePost){
						PostsAPI.catsFn().then(function(categories){
							var postCat =  _.find(categories, function(cat){
								return singlePost.categories[0] == cat._id;
							});
							singlePost.cat = postCat.name;
							(singlePost);
							deferred.resolve(singlePost);
						})
					})
				return deferred.promise;
		}();
	}
	return {postCatFn: getPostTitlesAndCat,
			singlePostFn: getSinglePost}
})
.service('PostsAPI', function($http, $q, PostsCache) {
	var getCats = function() {
		return function() {
			var deferred = $q.defer();
			var cache = PostsCache.get('catsCache');
			if(cache){
				deferred.resolve(cache);
			} else {
				var cache = PostsCache;
				$http.get('/api/getCategories').then(function(response) {
					cache.put('catsCache', response.data);
					deferred.resolve(response.data);
				});
			}
			return deferred.promise;
		}();
	}
	var getSingle = function(postId) {
		return function(){
			var deferred = $q.defer();
			var cache = PostsCache.get('singlePostCache-'+postId);
			if(cache && cache.slug == postId){
				deferred.resolve(cache)
			}else{
				var cache = PostsCache;
				$http.get('/api/post/' + postId).then(function(response) {
					cache.put('singlePostCache-'+postId, response.data);
					deferred.resolve(response.data)
				});
			}
			return deferred.promise;
		}();
	}
	var getPostTitles = function() {
		return function() {
			var deferred = $q.defer();
			var cache = PostsCache.get('postTitlesCache');
			if(cache){
				deferred.resolve(cache);
			} else {
				var cache = PostsCache;
				$http.get('/api/post/getPostTitles').then(function(response) {
					cache.put('postTitlesCache', response.data);
					deferred.resolve(response.data);
				});
			}
			return deferred.promise;
		}();
	}
	return {
		catsFn: getCats,
		singlePostFn: getSingle,
		postTitlesFn: getPostTitles
	}
})
.service('Utility', function($rootScope, $state){
	var fromTo = {};
	$rootScope.$on('$stateChangeStart',	function(evt, toState, toParams, fromState, fromParams){
		fromTo.fromSingle = fromParams.single;
		fromTo.toSingle = toParams.slug;
		fromTo.fromCat = fromParams.catName;
		fromTo.toCat = toParams.catName;
	});

	function getPrevNextItem(){
		var nextItem = function(list, currentIndex, defaultValue) {
			return getOrElse(list, currentIndex + 1, defaultValue);
		}
		var previousItem = function(list, currentIndex, defaultValue) {
			return getOrElse(list, currentIndex	- 1, defaultValue);
		}
		var getOrElse = function(list, index, defaultValue) {
			return isOutOfRange(list, index) ? defaultValue : list[index];
		}
		var isOutOfRange = function(list, index) {
			return index < 0 || index >= list.length;
		}
		var emptyPost = function() {
			return {
				title: '',
				slug: '',
				category: '',
				empty: true
			}
		}
		var getProps = function(post) {
			return {
				title: post.title,
				slug: post.slug,
				cat: post.category
			}
		}
		this.getPrev = function(postData, pId){
			return getProps(previousItem(postData, pId, emptyPost()));
		}
		this.getNext = function(postData, pId){
			return getProps(nextItem(postData, pId, emptyPost()));
		}
		return this;
	}
	function getNavDirection(){
		return fromTo;
	}
	var operations = function(){
		this.isMovingRight = function(direction){
		    return function(){
		      return direction === 'right'
		    }
	  	}
		this.posNeg = function(condition, value){
			return condition.apply() ? value : -value;
		}
		this.getSingleDirection = function(){
			var links = $('.left-nav, .right-nav');
			var direction;
			_.each(links, function(item){
				var $item = $(item);
				if(getNavDirection().toSingle && getNavDirection().toSingle == $item.data('slug')){
					direction = $item.data('direction');
				}
			});
			return direction
		}
		this.getCatDirection = function(){
			var categories = _.map($('.category-list li a'), function(item){
				var $item = $(item);
				return $item.data('cat-name')
			});
			var fromCatIndex;
			var toCatIndex;
			_.each(categories, function(item){
				if(getNavDirection().toCat && getNavDirection().toCat == item){
					toCatIndex = _.indexOf(categories,item);
				}
				if(getNavDirection().fromCat && getNavDirection().fromCat == item){
					fromCatIndex = _.indexOf(categories,item);
				}
			})
			return toCatIndex > fromCatIndex ? 'right' : 'left';
		}
	  	return this
	}
	return {getItem: getPrevNextItem, getNavDirection: getNavDirection, operations: operations}
})
.service('postsHandler', function PostsHandler(){
	var postsHandler = this;
	postsHandler.getCats = function(postData){
		return _.uniq(_.pluck(postData,'category'))
	}
	postsHandler.getCategoryBySlug = function(postData, slug){
		return _.find(postData, function(post){
			return post.slug == slug;
		});
	}
})
.animation('.post-anim', function ($timeout, Utility){
  return {
    enter: function (element, done){
		var $viewUI = $(element).find('.post-ui');
		var goingRight = Utility.operations().isMovingRight(Utility.operations().getCatDirection());
	  	var posNeg = _.partial(Utility.operations().posNeg, goingRight);
	  	var distance = 50;
	    $viewUI.css('z-index',100);
		$viewUI.snabbt({
			easing:'easeIn',
			opacity: 1,
			fromOpacity: 0,
			fromPosition: [0,distance,0],
			position: [0,0,0],
			duration: 250
		});
		$timeout(function(){
			done();
		},500)
    },
    leave: function(element, done){
	    var $viewUI = $(element).find('.post-ui');
	    $viewUI.css('z-index',0);
		var goingRight = Utility.operations().isMovingRight(Utility.operations().getCatDirection());
		var posNeg = _.partial(Utility.operations().posNeg, goingRight);
	  	var distance = 100;
		$viewUI.snabbt({
			easing:'easeIn',
			rotation: [0, 0, 0],
			rotation: [0,0,0],
			opacity: 0,
			fromOpacity: 0.5,
			position: [0,distance,0],
			duration: 250
		});
		$timeout(function(){
		done();
		},1000)
    }
  }
})
.animation('.main-ui', function ($timeout, Utility){
  return {
    enter: function (element, done){
		var $posts = $(element).find('.post');
	  	var distance = 100;
	  	_.each($posts, function(el, index){
	  		var $el = $(el);
	  		var delay = (100 * index);
	  		$el.css('opacity', 0)
	  			.css('transform', 'rotateX(-90deg)');
	  		$timeout(function(){
	  			$el.css('opacity', 1);
	  			$el.css('transform', 'rotateX(0deg)');
	  		}, delay);
	  	})
		$timeout(function(){
			done();
		},500)
    },
    leave: function(element, done){
    	done();
    }
  }
})
.animation('.single-anim', function ($timeout, Utility){
  return {
    enter: function (element, done){
		var distance = 100;
		var goingRight = Utility.operations().isMovingRight(Utility.operations().getSingleDirection());
	  	var posNeg = _.partial(Utility.operations().posNeg, goingRight);
      	var $viewUI = $(element).find('.single-ui');
      	var $leftNav = $(element).find('.left-nav');
      	var $rightNav = $(element).find('.right-nav');
      	var navAnim = {
			opacity: 1,
			fromOpacity: 0,
			duration: 400,
			fromScale: [0.4,0.4],
			scale: [1,1]
		};
		$leftNav.snabbt(navAnim);
		$rightNav.snabbt(navAnim);
		$viewUI.snabbt({
			opacity: 1,
			fromOpacity: 0,
			duration: 200,
			fromScale: [0.8,0.8],
			scale: [1,1],
			fromPosition: [0,0,0],
			position: [0,0,0],
			easing: 'easeIn',
			position: [0,0,0]
		});
		$timeout(function(){
			done();
		},400)
    },
    leave: function(element, done){
		var distance = 100;
		var goingRight = Utility.operations().isMovingRight(Utility.operations().getSingleDirection());
	  	var posNeg = _.partial(Utility.operations().posNeg, goingRight);
      	var $viewUI = $(element).find('.single-ui');
      	var $leftNav = $(element).find('.left-nav');
      	var $rightNav = $(element).find('.right-nav');
		$leftNav.snabbt({
			opacity: 0,
			fromOpacity: 1,
			duration: 200,
			fromScale: [1,1],
			scale: [0.3,0.3]
		});
		$rightNav.snabbt({
			opacity: 0,
			fromOpacity: 1,
			duration: 200,
			fromScale: [1,1],
			scale: [0.3,0.3]
		});
		$viewUI.snabbt({
			opacity: 0,
			fromOpacity: 1,
			duration: 200,
			fromScale: [1,1],
			scale: [0.8,0.8],
			fromPosition: [0,0,0],
			position: [0,distance,0],
			easing: 'easeIn',
			position: [0,0,0]
		});
		$timeout(function(){
			done();
		},400);
    }
  }
})
.directive('highlightCategories', function(hoverHighlightService,$timeout){
	return {
        restrict: 'A',
        scope: {},
		link: function(scope, elem, attrs){
			$timeout(function(){
				var $cats = $(elem);
				var getCatElem = function(cat){
					return $cats.find('.'+cat).first();
				}
				scope.$on('broadcastActive', function(){
					var $elem = getCatElem(hoverHighlightService.message);
					$elem.addClass('active');
				});
				scope.$on('broadcastInactive', function(){
					var $elem = getCatElem(hoverHighlightService.message);
					$elem.removeClass('active');
				});
			},0);
		}
	}
})
.directive('animatedLine', function(){
	return{
		replace: true,
		scope: {lineTo:'@'},
		template: '<svg width="100%" height="1px" version="1.1"  ng-cloak xmlns="http://www.w3.org/2000/svg">' +
				  '<path id="theLine" d="M0 0 l {{lineTo}} 0" opacity="0" style="-webkit-tap-highlight-color: rgba(255, 0, 0, 0);" ' + 
				  'stroke-width="9" stroke="#f00" display="inline-block" fill="transparent"/></svg>',
				  // + '<filter id="pictureFilter" ><feGaussianBlur stdDeviation="5" /></filter></svg>',

		link: function(scope, elem, attr){
			var timerID;
			scope.lineTo = 700;
			/**scope.lineTo = attr.lineLength;
			get lineTo value from parent container..?*/
			function startTimer(count){
			  var self = this;
			  var incrementPath = pathUpdater.call(self, count);
				timerID = setInterval(incrementPath,10);
			}

			function stopTimer(){
			  	clearInterval(timerID);
			}

			function pathUpdater(count){
				return function(){
				  	count++;
				    setPathTo(count);
				}
			}

			function setPathTo(percent){
			    var path = $('#theLine').get(0);
			    var pathLen = path.getTotalLength();
			    var adjustedLen = percent * pathLen / 75;
			    path.setAttribute('stroke-dasharray', adjustedLen+' '+pathLen);
			    $('#theLine').css("opacity","1");
			    if(adjustedLen >= pathLen){
			    	stopTimer();
			    }
			}

			startTimer(0);
		}
	}
})
.run(['$rootScope', '$state', function($rootScope, $state) {
	//add state to rootscope for access to state
	$rootScope.$state = $state;
	$rootScope.browseByCat = true;
	$rootScope.browsingBy = $rootScope.browseByCat ? 'date' : 'category';
	$state.go('topView.posts');
}])
function postsView($scope, postTitlesCats, $stateParams, $rootScope, $timeout, hoverHighlightService) {
	var postsView = this;
	var catParam = $stateParams.catName ? $stateParams.catName.toLowerCase() : null;
	postsView.posts = !catParam ? postTitlesCats : _.filter(postTitlesCats, function(post){return post.category == catParam;});
	$scope.showCat = function(cat){
		hoverHighlightService.menuActive(cat);
	}
	$scope.hideCat = function(cat){
		hoverHighlightService.menuInactive(cat);
	}
}
function singleView($scope, postTitlesCats, singlePost, $sce, $ocLazyLoad, Utility, postsHandler, $timeout, $rootScope, $compile) {
	var singleView = this;
	singleView.title = $sce.trustAsHtml(singlePost.title);
	var content = $sce.trustAsHtml(singlePost.content.extended);
	singleView.content = $compile(content)($scope);
	// singleView.content = content;
	singleView.cat = $sce.trustAsHtml(singlePost.cat);
	singleView.image = singlePost.image ? singlePost.image.url : undefined;
	singleView.hasImage = function(postImage) {return (postImage == undefined ? false : true)};
	singleView.scriptUpload = singlePost.scriptUpload;
	if (singleView.scriptUpload) {
		var filesToLoad = _.map(singleView.scriptUpload, function(file) {
	  		return 'data/' + file.filename;
		})
		$ocLazyLoad.load([{
		  	files: filesToLoad,
		  	cache: false
		}]);
	}
	var postsInCategoryOrder = _.filter(postTitlesCats, function(post){
		var cat = postsHandler.getCategoryBySlug(postTitlesCats, singlePost.slug).category;
		return post.category == cat;
	});
	$scope.browseBy = function() {
		$rootScope.browseByCat = $rootScope.browseByCat === false ? true : false;
		$scope.postOrder = $rootScope.browseByCat ? postTitlesCats : postsInCategoryOrder;
		$rootScope.browsingBy = $rootScope.browseByCat ? 'date' : 'category';
		updateLinks($scope.postOrder);
	}
	var updateLinks = function(posts){
		var postIndex = _.indexOf(_.pluck(posts, 'title'), singlePost.title);
		singleView.prev = Utility.getItem().getPrev(posts, postIndex);
		singleView.next = Utility.getItem().getNext(posts, postIndex);
	}
	$scope.postOrder = $rootScope.browseByCat ? postTitlesCats : postsInCategoryOrder;
	updateLinks($scope.postOrder);
}
function nav($scope, $rootScope, postTitlesCats, postsHandler, hoverHighlightService) {
	var nav = this;
	nav.posts = postTitlesCats;
	nav.categories = postsHandler.getCats(postTitlesCats);
	nav.isCategorySelected = function(cat){
		var params = $rootScope.$state.params;
		var ret = '';
		if(params.slug){
			ret = postsHandler.getCategoryBySlug(postTitlesCats, params.slug).category == cat ? 'active' : '';
		} else {
			ret = params.catName == cat ? 'active' : '';
		}
		return ret;
	}
}
})();