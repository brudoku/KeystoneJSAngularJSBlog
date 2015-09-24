var app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate', 'anim-in-out']);

app.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('posts', {
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl',
			resolve: {
				postTitleData: function(PostsFactory){
					return PostsFactory.postCatFn();
				}
			}
		})
		.state('categories', {
			url: "/category/:categoryId",
			templateUrl: '/components/home/homeView.html',
			controller: 'CategoryViewCtrl',
			resolve: {
				postData: function(PostsAPI) {
					return PostsAPI.postsFn();
				},
				postTitleData: function(PostsFactory){
					return PostsFactory.postCatFn();
				},
				categoryData: function(PostsAPI) {
					return PostsAPI.catsFn();
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
				postTitleData: function(PostsFactory){
					return PostsFactory.postCatFn();
				}
			}
		})
});

app.controller('PostViewCtrl', function($scope, postTitleData) {
	$scope.posts = postTitleData;
});

app.controller('SingleViewCtrl', function($scope, postTitleData, singlePost, $sce, $ocLazyLoad, Utility) {
	var postId = _.indexOf(_.pluck(postTitleData, 'title'), singlePost.title);
	$scope.title = $sce.trustAsHtml(singlePost.title);
	$scope.content = $sce.trustAsHtml(singlePost.content.extended);
	$scope.image = singlePost.image ? singlePost.image.url : undefined;
	$scope.scriptUpload = singlePost.scriptUpload;
	$scope.template = $sce.trustAsHtml(singlePost.templates);

	$scope.prev = Utility.getItem().getPrev(postTitleData, postId);
	$scope.next = Utility.getItem().getNext(postTitleData, postId);

	$scope.usesTemplates = function() {
		return true
	}

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
		return (postImage == '' ? false : true)
	}
});

app.controller('CatCtrl', function($scope, $http, PostsFactory) {
	log('CatCtrl')
	PostsFactory.postCatFn().then(function(postTitleData) {
		$scope.categories = _.uniq(_.pluck(postTitleData,'category'));
	});
});

app.controller('CategoryViewCtrl', function($scope, postTitleData, $stateParams) {
	$scope.posts = _.filter(postTitleData, function(elem) {
		return elem.category == $stateParams.categoryId.toLowerCase();
	});
});

app.service('PostsFactory', function(PostsAPI, $q) {
	var getPostTitlesAndCat = function(){
		return function(){
			var deferred = $q.defer();
			PostsAPI.postTitlesFn()
				.then(function(postData){
					return postData
				})
				.then(function(postData){
					PostsAPI.catsFn().then(function(categoryData){
						var postsCats = _.filter(_.map(postData, function(post, index) {
							var catName = _.filter(categoryData, function(cat) {
								return post.category == cat._id})[0].key;
							post.category = catName;
							return post;
						}));
						deferred.resolve(postsCats);
					})
				})
			return deferred.promise;
		}()
	}
	var getSinglePost = function(postId){
		return function(){
			var deferred = $q.defer();
			PostsAPI.singlePostFn(postId)
				.then(function(singlePost){
					PostsAPI.catsFn().then(function(categories){
						var postCat =  _.find(categories, function(cat){
							return singlePost.categories[0] == cat._id;
						})
						singlePost.categories = postCat.key;
						deferred.resolve(singlePost);
					})
				})
			return deferred.promise;
		}();
	}
	return {postCatFn: getPostTitlesAndCat,
			singlePostFn: getSinglePost}
})

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

app.service('PostsAPI', function($http, $q, $timeout, $cacheFactory) {
	var getPosts = function() {
		return function() {
			var deferred = $q.defer();
			$http({url:'/api/post/list',
				cache: true
			}).then(function(response) {
				deferred.resolve(response.data)
			});
			return deferred.promise;
		}();
	}
	var getCats = function() {
		return function() {
			var deferred = $q.defer();
			$http.get('/api/getCategories').then(function(response) {
				deferred.resolve(response.data)
			});
			return deferred.promise;
		}();
	}
	var getSingle = function(postId) {
		return function() {
			var deferred = $q.defer();
			$http.get('/api/post/' + postId).then(function(response) {
				deferred.resolve(response.data)
			});
			return deferred.promise
		}();
	}
	var getPostTitles = function() {
		return function() {
			var deferred = $q.defer();
			$http.get('/api/post/getPostTitles').then(function(response) {
				deferred.resolve(response.data)
			});
			return deferred.promise
		}();
	}
	return {
		postsFn: getPosts,
		catsFn: getCats,
		singlePostFn: getSingle,
		postTitlesFn: getPostTitles
	}
});

app.run(['$state', function($state) {
	$state.go('posts');
}]);

function log(msg) {
	console.log(msg)
}