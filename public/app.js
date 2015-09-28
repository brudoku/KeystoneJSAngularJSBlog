var app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate', 'anim-in-out']);

app.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('posts', {
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl',
			resolve: {
				postTitlesCats: function(PostsFactory){
					return PostsFactory.postCatFn();
				}
			}
		})
		.state('categories', {
			url: "/category/:categoryId",
			templateUrl: '/components/home/homeView.html',
			controller: 'CategoryViewCtrl',
			resolve: {
				postTitlesCats: function(PostsFactory){
					return PostsFactory.postCatFn();
				}
			}
		})
		.state('single', {
			url: "/:slug/",
			templateUrl: '/components/single/singleView.html',
			controller: 'SingleViewCtrl',
			resolve: {
				singlePost: function(PostsFactory, $stateParams) {
					 return PostsFactory.singlePostFn($stateParams.slug);
				},
				postTitlesCats: function(PostsFactory){
					return PostsFactory.postCatFn();
				}
			}
		})
});

app.controller('PostViewCtrl', function($scope, postTitlesCats) {
	$scope.posts = postTitlesCats;
});

app.controller('SingleViewCtrl', function($scope, postTitlesCats, singlePost, $sce, $ocLazyLoad, Utility) {
	var postId = _.indexOf(_.pluck(postTitlesCats, 'title'), singlePost.title);
	$scope.title = $sce.trustAsHtml(singlePost.title);
	$scope.content = $sce.trustAsHtml(singlePost.content.extended);
	$scope.image = singlePost.image ? singlePost.image.url : undefined;
	$scope.template = $sce.trustAsHtml(singlePost.templates);
	$scope.prev = Utility.getItem().getPrev(postTitlesCats, postId);
	$scope.next = Utility.getItem().getNext(postTitlesCats, postId);
	$scope.scriptUpload = singlePost.scriptUpload;
	if ($scope.scriptUpload) {
		var filesToLoad = _.map($scope.scriptUpload, function(file) {
			return 'data/' + file.filename;
		})
		$ocLazyLoad.load([{
			files: filesToLoad,
			cache: false
		}]);
	}
	$scope.hasImage = function(postImage) {
		return (postImage == undefined ? false : true)
	}

});

app.controller('CatCtrl', function($scope, $http, PostsFactory) {
	PostsFactory.postCatFn().then(function(postTitlesCats) {
		$scope.categories = _.uniq(_.pluck(postTitlesCats,'category'));
	});
});

app.controller('CategoryViewCtrl', function($scope, postTitlesCats, $stateParams) {
	$scope.posts = _.filter(postTitlesCats, function(elem) {
		return elem.category == $stateParams.categoryId.toLowerCase();
	});
});

app.service('PostsFactory', function(PostsAPI, $q, PostsCache) {
	var getPostTitlesAndCat = function(){
		return function(){
			if(PostsCache.get('postTitlesCatCache')){
				return PostsCache.get('postTitlesCatCache')
			}else{
				var cache = PostsCache;
				var deferred = $q.defer();
				PostsAPI.postTitlesFn()
					.then(function(postData){
						PostsAPI.catsFn().then(function(categoryData){
							var postsCats = _.filter(_.map(postData, function(post, index) {
								var catName = _.filter(categoryData, function(cat) {
									return post.category == cat._id})[0].key;
								post.category = catName;
								return post;
							}));
							cache.put('postTitlesCatCache',postsCats);
							deferred.resolve(postsCats);
						})
					})
				return deferred.promise;
			}
		}();
	}
	var getSinglePost = function(postId){
		return function(){
			var singlePostCache = PostsCache.get('singlePostCache-'+postId)
			if(singlePostCache && singlePostCache.slug == postId){
				return PostsCache.get('singlePostCache-'+postId)
			}else{
				var cache = PostsCache;
				var deferred = $q.defer();
				PostsAPI.singlePostFn(postId)
					.then(function(singlePost){
						PostsAPI.catsFn().then(function(categories){
							var postCat =  _.find(categories, function(cat){
								return singlePost.categories[0] == cat._id;
							})
							singlePost.categories = postCat.key;
							cache.put('singlePostCache-'+postId, singlePost);
							deferred.resolve(singlePost);
						})
					})
				return deferred.promise;
			}
		}();
	}
	return {postCatFn: getPostTitlesAndCat,
			singlePostFn: getSinglePost}
});

app.factory('PostsCache', function($cacheFactory){
	return $cacheFactory('cachedPosts')
});

app.service('PostsAPI', function($http, $q, PostsCache) {
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
			var cache = PostsCache.get('postTitlesCatCache');
			if(cache){
				deferred.resolve(cache);
			} else {
				var cache = PostsCache;
				$http.get('/api/post/getPostTitles').then(function(response) {
					cache.put('postTitlesCatCache', response.data);
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
});

app.service('Utility', function(){
	function getPrevNextItem(){
		var nextItem = function(list, currentIndex, defaultValue) {
			return getOrElse(list, currentIndex + 1, defaultValue);
		}
		var previousItem = function(list, currentIndex, defaultValue) {
			return getOrElse(list, currentIndex	-1, defaultValue);
		}
		var getOrElse = function(list, index, defaultValue) {
			return isOutOfRange(list, index) ? defaultValue : list[index];
		}
		var isOutOfRange = function(list, index) {
			return index < 0 || index >= list.length;
		}
		var emptyPost = function() {
			return {
				nextSlug: '',
				nextTitle: '',
				prevCat: ''
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
});

app.run(['$state', function($state) {
	$state.go('posts');
}]);

function log(msg) {	console.log(msg)}