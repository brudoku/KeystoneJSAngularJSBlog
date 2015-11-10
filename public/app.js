(function () {
 app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate'])
.config(function config($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('topView',{
			abstract: true,
			url: '',
			templateUrl: '/components/home/main.html'
		})
		.state('topView.posts',{
			url: '/',
			views: {
				'menu':{
					templateUrl: '/components/home/categories.html',
					controller: 'NavCtrl as nav'
				},
				'posts':{
					templateUrl: '/components/home/posts.html',
					controller: 'PostsViewCtrl as postsView'
				}
			},
			resolve: {
				postTitlesCats: function(PostsFactory) {
					return PostsFactory.postCatFn();
				}
			},
			onEnter: function($timeout){
				var currentView  = '#postsUI';
				// var animatedBox = document.querySelector(currentView);
			},
			onExit: function(){
			}
		})
		.state('topView.filterPosts',{
			url: '/category/:catName',
			views: {
				'menu':{
					templateUrl: '/components/home/categories.html',
					controller: 'NavCtrl as nav'
				},
				'posts':{
					templateUrl: '/components/home/posts.html',
					controller: 'PostsViewCtrl as postsView'
				}
			},
			resolve: {
				postTitlesCats: function(PostsFactory) {
					return PostsFactory.postCatFn();
				}
			},
			onEnter: function($timeout){
				var currentView  = '#postsUI';
				// var animatedBox = document.querySelector(currentView);
			},
			onExit: function(){
			}
		})
		.state('topView.single', {
			url: "/:slug/",
			views: {
				'menu':{
					templateUrl: '/components/home/categories.html',
					controller: 'NavCtrl as nav',
					controllerAs: 'nav'
				},
				'single':{
					templateUrl: '/components/single/singleView.html',
					controller: 'SingleViewCtrl as singleView'
				}
			},
			resolve: {
				singlePost: function(PostsFactory, $stateParams) {
					 return PostsFactory.singlePostFn($stateParams.slug);
				},
				postTitlesCats: function(PostsFactory){
					return PostsFactory.postCatFn();
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
.service('PostsFactory', function(PostsAPI, $q, PostsCache, $timeout) {
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
					$timeout(function(){ deferred.resolve(postsCats)}, 500);
				});
			});
			return deferred.promise;
		}();
	}
	var getSinglePost = function(postId){
		return function(){
				var deferred = $q.defer();
				PostsAPI.singlePostFn(postId)
					.then(function(singlePost){
						PostsAPI.catsFn().then(function(categories){
							var postCat =  _.find(categories, function(cat){
								return singlePost.categories[0] == cat._id;
							});
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
.service('Utility', function($rootScope){
	var fromTo = {};
	$rootScope.$on('$stateChangeStart',	function(evt, toState, toParams, fromState, fromParams){
		fromTo.from = fromParams;
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
				cat: '',
				empty: true
			}
		}
		var getProps = function(post) {
			return {
				title: post.title,
				slug: post.slug,
				cat: post.cat
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
	function getSingleNavDirection(){
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
	  	return this
	}
	return {getItem: getPrevNextItem, getSingleNavDirection: getSingleNavDirection, operations: operations}
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
.animation(".post-anim", function ($timeout, Utility){
  return {
    animate: function(element, done){
      done();
    },
    enter: function (element, done){
		var $viewUI = $(element).find('.post');
		var categories = _.map($('.category-list li a'), function(item){
			var $item = $(item);
			return $item.data('cat-name')
		});
		var fromCatIndex;
		var toCatIndex;

	  	
		_.each(categories, function(item){
			if(Utility.getSingleNavDirection().toCat && Utility.getSingleNavDirection().toCat == item){
				toCatIndex = _.indexOf(categories,item);
			}
			if(Utility.getSingleNavDirection().fromCat && Utility.getSingleNavDirection().fromCat == item){
				fromCatIndex = _.indexOf(categories,item);
			}
		})

		// var goingRight = Utility.operations().isMovingRight(direction);
	 //  	var posNeg = _.partial(Utility.operations().posNeg, goingRight);
	  	
		$viewUI.snabbt({
			opacity: 1,
			fromOpacity: 0,
			duration: 200
		});
		$timeout(function(){
			done();
		},1000)
    },
    leave: function(element, done){
      var $viewUI = $(element).find('.post');
      $viewUI.snabbt({
      	rotation: [0, 0, 0],
        fromRotation: [0,Math.PI/2,0],
        opacity: 0,
        fromOpacity: 1,
        scale: [0.1,0.1],
        // position: [100,0,0],
        duration: 200}
       );
      $timeout(function(){
        done();
      },1000)
    }
  }
})
.animation(".single-anim", function ($timeout, Utility){
  return {
    enter: function (element, done){
      	var $viewUI = $(element).find('.single-ui');
		var direction;
		var distance = 100;
		var links = $('.left-nav, .right-nav');
      	var $leftNav = $(links[0]);
      	var $rightNav = $(links[1]);
		_.each(links, function(item){
			var $item = $(item);
			if(Utility.getSingleNavDirection().toSingle && Utility.getSingleNavDirection().toSingle == $item.data('slug')){
				direction = $item.data('direction');
			}
		});
		var goingRight = Utility.operations().isMovingRight(direction);
	  	var posNeg = _.partial(Utility.operations().posNeg, goingRight);

		/*
		$leftNav.snabbt({
			opacity: 1
			,
			fromOpacity: 0
			,
			duration: 200
			,
			fromScale: [0.1,0.1]
			,
			scale: [1,1]
			,
			position: [0,0,0]
			,
			fromPosition: [0,400,0]

		});
		$rightNav.snabbt({
			opacity: 1
			,
			fromOpacity: 0
			,
			duration: 200
			,
			fromScale: [0.1,0.1]
			,
			scale: [1,1]
			,
			position: [0,0,0]
			,
			fromPosition: [0,400,0]
		});*/

		$viewUI.snabbt({
			opacity: 1,
			fromOpacity: 0,
			duration: 200,
			fromScale: [0.1,0.1],
			scale: [1,1],
			rotation: [0, posNeg(2*Math.PI), 0],
			easing: 'easeOut',
			fromPosition: [posNeg(distance),0,0],
			position: [0,0,0]
		});
		$timeout(function(){
		done();
		},400)
    },
    addClass: function(element, className, done){

    },
    leave: function(element, done){
      	var $viewUI = $(element).find('.single-ui');
      	var leftNav = $(element).find('.left-nav');
      	var rightNav = $(element).find('.right-nav');
		var direction;

		$viewUI.snabbt({
			opacity: 0,
			fromOpacity: 1,
			duration: 200,
			scale: [0.5,0.5]
				// 	,
		  // easing: function(value) {
		  //   return value + 0.3 * Math.sin(2*Math.PI * value);
		  // }
		  // ,			position: [posY,0,0]
		});
		$timeout(function(){
		done();
		},400)
    }
  }
})
.run(['$state', 'postsHandler', 'PostsFactory', function($state) {
  $state.go('topView.posts');
}])
function postsView($scope, postTitlesCats, $stateParams, $rootScope, $timeout) {
  var postsView = this;
  // postsView.currentCat = $stateParams.catName ? $stateParams.catName : 'index';
  // postsView.categories = _.uniq(_.pluck(postTitlesCats,'category'));
  var catParam = $stateParams.catName ? $stateParams.catName.toLowerCase() : null;
  postsView.posts = !catParam ? postTitlesCats : _.filter(postTitlesCats, function(post){return post.category == catParam;});
}
function singleView($scope, postTitlesCats, singlePost, $sce, $ocLazyLoad, Utility, postsHandler, $timeout, $rootScope) {
  var postsInCategoryOrder = _.filter(postTitlesCats, function(post){
    var cat = postsHandler.getCategoryBySlug(postTitlesCats, singlePost.slug).category;
    return post.category == cat;
  });
  var postIndex = _.indexOf(_.pluck(postsInCategoryOrder, 'title'), singlePost.title);
  var singleView = this;
  singleView.hasImage = function(postImage) {return (postImage == undefined ? false : true)}
  singleView.title = $sce.trustAsHtml(singlePost.title);
  singleView.content = $sce.trustAsHtml(singlePost.content.extended);
  singleView.image = singlePost.image ? singlePost.image.url : undefined;
  singleView.template = $sce.trustAsHtml(singlePost.templates);
  singleView.prev = Utility.getItem().getPrev(postsInCategoryOrder, postIndex);
  singleView.next = Utility.getItem().getNext(postsInCategoryOrder, postIndex);
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
}
function nav($scope, $stateParams, postTitlesCats, postsHandler, $element) {
	var nav = this;
	nav.posts = postTitlesCats;
	nav.categories = postsHandler.getCats(postTitlesCats);
	nav.isCategorySelected = function(cat){
		var currentCat = '';
		if($stateParams.slug){
			currentCat = postsHandler.getCategoryBySlug(postTitlesCats, $stateParams.slug).category == cat ? 'active' : '';
			return currentCat;
		} else {
			return $stateParams.catName == cat ? 'active' : '';
		}
	}
}
function log(msg) {	console.log(msg)}
})();