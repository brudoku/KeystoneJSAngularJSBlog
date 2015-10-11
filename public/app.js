(function () {
var app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate'])
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
				'categories':{
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
			}
		})
		.state('topView.category',{
			url: '/category/:catName',
			views: {
				'categories':{
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
			}
		})
		.state('topView.single', {
			url: "/:slug/",
			views: {
				'categories':{
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
.service('PostsFactory', function(PostsAPI, $q, PostsCache) {
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
					deferred.resolve(postsCats);
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
.service('Utility', function(){
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
	return {getItem: getPrevNextItem}
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
.animation(".custom-js-animation", function ($timeout){
    return {
      animate: function(element, className, from, to, done){
        done();
      },
      enter: function (element, done){
        var i = 0;
        var animateFunc = function(){
          element.css({opacity: (i / 100)});
          i++;
          if (i <= 100){
            $timeout(animateFunc, 10);
          }else{
            done();
          }
        }
        animateFunc();
        return function (cancelled){
          if (cancelled){
            i = 100;
          }
        }
      },
      leave: function (element, done){
        var targetScale = 0.1;
        var animationSteps = 100;
        var i = animationSteps;
        var currScale = 1.0;
        var scaleDecPerStep = (currScale - targetScale) / animationSteps;
        var animateFunc = function (){
          element.css({
              opacity: (i / animationSteps),
              transform: "scale(" + currScale + ")"
            });
          currScale -= scaleDecPerStep;
          i--;
          if (i >= 0){
            $timeout(animateFunc, 250);
          }else{
            done();
          }
        }
        animateFunc();
        return function (cancelled){
          if (cancelled){
            i = 0;
          }
        }
      },
      move: function (element, done){
        done();
      },
      beforeAddClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetScale = 1.1;
          var animationSteps = 100;
          var currScale = 1.0;
          var scaleIncPerStep = (targetScale - currScale) / animationSteps;
          var animateFunc = function (){
            element.css({transform: "scale(" + currScale + ")"});
            currScale += scaleIncPerStep;
            i++;
            if (i <= animationSteps){
              $timeout(animateFunc, 10);
            }else{
              element.css({transform: "scale(" + targetScale + ")"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
          if (cancelled){
            i = animationSteps;
          }
        }
      },
      addClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetScale = 1.0;
          var animationSteps = 100;
          var currScale = 1.1;
          var scaleDecPerStep = (currScale - targetScale) / animationSteps;
          var animateFunc = function (){
            element.css({transform: "scale(" + currScale + ")"});
            currScale -= scaleDecPerStep;
            i++;
            if (i <= animationSteps){
              $timeout(animateFunc, 10);
            }else{
              element.css({transform: "scale(" + targetScale + ")"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
          if (cancelled){
            i = animationSteps;
          }
        };
      },
      beforeRemoveClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetMultiplier = 1.0;
          var animationSteps = 100;
          var currMultiplier = 0.0;
          var multIncPerStep = (targetMultiplier - currMultiplier) / animationSteps;
          var animateFunc = function (){
            element.css({
                "box-shadow": "0px 0px " +
                Math.round(15 * currMultiplier) + "px " +
                Math.round(5 * currMultiplier) + "px rgba(255, 0, 0, 0.75)"
              }
            );
            currMultiplier += multIncPerStep;
            i++;
            if (i <= animationSteps){
              $timeout(animateFunc, 10);
            }else{
              element.css({"box-shadow": "0px 0px 15px 5px rgba(135, 206, 250, 0.75)"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
          if (cancelled){
            i = animationSteps;
          }
        }
      },
      removeClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetMultiplier = 0.0;
          var animationSteps = 100;
          var currMultiplier = 1.0;
          var multDecPerStep = (currMultiplier - targetMultiplier) / animationSteps;
          var animateFunc = function (){
            element.css({
                "box-shadow": "0px 0px " +
                Math.round(15 * currMultiplier) + "px " +
                Math.round(5 * currMultiplier) + "px rgba(135, 206, 250, 0.75)"
              });

            currMultiplier -= multDecPerStep;
            i++;

            if (i <= animationSteps){
              $timeout(animateFunc, 10);
            }else{
              element.css({"box-shadow": "none"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
	        if (cancelled){
	            i = animationSteps;
          	}
        }
      }
    }
  })
.animation(".cunt-js-animation", function ($timeout){
    return {
      animate: function(element, className, from, to, done){
        done();
      },
      enter: function (element, done){
        var i = 0;
        var animateFunc = function(){
          element.css({opacity: (i / 100)});
          i++;
          if (i <= 100){
            $timeout(animateFunc, 1);
          }else{
            done();
          }
        }
        animateFunc();
        return function (cancelled){
          if (cancelled){
            i = 100;
          }
        }
      },
      leave: function (element, done){
        var targetScale = 0.1;
        var animationSteps = 100;
        var i = animationSteps;
        var currScale = 1.0;
        var scaleDecPerStep = (currScale - targetScale) / animationSteps;
        var animateFunc = function (){
          element.css({
              opacity: (i / animationSteps),
              transform: "scale(" + currScale + ")"
            });
          currScale -= scaleDecPerStep;
          i--;
          if (i >= 0){
            $timeout(animateFunc, 1);
          }else{
            done();
          }
        }
        animateFunc();
        return function (cancelled){
          if (cancelled){
            i = 0;
          }
        }
      },
      move: function (element, done){
        done();
      },
      beforeAddClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetScale = 1.1;
          var animationSteps = 100;
          var currScale = 1.0;
          var scaleIncPerStep = (targetScale - currScale) / animationSteps;
          var animateFunc = function (){
            element.css({transform: "scale(" + currScale + ")"});
            currScale += scaleIncPerStep;
            i++;
            if (i <= animationSteps){
              $timeout(animateFunc, 1);
            }else{
              element.css({transform: "scale(" + targetScale + ")"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
          if (cancelled){
            i = animationSteps;
          }
        }
      },
      addClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetScale = 1.0;
          var animationSteps = 100;
          var currScale = 1.1;
          var scaleDecPerStep = (currScale - targetScale) / animationSteps;
          var animateFunc = function (){
            element.css({transform: "scale(" + currScale + ")"});
            currScale -= scaleDecPerStep;
            i++;
            if (i <= animationSteps){
              $timeout(animateFunc, 1);
            }else{
              element.css({transform: "scale(" + targetScale + ")"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
          if (cancelled){
            i = animationSteps;
          }
        };
      },
      beforeRemoveClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetMultiplier = 1.0;
          var animationSteps = 100;
          var currMultiplier = 0.0;
          var multIncPerStep = (targetMultiplier - currMultiplier) / animationSteps;
          var animateFunc = function (){
            element.css({
                "box-shadow": "0px 0px " +
                Math.round(15 * currMultiplier) + "px " +
                Math.round(5 * currMultiplier) + "px rgba(135, 206, 250, 0.75)"
              }
            );
            currMultiplier += multIncPerStep;
            i++;
            if (i <= animationSteps){
              $timeout(animateFunc, 1);
            }else{
              element.css({"box-shadow": "0px 0px 15px 5px rgba(135, 206, 250, 0.75)"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
          if (cancelled){
            i = animationSteps;
          }
        }
      },
      removeClass: function (element, className, done){
        if (className == "box-border"){
          var i = 0;
          var targetMultiplier = 0.0;
          var animationSteps = 100;
          var currMultiplier = 1.0;
          var multDecPerStep = (currMultiplier - targetMultiplier) / animationSteps;
          var animateFunc = function (){
            element.css({
                "box-shadow": "0px 0px " +
                Math.round(15 * currMultiplier) + "px " +
                Math.round(5 * currMultiplier) + "px rgba(135, 206, 250, 0.75)"
              });

            currMultiplier -= multDecPerStep;
            i++;

            if (i <= animationSteps){
              $timeout(animateFunc, 1);
            }else{
              element.css({"box-shadow": "none"});
              done();
            }
          }
          animateFunc();
        }else{
          done();
        }
        return function (cancelled){
	        if (cancelled){
	            i = animationSteps;
          	}
        }
      }
    }
  })
.run(['$state', 'postsHandler', 'PostsFactory', function($state) {
	$state.go('topView.posts');
}]);
function nav($stateParams, postTitlesCats, postsHandler) {
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
function postsView($stateParams, postTitlesCats, $scope, $rootScope, $animate, $timeout) {
	var postsView = this;
	postsView.currentCat = $stateParams.catName ? $stateParams.catName : 'index';
	postsView.categories = _.uniq(_.pluck(postTitlesCats,'category'));
	var catParam = $stateParams.catName ? $stateParams.catName.toLowerCase() : null;
	if(!catParam){
		postsView.posts = postTitlesCats;
	}else{
		postsView.posts = _.filter(postTitlesCats, function(post){
			return post.category == catParam;
		});
	}
	$scope.reverse = function(){
		postsView.posts.reverse();
	}
	$scope.pop = function(){
		postsView.posts.pop();
	}
	$scope.addClass = function(){
		_.each(postsView.posts, function(p){
			p.cust = 'bs'
		})
	}
	$scope.removeClass = function(){
		_.each(postsView.posts, function(p){
			p.cust = ''
		})
	}
   $scope.animationState = "OFF";
    var currAnimationPromise = null;
    $scope.onStartAnimationClick = function(){
      var animatedBoxParent = document.querySelector("#animatedBoxParent");
      if (animatedBoxParent !== null){
        animatedBoxParent = angular.element(animatedBoxParent);
        var animatedBox = angular.element("<div id=\"animatedBox\" class=\"box second cunt-js-animation\"></div>");
        var animationStep1 = function(){
          $scope.animationState = "In progress (step 1 - ENTER)...";
          currAnimationPromise = $animate.enter(animatedBox, animatedBoxParent);

          currAnimationPromise.then(
            function(){
                $timeout(animationStep2, 20);
            }
          );
        };
        var animationStep2 = function(){
          $scope.animationState = "In progress (step 2 - ADD CLASS)...";
          currAnimationPromise = $animate.addClass(animatedBox, "box-border");
          currAnimationPromise.then(
            function(){
                $timeout(animationStep3, 20);
            }
          );
        };
        var animationStep3 = function(){
          $scope.animationState = "In progress (step 3 - REMOVE CLASS)...";
          currAnimationPromise = $animate.removeClass(animatedBox, "box-border");
          currAnimationPromise.then(
            function(){
                $timeout(animationStep4, 20);
            }
          );
        };
        var animationStep4 = function(){
          $scope.animationState = "In progress (step 4 - LEAVE)...";
          currAnimationPromise = $animate.leave(animatedBox);
          currAnimationPromise.then(
            function(){
                currAnimationPromise = null;
                $scope.animationState = "ENDED";
            }
          );
        };
        animationStep1();
      }
    }
}
function singleView($scope, postTitlesCats, singlePost, $sce, $ocLazyLoad, Utility, postsHandler, $animate, $timeout, $rootScope) {
	$rootScope.$on('$stateChangeStart', function(evt, toState, toParams, fromState, fromParams){
		$scope.onStartAnimationClick();
		//log('evt');log(evt);log('toState');log(toState);log('toParams');log(toParams);log('fromState');log(fromState);log('fromParams');log(fromParams);
		});
	var postsInCategoryOrder = _.filter(postTitlesCats, function(post){
		var cat = postsHandler.getCategoryBySlug(postTitlesCats, singlePost.slug).category;
		return post.category == cat;
	});
	var postIndex = _.indexOf(_.pluck(postsInCategoryOrder, 'title'), singlePost.title);
	var singleView = this;
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
	singleView.hasImage = function(postImage) {
		return (postImage == undefined ? false : true)
	}
   $scope.animationState = "OFF";
    var currAnimationPromise = null;
    $scope.onStartAnimationClick = function(){
      var animatedBoxParent = document.querySelector(".single-nav");
      if (animatedBoxParent !== null){
        animatedBoxParent = angular.element(animatedBoxParent);
        var animatedBox = angular.element("<div id=\"animatedBox\" class=\"box cunt-js-animation\"></div>");
        var animationStep1 = function(){
          $scope.animationState = "In progress (step 1 - ENTER)...";
          currAnimationPromise = $animate.enter(animatedBox, animatedBoxParent);

          currAnimationPromise.then(
            function(){
                $timeout(animationStep2, 20);
            }
          );
        };
        var animationStep2 = function(){
          $scope.animationState = "In progress (step 2 - ADD CLASS)...";
          currAnimationPromise = $animate.addClass(animatedBox, "box-border");
          currAnimationPromise.then(
            function(){
                $timeout(animationStep3, 20);
            }
          );
        };
        var animationStep3 = function(){
          $scope.animationState = "In progress (step 3 - REMOVE CLASS)...";
          currAnimationPromise = $animate.removeClass(animatedBox, "box-border");
          currAnimationPromise.then(
            function(){
                $timeout(animationStep4, 20);
            }
          );
        };
        var animationStep4 = function(){
          $scope.animationState = "In progress (step 4 - LEAVE)...";
          currAnimationPromise = $animate.leave(animatedBox);
          currAnimationPromise.then(
            function(){
                currAnimationPromise = null;
                $scope.animationState = "ENDED";
            }
          );
        };
        animationStep1();
      }
    };
    $scope.onCancelAnimationStepClick = function(){
      if (currAnimationPromise !== null){
        $animate.cancel(currAnimationPromise);
        currAnimationPromise = null;
      }
    };
}
function log(msg) {	console.log(msg)}
})();