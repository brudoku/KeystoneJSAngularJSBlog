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

function postsView($stateParams, postTitlesCats) {
	var postsView = this;
	postsView.currentCat = $stateParams.catName ? $stateParams.catName : 'index';
	postsView.categories = _.uniq(_.pluck(postTitlesCats,'category'));
	var catParam = $stateParams.catName ? $stateParams.catName.toLowerCase() : null;
	if(!catParam){
		postsView.posts = postTitlesCats;
	}else{
		postsView.posts = _.map(postTitlesCats, function(post){
			post.category == catParam ? post.isCategorySelected = true : post.isCategorySelected = false;
			return post;
		});
	}
}

function singleView(postTitlesCats, singlePost, $sce, $ocLazyLoad, Utility, postsHandler) {
	var postsInCategoryOrder = _.filter(postTitlesCats, function(post){
		var cat = postsHandler.getCategoryBySlug(postTitlesCats, singlePost.slug).category;
		return post.category == cat;
	});
	var postIndex = _.indexOf(_.pluck(postsInCategoryOrder, 'title'), singlePost.title);
	log(singlePost.slug)
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
}

function log(msg) {	console.log(msg)}

})();