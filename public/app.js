var app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate', 'anim-in-out']);

app.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider
		.state('posts', {
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl',
			resolve: {
				postData: function(PostsService) {
					return PostsService.postsFunction();
				},
				categoryData: function(PostsService) {
					return PostsService.catsFunction();
				}
			}
		})
		.state('categories', {
			url: "/category/:categoryId",
			templateUrl: '/components/home/filterView.html',
			controller: 'CatFilterCtrl',
			resolve: {
				postData: function(PostsService) {
					return PostsService.postsFunction();
				},
				categoryData: function(PostsService) {
					return PostsService.catsFunction();
				}
			}
		})
		.state('single', {
			url: "/:slug/",
			templateUrl: '/components/single/singleView.html',
			controller: 'SingleViewCtrl',
			resolve: {
				singlePost: function(PostsService, $stateParams) {
					return PostsService.singlePostFn($stateParams.slug);
				},
				postData: function(PostsService) {
					return PostsService.postsFunction();
				},
				categoryData: function(PostsService) {
					return PostsService.catsFunction();
				}
			}
		})
});

app.controller('PostViewCtrl', function($scope, postData, categoryData, $ocLazyLoad) {
	$scope.posts = _.map(postData.posts, function(post, index) {
		var catName = _.filter(categoryData.postCategories, function(cat) {
			return (post.categories[0] == cat._id)
		})[0].key;
		return _.extend(post, {
			catName: catName
		})
	});
});

app.controller('SingleViewCtrl', function($scope, postData, singlePost, categoryData, $sce, $ocLazyLoad) {
	$scope.posts = _.map(postData.posts, function(post, index) {
		var catName = _.filter(categoryData.postCategories, function(cat) {
			return (post.categories[0] == cat._id)
		})[0].key;
		return _.extend(post, {
			catName: catName
		})
	});

	$scope.category = _.pluck(_.filter($scope.posts, function(post) {
		return post._id == singlePost.post._id
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

app.controller('CatCtrl', function($scope, $http, PostsService) {
	PostsService.catsFunction().then(function(res) {
		$scope.categories = res.postCategories;
	});
});

app.controller('CatFilterCtrl', function($scope, postData, categoryData, $stateParams) {
	$scope.posts = _.filter(_.map(postData.posts, function(post, index) {
		var catName = _.filter(categoryData.postCategories, function(cat) {
			return post.categories[0] == cat._id
		})[0].key;
		return _.extend(post, {
			catName: catName
		})
	}), function(elem) {
		return elem.catName == $stateParams.categoryId.toLowerCase();
	});
});

app.service('PostsService', function($http, $q, $timeout) {
	var getPosts = function() {
		return function() {
			var deferred = $q.defer();
			$http.get('/api/post/list').then(function(response) {
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
	return {
		postsFunction: getPosts,
		catsFunction: getCats,
		singlePostFn: getSingle
	}
});

app.run(['$state', function($state) {
	$state.go('posts');
}]);

function log(msg) {
	console.log(msg)
}