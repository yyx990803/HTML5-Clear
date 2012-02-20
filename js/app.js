//Templates
var templates = {
	Home: function () {
		return '<ul id="home"></ul>';
	},
	List: function (list) {
		var count = list.count();
		return '<li class="list ' + (count == 0 ? 'empty' : '') + '" data-index="'+ list.index +'">'
		+ '<div class="inner">'
		+ '<div class="name">' + list.name + '</div>'
		+ '<div class="count">' + count + '</div>'
		+ '</div></li>';
	},
	ListView: function () {
		return '<ul id="listview"></ul>';
	},
	Todo: function (todo) {
		return '<li class="todo ' + (todo.done ? 'done' : '') + '" data-index="' + todo.index + '">'
		+ '<div class="inner">'
		+ '<div class="name">' + todo.name + '<span></span></div>'
		+ '</div></li>';
	}
};

//Todo View
var Todo = function (name) {
	this.name = name;
	this.done = false;
};
Todo.prototype = {
	render: function (list, index) {
		this.list = list;
		this.index = index;
		var todo = this,
			dragging = false,
			swiping = false,
			touch = {},
			w = 55,
			dx = dy = 0;
		todo.el = $(templates.Todo(todo));
		var line = todo.el.find('span');
		todo.el.bind('touchstart', function(e){
			if (e.touches.length == 1) {
				touch.x1 = e.touches[0].pageX;
				touch.y1 = e.touches[0].pageY;
			}
		})
		.bind('touchmove', function(e) {
			if (!window.swipeLock && e.touches.length == 1) {
				dx = e.touches[0].pageX - touch.x1;
				dy = e.touches[0].pageY - touch.y1;
				if (Math.abs(dy) < 6 && !swiping) {
					swiping = true;
					window.nodrag = true;
					todo.el.addClass('drag');
					list.home.resetIcons(todo.el);
				}
				if (swiping) {
					if (dx > 0 && dx < w) {
						var pct = dx/w;
						if (pct < 0.03) pct = 0;
						$('#check').css('opacity', pct);
						if (!todo.done) line.css('-webkit-transform', 'scaleX(' + pct + ')');
					} else if (dx < 0 && dx > -w){
						$('#cross').css('opacity', -dx/w);
					} else if (dx >= w) {
						dx = w + (dx - w) * .25;
						$('#check').css({
							'opacity': 1,
							'-webkit-transform': 'translate3d(' + (dx-w) + 'px, 0, 0)'
						});
					} else if (dx <= -w) {
						dx = -w + (dx + w) * .25;
						$('#cross').css({
							'opacity': 1,
							'-webkit-transform': 'translate3d(' + (dx+w) + 'px, 0, 0)'
						});
					}
					if (dx >= w-1) {
						if (todo.done) {
							todo.el.removeClass('done');
						} else {
							todo.el.addClass('green');
						}
					} else {
						if (todo.done) {
							todo.el.addClass('done');
						} else {
							todo.el.removeClass('green');
						}
					}
					if (dx <= 0 || list.todos.length > 0) {
						todo.el.css('-webkit-transform', 'translate3d(' + dx + 'px, 0, 0)');
					}
				}
			}
		})
		.swipeLeft(function(e){ //DELETE
			if (!window.swipeLock) {
				todo.destroy();
			}
		})
		.swipeRight(function(e){ //DONE
			if (!window.swipeLock) {
				if (!todo.done) {
					todo.done = true;
					var dy = (todo.list.todos.length - 1) * 60 - todo.el.get(0).offsetTop;
					setTimeout(function(){
						todo.el.addClass('medium').addClass('done').css({
							'z-index': '999',
							'margin-bottom':'-60px',
							'-webkit-transform':'translate3d(0,'+ dy +'px,0)'
						});
						setTimeout(function(){ //reset
							todo.list.todos.splice(todo.index, 1);
							todo.list.todos.push(todo);
							todo.list.resetView();
						}, 250);
					}, 150);
				} else {
					todo.done = false;
					var dy = -todo.el.get(0).offsetTop;
					setTimeout(function(){
						todo.el.addClass('medium').removeClass('done').css({
							'z-index': '999',
							'margin-bottom':'-60px',
							'-webkit-transform':'translate3d(0,'+ dy +'px,0)'
						});
						todo.el.siblings().addClass('medium').css({
							'-webkit-transform':'translate3d(0,60px,0)'
						});
						setTimeout(function(){
							todo.list.todos.splice(todo.index, 1);
							todo.list.todos.unshift(todo);
							todo.list.resetView();
						}, 250);
					}, 150);
				}
			}
		})
		.longTap(function(e){
			//st
		})
		.bind('touchend touchcancel', function(e){
			if (e.touches.length == 0) {
				window.nodrag = false;
				dragging = false;
				swiping = false;
				todo.el.removeClass('drag').css('-webkit-transform', 'translate3d(0,0,0)');
				touch = {};
				$('#cross, #check').css('opacity', 0);
				if (!todo.done) {
					line.addClass('fast').css('-webkit-transform', 'scaleX(0)');
					setTimeout(function(){
						line.removeClass('fast');
					}, 150);
				}
			}
		});
		
		todo.el.find('.name').tap(function(e){
			e.stopPropagation();
			todo.el.siblings().css('opacity', .3);
			var oname = $(this).text();
			$(this).html($('<input type="text" value="' + oname + '"/>').blur(function(){
				todo.el.siblings().css('opacity', 1);
				todo.name = this.value;
				$(this).replaceWith(this.value);
			}));
		});
		return todo.el;
	},
	destroy: function () {
		var todo = this;
		todo.el.addClass('medium').css('-webkit-transform', 'translate3d(' + (-window.innerWidth) + 'px, 0, 0)');
		setTimeout(function(){ todo.el.css('height', 0); }, 250);
		setTimeout(function(){
			todo.el.remove();
			todo.list.todos.splice(todo.index, 1);
			todo.list.resetView();
		}, 500);
	}
};

//List View
var List = function (name, todos) {
	this.name = name;
	this.todos = todos || [];
};
List.prototype = {
	renderSelf: function (home, index) {
		this.home = home;
		this.index = index;
		var list = this,
			dragging = false,
			swiping = false,
			touch = {},
			w = 55;
		list.el = $(templates.List(list))
		.bind('touchstart', function(e){
			if (e.touches.length == 1) {
				touch.x1 = e.touches[0].pageX;
				touch.y1 = e.touches[0].pageY;
			}
		})
		.bind('touchmove', function(e) {
			if (!window.swipeLock && e.touches.length == 1) {
				var dx = e.touches[0].pageX - touch.x1,
					dy = e.touches[0].pageY - touch.y1;
				if (Math.abs(dy) < 6 && !swiping) {
					swiping = true;
					window.nodrag = true;
					list.el.addClass('drag');
					home.resetIcons(list.el);
				}
				if (swiping) {
					if (dx > 0 && dx < w) {
						$('#check').css('opacity', dx/w);
					} else if (dx < 0 && dx > -w){
						$('#cross').css('opacity', -dx/w);
					} else if (dx >= w) {
						dx = w + (dx - w) * .25;
						$('#check').css({
							'opacity': 1,
							'-webkit-transform': 'translate3d(' + (dx-w) + 'px, 0, 0)'
						});
					} else if (dx <= -w) {
						dx = -w + (dx + w) * .25;
						$('#cross').css({
							'opacity': 1,
							'-webkit-transform': 'translate3d(' + (dx+w) + 'px, 0, 0)'
						});
					}
					if (dx <= 0 || list.todos.length > 0) {
						list.el.css('-webkit-transform', 'translate3d(' + dx + 'px, 0, 0)');
					}
				}
			}
		})
		.bind('touchend touchcancel', function(e){
			window.nodrag = false;
			dragging = false;
			swiping = false;
			list.el.removeClass('drag').css('-webkit-transform', 'translate3d(0,0,0)');
			touch = {};
			$('#cross, #check').css('opacity', 0);
		})
		.swipeLeft(function(e){
			if (!window.swipeLock) {
				var l = list.count();
				if ((l > 0 && confirm('This list contains ' + l + ' items. Are you sure you want to delete it?')) || l == 0) {
					list.destroy();
				}
			}
		})
		.swipeRight(function(e){
			if (!window.swipeLock && list.count() > 0 && confirm('Are you sure you want to complete all your items in this list?')) {
				$.each(list.todos, function(i, t) {
					t.done = true;
				});
				list.refreshSelf();
			}
		})
		.longTap(function(e){
			//start vertical dragging
		})
		.tap(function(e){
			if (list.todos.length > 0) list.renderView().appendTo('#wrapper');
		});
		list.el.find('.name').tap(function(e){
			e.stopPropagation();
			list.el.siblings().css('opacity', .3);
			var oname = $(this).text();
			$(this).html($('<input type="text" value="' + oname + '"/>').blur(function(){
				list.el.siblings().css('opacity', 1);
				list.name = this.value;
				$(this).replaceWith(this.value);
			}));
		});
		return list.el;
	},
	renderView: function () {
		
		//Handling the pinches
		
		var list = this,
			odist = 0,
			triggered = false;
		
		list.view = $(templates.ListView())
		.bind('touchstart', function (e) {
			if (e.touches.length == 2) {
				window.nodrag = true;
				var dx = e.touches[0].pageX - e.touches[1].pageX,
					dy = e.touches[0].pageY - e.touches[1].pageY;
				odist = dx*dx + dy*dy;
			}
		})
		.bind('touchmove', function (e) {
			if (!triggered && e.touches.length == 2) {
				var dx = e.touches[0].pageX - e.touches[1].pageX,
					dy = e.touches[0].pageY - e.touches[1].pageY,
					dist = dx*dx + dy*dy;
				if (odist - dist > 50) {                           //PINCH IN
					list.home.el.addClass('slow').css({
						'-webkit-transform': 'translate3d(0,0,0)',
						'opacity': 1
					});
					list.view.find('.todo').addClass('slow').each(function (i, t) {
						$(this).css({
							'-webkit-transform': 'translate3d(0,-'+ this.offsetTop +'px,0)',
							'opacity': 0
						});
					});
					setTimeout(function(){
						list.home.el.removeClass('slow');
						list.home.reset();
						list.view.remove();
					}, 350);
					triggered = true;
				} else if (odist - dist < -50) {                   //PINCH OUT
					
					triggered = true;
				}
			}
		})
		.bind('touchend touchcancel', function (e) {
			if (e.touches.length == 0) {
				window.nodrag = false;
				odist = 0;
				triggered = false;
			}
		});
		
		$.each(list.todos, function(i,todo){
			var t = todo.render(list, i).css({
				'z-index':99-i,
				'-webkit-transform':'translate3d(0,' + (list.el.offset().top - 60 * i) + 'px,0)'
			});
			list.view.append(t);
		});
		
		setTimeout(function(){
			list.home.el.addClass('slow').css({
				'-webkit-transform': 'translate3d(0,' + (-list.home.el.height()) + 'px,0)',
				'opacity': 0
			});
			list.view.find('.todo').addClass('slow').css('-webkit-transform','translate3d(0,0,0)');
		}, 30);
		setTimeout(function(){
			list.home.el.removeClass('slow');
			list.resetView();
		}, 380);
		list.refreshView();
		return list.view;
	},
	resetView: function () {
		var list = this;
		list.view.empty();
		$.each(list.todos, function(i,todo){
			var t = todo.render(list, i).css({
				'z-index':99-i
			});
			list.view.append(t);
		});
		list.refreshView();
	},
	refreshView: function () {
		var list = this;
		list.view.find('.todo:not(.done)').each(function(i){
			$(this).css('background-color','hsl(' + (353+i*10)%360 + ',100%,' + (i==0 ? '48%':'53%') + ')');
		});
	},
	refreshSelf: function () {
		var list = this;
		list.el.find('.count').html(list.count());
		list.el.addClass('empty');
	},
	destroy: function () {
		var list = this;
		list.el.addClass('medium').css('-webkit-transform', 'translate3d(' + (-window.innerWidth) + 'px, 0, 0)');
		setTimeout(function(){ list.el.css('height', 0); }, 250);
		setTimeout(function(){
			list.el.remove();
			list.home.lists.splice(list.index, 1);
			list.home.refresh();
		}, 500);
	},
	count: function () {
		var list = this,
			todo = 0;
		for (var i = 0; i < list.todos.length; i++) {
			if (!list.todos[i].done) todo++;
		}
		return todo;
	}
};

//Home View
var Home = function (lists) {
	this.lists = lists || [];
};
Home.prototype = {
	render: function () {
		var home = this;
		home.el = $(templates.Home());
		home.reset();
		return home.el;
	},
	reset: function () {
		var home = this;
		home.el.empty();
		$.each(home.lists, function(i, list) {
			home.el.append(list.renderSelf(home, i));
		});
		home.refresh();
	},
	refresh: function () {
		var home = this;
		home.el.find('.list').each(function(i){
			$(this).css('background-color','hsl(' + (212-i*3)%360 + ', 100%, 53%)');
		});
	},
	resetIcons: function(el) {
		$('#cross, #check').show().css({
			'top': el.offset().top + 'px',
			'opacity': 0,
			'-webkit-transform': 'none'
		});
	}
};

$(function(){
	
	//setup scrolling
	$(document)
	.bind('touchmove', function(e){
		if (window.nodrag) {
			e.preventDefault();
		} else {
			window.swipeLock = true;
		}
	})
	.bind('touchend touchcancel', function(e){
		window.swipeLock = false;
	});
	
	var home = new Home([
		new List('Hello', [
			new Todo('Swipe right to complete'),
			new Todo('Swipe left to delete'),
			new Todo('Tap on text to edit'),
			new Todo('Drag down to add new'),
			new Todo('Pinch to go back.')
		]),
		new List('This is a demo', [
			new Todo('Built with HTML5'),
			new Todo('CSS3'),
			new Todo('and Zepto.js')
		]),
		new List('by Evan You', [
			new Todo('@youyuxi'),
			new Todo('By the way'),
			new Todo('I\'m looking for a job!'),
			new Todo('youyuxi.com')
		])
	]);
	
	home.render().appendTo('#wrapper');
	
});