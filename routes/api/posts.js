var async = require('async'),
	keystone = require('keystone'),
	_ = require('underscore');
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
 * List Post titles
 */
exports.getPostTitles = function(req, res) {
	Post.model.find(function(err, items) {
		if (err) return res.apiError('database error', err);
		var posts = _.map(items, function(item){
			return {'title': item.title,
					'slug': item.slug,
					'category': item.categories[0]
					}
				})

		res.apiResponse(posts);
	});
}

/**
 * Get Post by ID
 */
exports.get = function(req, res) {
	Post.model.findById(req.params.id).exec(function(err, item) {
		if (err) return res.apiError('database error', err);
		if (!item) return res.apiError('not found');
		res.apiResponse(item);
	});
}

/**
 * Get Post by slug
 */
exports.getBySlug = function(req, res) {
	Post.model.find().where('slug', req.params.slug).exec(function(err, item) {
		var firstItem = item[0];
        res.apiResponse(firstItem);
    });
}

/*
* Get categories
*/
exports.getCategories = function(req, res){
	PostCategory.model.find().sort('name').exec(function(err, categories) {
		res.apiResponse(categories)
	});
}