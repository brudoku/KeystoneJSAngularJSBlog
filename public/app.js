var app = angular.module('app', ['ui.router', 'oc.lazyLoad'])

app.config(function($stateProvider,  $urlRouterProvider){
	$stateProvider
		.state('index',{
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl'

		})
		.state('viewSingle',{
			url: "/post/:slug/",
			templateUrl: '/components/single/singleView.html',
			controller: 'SingleViewCtrl'
			/*
			,resolve: {
				runTest: ['$ocLazyLoad', function ($ocLazyLoad) {
					return $ocLazyLoad.load('/components/single/test.js')
				}]
			}
			*/
		})
	$urlRouterProvider.otherwise('/');
});

app.controller('PostViewCtrl', function($scope, $http){
	$scope.posts = [];
	log('post')
	$http.get('/api/post/list').then(function(response){
		$scope.posts = response.data.posts;
	});
});

app.controller('SingleViewCtrl', function($scope, $http, $stateParams, $sce, $ocLazyLoad){
	log('single');
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

function log(msg){
	console.log(msg)
}