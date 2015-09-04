var app = angular.module('Nybryx', ['ngRoute']);

app.config(function($routeProvider){
	$routeProvider
	.when('/post/:slug/',{
			templateUrl:'/components/single/singleView.html',
			controller:'SingleViewCtrl'
		})
	.when('/',{
		templateUrl:'/components/home/homeView.html',
		controller:'PostViewCtrl'
		})
});

app.controller('PostViewCtrl', function($scope, $http){
	$scope.posts = [];
	$http.get('/api/post/list').then(function(response){
		$scope.posts = response.data.posts;
	});
});

app.controller('SingleViewCtrl', function($scope, $http, $routeParams, $sce){
	$http.get('/api/post/' + $routeParams.slug).then(function (response) {
		$scope.content = $sce.trustAsHtml(response.data.post.content.extended);
		$scope.customScript = response.data.post.customScript;
	});
});