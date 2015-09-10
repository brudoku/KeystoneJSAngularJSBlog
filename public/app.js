var app = angular.module('app', ['ui.router', 'oc.lazyLoad'])

app.config(function($stateProvider,  $urlRouterProvider){
	$stateProvider
		.state('index',{
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl',
			resolve: {
				postData: function (PostsService) {
					return PostsService.posts();
				},
				categoryData: function (PostsService) {
					return PostsService.cats();
				}
			}
		})
		.state('index.filter',{
			url: "/category/:code",
			templateUrl: '/components/single/filterView.html',
			controller: 'CatViewCtrl'
		})
		.state('viewSingle',{
			url: "/post/:slug/",
			templateUrl: '/components/single/singleView.html',
			controller: 'SingleViewCtrl as singleView'
		})
	$urlRouterProvider.otherwise('/');
});

app.controller('CatCtrl', function CatCtrl($scope, $http){
	var catControl = this;
	// $scope.categories = [];
	// $http.get('/api/getCategories').then(function(response){
	// 	$scope.categories = response.data.postCategories;
	// });
});

app.controller('CatViewCtrl', function CatViewCtrl(){
	log('zz');
});

app.controller('PostViewCtrl', function($scope, $http, postData, categoryData){
	$scope.posts = postData.posts;
	$scope.categories = categoryData.postCategories;
	log(categoryData.postCategories)

});

app.controller('SingleViewCtrl', function($scope, $http, $stateParams, $sce, $ocLazyLoad){
	var singleView = this;
	$scope.hasImage = function(postImage){
		return (postImage == '' ? false : true)
	}
	$http.get('/api/post/' + $stateParams.slug).then(function (response) {
		$scope.content = $sce.trustAsHtml(response.data.post.content.extended);
		$scope.scriptUpload = response.data.post.scriptUpload;
		$scope.image = '';
		if(response.data.post.image){
			$scope.image = response.data.post.image.url;
		}
		if($scope.scriptUpload){
			var filesToLoad = _.map($scope.scriptUpload, function(file) {
				return 'data/'+file.filename;
			})
			$ocLazyLoad.load([{
				files: filesToLoad,
				cache: false
			}]);
		}else{
			console.log('noscript')
		}
	});
});

app.service('PostsService', function($http, $q, $timeout){
	var getPosts = function(){
		return function(){
			var deferred = $q.defer();
			$http.get('/api/post/list').then(function(response){
				deferred.resolve(response.data)
			});
			return deferred.promise;
		}();
	}
	var getCats = function(){
		return function(){
			var deferred = $q.defer();
			$http.get('/api/getCategories').then(function(response){
				deferred.resolve(response.data)
			});
			return deferred.promise;
		}()
	}

	var getSingle = function (postId) {
		return function() {
			log('scats done')
			var deferred = $q.defer();
			$http.get('/api/post/' + postId).then(function (response) {
				deferred.resolve(response.data)
			});
			return deferred.promise
		}()
	}

	return {posts: getPosts, cats: getCats}
});

function log(msg){
	console.log(msg)
}