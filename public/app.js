var app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate', 'anim-in-out']);

app.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('posts', {
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl',
			resolve: {
				categoryData: function(PostsAPI) {
					return PostsAPI.catsFn();
				},
				postTitleData: function(PostFactory){
					return PostFactory.postCatFn();
				}
			}
		})
		.state('categories', {
			url: "/category/:categoryId",
			templateUrl: '/components/home/homeView.html',
			controller: 'CatFilterCtrl',
			resolve: {
				postData: function(PostsAPI) {
					return PostsAPI.postsFn();
				},
				postTitleData: function(PostsAPI) {
					return PostsAPI.postTitlesFn();
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
				// singlePost: function(PostsAPI, $stateParams) {
				// 	return PostsAPI.singlePostFn($stateParams.slug);
				// },
				singlePost2: function(PostFactory, $stateParams) {
					return PostFactory.singlePostFn2($stateParams.slug);
				},				
				postData: function(PostsAPI) {
					return PostsAPI.postsFn();
				},
				categoryData: function(PostsAPI) {
					return PostsAPI.catsFn();
				}
			}
		})
});

app.controller('PostViewCtrl', function($scope, postTitleData) {
	$scope.posts  = postTitleData;
});

app.controller('SingleViewCtrl', function($scope, postData, singlePost2, categoryData, $sce, $ocLazyLoad) {
// log(singlePost2.post)
	$scope.posts = _.map(postData.posts, function(post, index) {
		var catName = _.filter(categoryData, function(cat) {
			return (post.categories[0] == cat._id)
		})[0].key;
		return _.extend(post, {
			catName: catName
		})
	});

	$scope.category = _.pluck(_.filter($scope.posts, function(post) {
		return post._id == singlePost2._id
	}), 'catName')[0];

	/*Get previous and next post title*/
	$scope.prevNext = {};
	var nextItem = function(list, currentIndex, defaultValue) {
		return getOrElse(list, currentIndex + 1, defaultValue);
	}
	var PreviousItem = function(list, currentIndex, defaultValue) {
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
	var postId = _.indexOf(_.pluck($scope.posts, '_id'), singlePost.post._id);
	$scope.prevNext.prev = getProps(PreviousItem($scope.posts, postId, emptyPost()));
	$scope.prevNext.next = getProps(nextItem($scope.posts, postId, emptyPost()));

	$scope.title = $sce.trustAsHtml(singlePost.post.title);
	$scope.content = $sce.trustAsHtml(singlePost.post.content.extended);
	$scope.image = singlePost.post.image ? singlePost.post.image.url : undefined;
	$scope.scriptUpload = singlePost.post.scriptUpload;
	// $scope.template = singlePost.post.contentTemplates || 'no template';
	$scope.template = $sce.trustAsHtml(singlePost.post.templates);

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

app.controller('CatCtrl', function($scope, $http, PostsAPI) {
	PostsAPI.catsFn().then(function(res) {
		$scope.categories = _.pluck(res, 'name');//['code', 'music', ...]
	});
});

app.controller('CatFilterCtrl', function($scope, postData, postTitleData, categoryData, $stateParams) {
	$scope.posts = _.filter(_.map(postTitleData.posts, function(post, index) {
		var catName = _.filter(categoryData, function(cat) {
			return post.category == cat._id
		})[0].key;
		return _.extend(post, {
			catName: catName
		})
	}), function(elem) {
		return elem.catName == $stateParams.categoryId.toLowerCase();
	});
});

app.service('PostFactory', function(PostsAPI, $q) {
	var postsAndCats = function(){
		return function(){
			var deferred = $q.defer();
			PostsAPI.postTitlesFn()
				.then(function(postData){
					return postData
				})
				.then(function(postData){
					PostsAPI.catsFn().then(function(categoryData){
						var postsCats = _.filter(_.map(postData.posts, function(post, index) {
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
	var singlePost = function(postId){
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
		}();
	}
	return {postCatFn: postsAndCats,
			singlePostFn2: singlePost}
})

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