var async = require('async'),
	keystone = require('keystone');

var Post = keystone.list('Post');
var PostCategory = keystone.list('PostCategory');


/**
 * List Posts
 */
exports.list = function(req, res) {
	Post.model.find(function(err, items) {
		if (err) return res.apiError('database error', err);
		res.apiResponse({
			posts: items
		});
	});
}

/**
 * Get Post by ID
 */
exports.get = function(req, res) {
	Post.model.findById(req.params.id).exec(function(err, item) {
		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');
		res.apiResponse({
			post: item
		});
	});
}

/** 
 * Get Post by slug
 */
exports.getBySlug = function(req, res) {
	Post.model.find().where('slug', req.params.slug).exec(function(err, item) {	
		var firstItem = item[0];
        res.apiResponse({
			post: firstItem
		});
    });
}

/*
* Get categories
*/
exports.getCategories = function(req, res){
	PostCategory.model.find().sort('name').exec(function(err, categories) {
		res.apiResponse({
			postCategories: categories
		})
	});
}