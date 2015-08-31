var app = angular.module('Nybryx', ['ngRoute']);

app.config(function($routeProvider){
	$routeProvider.when('/',{
		templateUrl:'app.html',
		controller:'PostViewCtrl'})
});

app.controller('PostViewCtrl', function($scope, $http){
	$scope.posts = [];
	$http.get('/api/post/list').then(function(response){
		console.log('response')
		console.log(response.data.posts);
		$scope.posts = response.data.posts;
	});
});

