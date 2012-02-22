//Templates
var templates = {
	Home: function () {
		return '<ul id="home"></ul>';
	},
	List: function (list) {
		var count = list.count();
		return '<li class="list ' + (count == 0 ? 'empty' : '') + '">'
		+ '<div class="inner">'
		+ '<div class="name">' + list.name + '</div>'
		+ '<div class="count">' + count + '</div>'
		+ '</div></li>';
	},
	ListView: function () {
		return '<ul id="listview"></ul>';
	},
	Todo: function (todo) {
		return '<li class="todo ' + (todo.done ? 'done' : '') + '">'
		+ '<div class="inner">'
		+ '<div class="name">' + todo.name + '<span></span></div>'
		+ '</div></li>';
	},
	newList: function (pos) {
		return '<li class="list '+ pos +'">'
		+ '<div class="inner">'
		+ '<div class="name"><input type="text" value="' + (pos == 'top' ? 'Pull to create item' : 'Tap me') + '"/></div>'
		+ '<div class="count">0</div>'
		+ '</div></li>'
	},
	newTodo: function (pos) {
		return '<li class="todo '+ pos +'">'
		+ '<div class="inner">'
		+ '<div class="name"><input type="text" value="' + (pos == 'top' ? 'Pull to create item' : 'Tap me') + '"/></div>'
		+ '</div></li>'
	},
	emptyListView: function() {
		return '<li class="addmore">Tap to add new todo</li>';
	},
	emptyHome: function() {
		return '<li class="addmore">Tap to add a new List</li>';
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
			dragFrom = 0,
			swiping = false,
			touch = {},
			w = 55,
			dx = dy = 0;
			
		todo.el = $(templates.Todo(todo));
		var line = todo.el.find('span');
		
		todo.el.bind('touchstart', function(e){
			if (e.touches.length == 1 && !window.editing) {
				touch.x1 = e.touches[0].pageX;
				touch.y1 = e.touches[0].pageY;
			}
		})
		.bind('touchmove', function(e) {
			
			if (!window.globalDrag && !window.editing && !window.draggingDown && e.touches.length == 1) {
				
				dx = e.touches[0].pageX - touch.x1;
				dy = e.touches[0].pageY - touch.y1;
				
				if (Math.abs(dy) < 6 && Math.abs(dx) > 0 && !swiping && !dragging) {
					swiping = true;
					window.inAction = true;
					todo.el.addClass('drag');
					list.home.resetIcons(todo.el);
				}
				
				if (swiping) {
					if (dx > 0 && dx < w) {
						var pct = dx/w;
						if (pct < 0.05) pct = 0;
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
				
				if (dragging) {
					window.inAction = true;
					todo.el.css('-webkit-transform', 'translate3d(0,' + (dy - dragFrom) + 'px, 0) scale(1.05)');
					if (dy - dragFrom < - 30 || dy - dragFrom > + 30) {
						var step = Math[dy > 0 ? 'ceil':'floor']((dy > 0 ? dy - 30 : dy + 30)/60),
							newDragFrom = step * 60;
						if (dragFrom != newDragFrom && todo.index + step >= 0 && todo.index + step < todo.list.todos.length) {
							var target = $(todo.list.view.find('li.todo').get(todo.index + step));
							target[newDragFrom > dragFrom ? 'after':'before'](todo.el);
							dragFrom = newDragFrom;
							todo.el.css('-webkit-transform', 'translate3d(0,' + (dy - dragFrom) + 'px, 0) scale(1.05)');
						}
					}
				}
				
			}
		})
		.bind('swipeLeft', function(e){ //DELETE
			if (!window.globalDrag && !window.editing && !window.draggingDown) {
				todo.destroy();
			}
		})
		.bind('swipeRight', function(e){ //DONE
			if (!window.globalDrag && !window.editing && !window.draggingDown) {
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
		.bind('longTap', function(e){
			if (!swiping && !window.editing) {
				dragging = true;
				dragFrom = 0;
				todo.el.addClass('dragged').css('-webkit-transform', 'scale(1.05)');
			}
		})
		.bind('tap', function(e){
			e.cancelBubble = true;
		})
		.bind('touchend touchcancel', function(e){
			if (e.touches.length == 0) {
				
				window.inAction = false;
				
				todo.el.removeClass('drag').css('-webkit-transform', 'translate3d(0,0,0)');
				touch = {};
				$('#cross, #check').css('opacity', 0);
				
				if (swiping) {
					swiping = false;
					if (!todo.done) {
						line.addClass('fast').css('-webkit-transform', 'scaleX(0)');
						setTimeout(function(){
							line.removeClass('fast');
						}, 150);
					}
				}
				
				if (dragging) {
					
					e.stopPropagation();
					dragging = false;
					todo.el.removeClass('dragged');
					
					var newIndex = dragFrom/60 + todo.index,
						todos = todo.list.todos,
						undones = todo.list.count();
					todos.splice(todo.index, 1);
					todos.splice(newIndex, 0, todo);
					
					if (todo.done) {
						if (newIndex < undones) todo.done = false;
					} else if (undones < todo.list.todos.length && newIndex > undones - 1) {
						todo.done = true;
					}
					setTimeout(function(){
						todo.list.resetView();
					}, 150);
				}
				
			}
		});
		
		//edit
		todo.el.find('.name').tap(function(e){
			e.cancelBubble = true;
			if (!window.editing && !window.inAction && !window.globalDragging && !window.draggingDown) {
				todo.el.siblings().css('opacity', .3);
				var oname = $(this).text();
				window.editing = true;
				$(this).html($('<input type="text" value="' + oname + '"/>').blur(function(){
					todo.el.siblings().css('opacity', 1);
					window.editing = false;
					var name = this.value;
					if (!name) {
						todo.destroy();
					} else {
						todo.name = name;
						$(this).replaceWith(name);
					}
				}));
			}
		});
		return todo.el;
	},
	destroy: function () {
		var todo = this;
		todo.el.addClass('medium').css('-webkit-transform', 'translate3d(-' + window.innerWidth + 'px, 0, 0)');
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
			dragFrom = 0,
			swiping = false,
			touch = {},
			w = 55;
		list.el = $(templates.List(list))
		.bind('touchstart', function(e){
			if (e.touches.length == 1 && !window.editing) {
				touch.x1 = e.touches[0].pageX;
				touch.y1 = e.touches[0].pageY;
			}
		})
		.bind('touchmove', function(e) {
			if (e.touches.length == 1 && !window.globalDrag && !window.editing && !window.draggingDown) {
				
				var dx = e.touches[0].pageX - touch.x1,
					dy = e.touches[0].pageY - touch.y1;
					
				if (Math.abs(dy) < 6 && Math.abs(dx) > 0 && !swiping && !dragging) {
					swiping = true;
					window.inAction = true;
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
				
				if (dragging) {
					window.inAction = true;
					list.el.css('-webkit-transform', 'translate3d(0,' + (dy - dragFrom) + 'px, 0) scale(1.05)');
					if (dy - dragFrom < -30 || dy - dragFrom > 30) {
						var step = Math[dy > 0 ? 'ceil':'floor']((dy > 0 ? dy - 30 : dy + 30)/60),
							newDragFrom = step * 60;
						if (newDragFrom != dragFrom && list.index + step >= 0 && ((list.index + step) < list.home.lists.length)) {
							var target = $(list.home.el.find('li.list').get(list.index + step));
							target[ newDragFrom > dragFrom ? 'after':'before'](list.el);
							dragFrom = newDragFrom;
							list.el.css('-webkit-transform', 'translate3d(0,' + (dy - dragFrom) + 'px, 0) scale(1.05)');
							
						}
					}
				}
				
			}
		})
		.bind('swipeLeft', function(e){
			if (!window.globalDrag && !window.editing && !window.draggingDown) {
				var l = list.count();
				if (l != 0) {
					if (confirm('This list contains ' + l + ' items. Are you sure you want to delete it?')) {
						list.destroy();
					} else {
						setTimeout(function(){
							list.home.reset();
						}, 100);
					}
				} else {
					list.destroy();
				}
			}
		})
		.bind('swipeRight', function(e){
			if (!window.globalDrag && !window.editing && !window.draggingDown && list.count() > 0) {
				if (confirm('Are you sure you want to complete all your items in this list?')) {
					$.each(list.todos, function(i, t) {
						t.done = true;
					});
				}
				setTimeout(function(){
					list.home.reset();
				}, 100);
			}
		})
		.bind('longTap', function(e){
			if (!swiping && !window.globalDrag && !window.editing && !window.draggingDown) {
				dragging = true;
				dragFrom = 0;
				list.el.addClass('dragged').css('-webkit-transform', 'scale(1.05)');
			}
		})
		.bind('tap', function(e){
			e.cancelBubble = true;
			if (!window.editing) list.renderView().appendTo('#wrapper');
		})
		.bind('touchend touchcancel', function(e){
			
			window.inAction = false;
			
			list.el.removeClass('drag').css('-webkit-transform', 'translate3d(0,0,0)');
			touch = {};
			$('#cross, #check').css('opacity', 0);
			
			if (swiping) {
				swiping = false;
			}
			
			if (dragging) {
				dragging = false;
				list.el.removeClass('dragged');
				var newIndex = dragFrom/60 + list.index,
					lists = list.home.lists;
				lists.splice(list.index, 1);
				lists.splice(newIndex, 0, list);
				setTimeout(function(){
					list.home.reset();
				}, 150);
			}
			
		});
		
		//edit
		list.el.find('.name').tap(function(e){
			e.cancelBubble = true;
			if (!window.editing && !window.inAction && !window.globalDragging && !window.draggingDown) {
				list.el.siblings().css('opacity', .3);
				var oname = $(this).text();
				window.editing = true;
				$(this).html($('<input type="text" value="' + oname + '"/>').blur(function(){
					window.editing = false;
					list.el.siblings().css('opacity', 1);
					var name = this.value;
					if (!name) {
						var l = list.count();
						if (l == 0 || confirm('This list contains ' + l + ' items. Are you sure you want to delete it?')) {
							list.destroy();
						} else {
							$(this).replaceWith(oname);
						}
					} else {
						list.name = name;
						$(this).replaceWith(name);
					}
				}));
			}
		});
		
		return list.el;
	},
	renderView: function () {
		
		//Handling the pinches
		
		var list = this,
			odist = 0,
			pinchY = {},
			triggered = false,
			touch = {},
			newTopTodo;
		
		list.view = $(templates.ListView())
		.bind('touchstart', function (e) {
			if (e.touches.length == 2) {
				window.inAction = true;
				var dx = e.touches[0].pageX - e.touches[1].pageX,
					dy = e.touches[0].pageY - e.touches[1].pageY;
				odist = Math.sqrt(dx*dx + dy*dy);
				pinchY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
			} else if (e.touches.length == 1) {
				touch.x1 = e.touches[0].pageX;
				touch.y1 = e.touches[0].pageY;
			}
		})
		.bind('touchmove', function (e) {
			
			if (!triggered && e.touches.length == 2 && !window.globalDragging) {
				
				var dx = e.touches[0].pageX - e.touches[1].pageX,
					dy = e.touches[0].pageY - e.touches[1].pageY,
					dist = Math.sqrt(dx*dx + dy*dy);
				if (odist - dist > 80) {                           //PINCH IN
					list.home.reset();
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
						list.view.remove();
					}, 350);
					triggered = true;
				} else if (odist - dist < -50) {                   //PINCH OUT
					//console.log(pinchY);
					triggered = true;
				}
				
			} else if (e.touches.length == 1 && !window.globalDragging) {
				
				touch.dx = e.touches[0].pageX - touch.x1;
				touch.dy = e.touches[0].pageY - touch.y1;// - 5;
				
				if (window.innerHeight <= 356 && touch.dy > 0 && !window.inAction) {          //DRAGGING DOWN
					if (!window.draggingDown) {
						newTopTodo = $(templates.newTodo('top')).addClass('drag').prependTo(list.view);
						list.view.addClass('drag');
						window.draggingDown = true;
					}
					var d = touch.dy * .4;
					list.view.css({
						'-webkit-transform':'translate3d(0,' + (d >= 60 ? d - 60 : d) + 'px,0)',
						'top': d >= 60 ? '60px' : '0'
					});
					if (newTopTodo) {
						newTopTodo.css({
							'-webkit-transform': 'rotateX('+ Math.max((1-d/60)*85, 0) +'deg)',
							'opacity': d/60*.7 + .3
						});
						newTopTodo.find('input').val(d >= 60 ? 'Release to create item' : 'Pull to create item' );
					}
				}
			}
		})
		.bind('touchend touchcancel', function (e) {
			
			window.inAction = false;
			odist = 0;
			triggered = false;
			
			if (window.draggingDown) {
				
				window.draggingDown = false;
				
				if (touch.dy*.4 >= 60 && newTopTodo) {
					
					newTopTodo.siblings().addClass('medium').css('opacity',.3);
					newTopTodo.find('input').val('').focus()
					.bind('blur', function(){
						window.editing = false;
						var name = this.value;
						newTopTodo.siblings().css('opacity',1);
						if (!name) {
							newTopTodo.removeClass('drag').addClass('medium').css('-webkit-transform','translate3d(-'+ window.innerWidth +'px,0,0)');
							setTimeout(function(){
								newTopTodo.css('height', 0);
							}, 250);
							setTimeout(function(){
								list.resetView();
							}, 500);
						} else {
							var newTodo = new Todo(name);
							list.todos.unshift(newTodo);
							setTimeout(function(){
								list.resetView();
							}, 250);
						}
					});
					window.editing = true;
					
				} else {
					
					if (newTopTodo) {
						newTopTodo.removeClass('drag').addClass('fast').css('-webkit-transform','rotateX(85deg)');
						setTimeout(function(){
							newTopTodo.remove();
							newTopTodo = null;
						}, 150);
					}
					
				}
				list.view.removeClass('drag').css('-webkit-transform','translate3d(0,0,0)');
				touch = {};
			}
		})
		.bind('tap', function (e) {
			//create new todo at the end
			
			if (!window.editing) {
				
				window.editing = true;
			
				var todos = list.view.find('li.todo');
				todos.addClass('slow').css('opacity', .3);
				setTimeout(function(){
					todos.removeClass('slow');
				}, 350);
			
				var newTodo = $(templates.newTodo('bottom'))
				.bind('tap', function(e){
					e.cancelBubble = true;
				})
				.addClass('slow')
				.appendTo(list.view)
				.css({
					'background-color':'hsl(' + (353+list.count()*10)+ ', 95%, 53%)',
					'opacity': 1
				});
				
				newTodo.find('input')
				.bind('focus', function(){
					this.value = '';
				})
				.bind('blur', function(){
					window.editing = false;
					todos.css('opacity', 1);
					var name = this.value;
					if (!name) { //cancel
						newTodo.css('-webkit-transform','translate3d(-'+ window.innerWidth +'px,0,0)');
						setTimeout(function(){
							list.resetView();
						}, 350);
					} else { //create
						var dones = list.view.find('li.done');
						newTodo.css('-webkit-transform','translate3d(0,-'+ (dones.length * 60) +'px,0)');
						dones.addClass('slow').css('-webkit-transform','translate3d(0,60px,0)');
						setTimeout(function(){
							list.todos.splice(list.count(), 0, new Todo(name));
							list.resetView();
						}, 350);
					}
				});
			
				setTimeout(function(){ //this solving transition not working problem, don't know why though
					newTodo.css('-webkit-transform','rotateX(0deg)');
				}, 10);
				
			}
			
		});
		
		if (list.todos.length > 0) {		
			$.each(list.todos, function(i,todo){
				var t = todo.render(list, i).css({
					'z-index':99-i,
					'-webkit-transform':'translate3d(0,' + (list.el.offset().top - 60 * i) + 'px,0)'
				});
				list.view.append(t);
			});
			list.refreshView();	
		} else {
			list.view.html(templates.emptyListView());
		}
		
		setTimeout(function(){
			list.home.el.addClass('slow').css({
				'-webkit-transform': 'translate3d(0,-' + list.home.el.height() + 'px,0)',
				'opacity': 0
			});
			list.view.find('.todo').addClass('slow').css('-webkit-transform','translate3d(0,0,0)');
		}, 10);
		
		setTimeout(function(){
			list.home.el.removeClass('slow');
			list.resetView();
		}, 360);
		
		return list.view;
	},
	resetView: function () {
		var list = this;
		if (list.todos.length > 0) {
			list.view.empty().css('top',0);
			$.each(list.todos, function(i,todo){
				var t = todo.render(list, i).css({
					'z-index':99-i
				});
				list.view.append(t);
			});
			list.refreshView();
		} else {
			list.view.html(templates.emptyListView());	
		}
	},
	refreshView: function () {
		var list = this,
			dones = list.view.find('.todo:not(.done)');
		dones.each(function(i){
			$(this).css('background-color','hsl(' + (353+i*Math.min(70/dones.length,10)) + ',95%,' + (i==0 ? '48%':'53%') + ')');
		});
	},
	destroy: function () {
		var list = this;
		list.el.addClass('medium').css('-webkit-transform', 'translate3d(' + (-window.innerWidth) + 'px, 0, 0)');
		setTimeout(function(){ list.el.css('height', 0); }, 250);
		setTimeout(function(){
			list.el.remove();
			list.home.lists.splice(list.index, 1);
			list.home.reset();
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
		
		var home = this,
			touch = {},
			newTopList;
			
		home.el = $(templates.Home())
		.bind('touchstart', function(e){
			touch.x1 = e.touches[0].pageX;
			touch.y1 = e.touches[0].pageY;
		})
		.bind('touchmove', function (e) {
			if (e.touches.length == 1 && !window.globalDragging) {
				touch.dx = e.touches[0].pageX - touch.x1;
				touch.dy = e.touches[0].pageY - touch.y1; //- 5;
				if (window.innerHeight <= 356 && touch.dy > 0 && !window.inAction) {       //DRAGGING DOWN
					if (!window.draggingDown) {
						newTopList = $(templates.newList('top')).addClass('drag').prependTo(home.el);
						home.el.addClass('drag');
						window.draggingDown = true;
					}
					var d = touch.dy * .4;
					home.el.css({
						'-webkit-transform':'translate3d(0,' + (d >= 60 ? d - 60 : d) + 'px,0)',
						'top': d >= 60 ? '60px' : '0'
					});
					if (newTopList) {
						newTopList.css({
							'-webkit-transform': 'rotateX('+ Math.max((1-d/60)*85, 0) +'deg)',
							'opacity': d/60*.7 + .3
						});
						newTopList.find('input').val(d >= 60 ? 'Release to create item' : 'Pull to create item' );
					}
				}
			}
		})
		.bind('touchend touchcancel', function(){
			if (window.draggingDown) {
				window.draggingDown = false;
				if (touch.dy*.4 >= 60 && newTopList) {
					newTopList.siblings().addClass('medium').css('opacity',.3);
					newTopList.find('input').val('').focus()
					.bind('blur', function(){
						window.editing = false;
						var name = this.value;
						newTopList.siblings().css('opacity',1);
						if (!name) {
							newTopList.removeClass('drag').addClass('medium').css('-webkit-transform','translate3d(-'+ window.innerWidth +'px,0,0)');
							setTimeout(function(){
								newTopList.css('height', 0);
							}, 250);
							setTimeout(function(){
								home.reset();
							}, 500);
						} else {
							var newList = new List(name,[]);
							home.lists.unshift(newList);
							setTimeout(function(){
								home.reset();
							}, 250);
						}
					});
					window.editing = true;
				} else {
					if (newTopList) {
						newTopList.removeClass('drag').addClass('fast').css('-webkit-transform','rotateX(85deg)');
						setTimeout(function(){
							newTopList.remove();
							newTopList = null;
						}, 150);
					}
				}
				home.el.removeClass('drag').css('-webkit-transform','translate3d(0,0,0)');
				touch = {};
			}
		})
		.bind('tap', function(e){
			//create new list at the end
			if (!window.editing) {
				
				window.editing = true;
			
				var lists = home.el.find('li.list');
				lists.addClass('slow').css('opacity', .3);
				setTimeout(function(){
					lists.removeClass('slow');
				}, 350);
			
				var newList = $(templates.newList('bottom'))
				.bind('tap', function(e){
					e.cancelBubble = true;
				})
				.addClass('slow')
				.css({
					'background-color':'hsl(' + (212-home.lists.length*3)+ ', 95%, 53%)',
					'opacity': 1
				})
				.appendTo(home.el);
				
				newList.find('input')
				.bind('focus', function(){
					this.value = '';
				})
				.bind('blur', function(){
					window.editing = false;
					lists.css('opacity', 1);
					var name = this.value;
					if (!name) {
						newList.css('-webkit-transform','translate3d(-'+ window.innerWidth +'px,0,0)');
						setTimeout(function(){
							home.reset();
						}, 350);
					} else {
						setTimeout(function(){
							home.lists.push(new List(name,[]));
							home.reset();
						}, 100);
					}
				});
			
				setTimeout(function(){ //this solving transition not working problem, don't know why though
					newList.css('-webkit-transform','rotateX(0deg)');
				}, 10);
				
			}
		});
		
		home.reset();
		return home.el;
	},
	reset: function () {
		var home = this;
		if (home.lists.length > 0) {
			home.el.empty().css('top',0);
			$.each(home.lists, function(i, list) {
				home.el.append(list.renderSelf(home, i));
			});
			home.refresh();
		} else {
			home.el.html(templates.emptyHome());
		}
	},
	refresh: function () {
		var home = this;
		home.el.find('.list').each(function(i){
			$(this).css('background-color','hsl(' + (212-i*3) + ', 100%, 53%)');
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
		if (window.inAction || window.editing || window.draggingDown || document.height <= 356) {
			e.preventDefault();
		} else {
			window.globalDrag = true;
		}
	})
	.bind('touchend touchcancel', function(e){
		window.globalDrag = false;
	});
	
	var app = new Home([
		new List($.os.ios ? 'Hello':'This works better on iOS', [
			new Todo('Swipe right to complete'),
			new Todo('Swipe left to delete'),
			new Todo('Tap on text to edit'),
			new Todo('Long tap to change order'),
			new Todo('Drag down to add new'),
			new Todo('Pinch in to go back.')
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
	
	app.render().appendTo('#wrapper');
	
});