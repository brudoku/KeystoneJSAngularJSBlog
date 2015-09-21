var keystone = require('keystone');
var Types = keystone.Field.Types;
/**
 * Post Model
 * ==========
 */

var Post = new keystone.List('Post', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Post.add({
	title: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	author: { type: Types.Relationship, ref: 'User', index: true },
	publishedDate: { type: Types.Date, index: true, dependsOn: { state: 'published' } },
	image: { type: Types.CloudinaryImage },
	content: {
		brief: { type: Types.Html, wysiwyg: true, height: 50 },
		extended: { type: Types.Html, wysiwyg: true, height: 300 },
	},
	categories: { type: Types.Relationship, ref: 'PostCategory', many: true },
	scriptUpload: {
		type: Types.LocalFiles,
		dest: 'public/data',
		// prefix: '/data',
		filename: function(item, file){
			return item.id + '.' + file.extension
		},
	},
	templates: { type: String, wysiwyg: false, height: 300 }
});

Post.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});

Post.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%';

Post.register();
