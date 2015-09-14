var app = angular.module('app', ['ui.router', 'oc.lazyLoad', 'ngAnimate']);

app.config(function($stateProvider,  $urlRouterProvider){
	$stateProvider
		.state('posts',{
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
		.state('categories',{
			url: "/category/:categoryId",
				templateUrl: '/components/home/filterView.html',
				controller: 'CatFilterCtrl',
				resolve: {
					postData: function (PostsService) {
						return PostsService.postsFunction();
					},
					categoryData: function (PostsService) {
						return PostsService.catsFunction();
					}
				}
		})
		.state('categories.subview',{
			url: "/category/:categoryId",
				templateUrl: '/components/home/filterView.subview.html',
				controller: function($scope){
					$scope.foobar = 'foobar'
				}
		})
		.state('single',{
			url: "/:slug/",
			templateUrl: '/components/single/singleView.html',
			controller: 'SingleViewCtrl',
			resolve: {
				singlePost: function (PostsService, $stateParams) {
					return PostsService.singlePostFn($stateParams.slug);
				}
			}
		})
});

app.controller('PostViewCtrl', function($scope, postData, categoryData, $ocLazyLoad){
	$scope.posts = _.map(postData.posts, function (post, index) {
	    var catName = _.filter(categoryData.postCategories, function (cat) {
	        return (post.categories[0] == cat._id)
	    })[0].key;
	    return _.extend(post, {catName: catName})
	});
});

app.controller('SingleViewCtrl', function($scope, singlePost, $sce, $ocLazyLoad){
	$scope.content = $sce.trustAsHtml(singlePost.post.content.extended);
	if(singlePost.post.image){
		$scope.image = singlePost.post.image.url;
	}
	$scope.scriptUpload = singlePost.post.scriptUpload;
	if($scope.scriptUpload){
		var filesToLoad = _.map($scope.scriptUpload, function(file) {
			return 'data/'+file.filename;
		})
		$ocLazyLoad.load([{
			files: filesToLoad,
			cache: false
		}]);
	}
	$scope.hasImage = function(postImage){return (postImage == '' ? false : true)}
});

app.controller('CatCtrl', function($scope, $http, PostsService){
	PostsService.catsFunction().then(function(res){
		$scope.categories = res.postCategories;
	});
});

app.controller('CatFilterCtrl', function($scope, postData, categoryData, $stateParams){
	log('CatFilterCtrl: '+$stateParams.categoryId);
	$scope.posts = _.filter(_.map(postData.posts, function (post, index) {
	    var catName = _.filter(categoryData.postCategories, function (cat) {
	        return post.categories[0] == cat._id
	    })[0].key;
	    return _.extend(post, {catName: catName})
	}), function(elem) {
		return elem.catName == $stateParams.categoryId.toLowerCase();
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
		}();

	}
	var getSingle = function (postId) {
		return function() {			
			var deferred = $q.defer();
			$http.get('/api/post/' + postId).then(function (response) {
				deferred.resolve(response.data)
			});
			return deferred.promise
		}();
	}
	return {postsFunction: getPosts, catsFunction: getCats, singlePostFn: getSingle}
});

app.run(['$state',function($state) {
	$state.go('posts');
}]);

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