var app = angular.module('app', ['ui.router', 'oc.lazyLoad']);

app.config(function($stateProvider,  $urlRouterProvider){
	$stateProvider
		.state('index',{
			url: "/",
			templateUrl: '/components/home/homeView.html',
			controller: 'PostViewCtrl',
			resolve: {
				postData: function (PostsService) {
					return PostsService.postsFunction();
				},
				categoryData: function (PostsService) {
					return PostsService.catsFunction();
				}
			}
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

app.controller('PostViewCtrl', function($scope, $http, postData, categoryData){
	$scope.categories = categoryData.postCategories;

	//add category name to post data rather than use category id
	$scope.posts = _.map(postData.posts, function (post, index) {
	    var catName = _.filter(categoryData.postCategories, function (cat) {
	        return (post.categories[0] == cat._id)
	    });
	    return _.extend(post, {catName: catName[0].key})
	});
	console.log($scope.posts);	

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
	return {postsFunction: getPosts, catsFunction: getCats}
});

function log(msg){
	console.log(msg)
}


/*
$rootScope.$on('$stateChangeStart', function (event, nextState, currentState) {
    if (!isAuthenticated(nextState)) {
        console.debug('Could not change route! Not authenticated!');
        $rootScope.$broadcast('$stateChangeError');
        event.preventDefault();
        $state.go('login');
    }
});

onEnter: ["$state",'PostsService', function (PostsService) {
var foo = PostsService;

log('enter')

log(foo)
}],
onExit: ["$state",'PostsService', function (PostsService) {
var foo = PostsService;
log('exit')

log(foo)
}]			

*/