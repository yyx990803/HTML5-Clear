var CLEAR = (function ($, window, undefined) {
	"use strict";
	
	// Utility function for class extension ==================================
	var extend = (function () {
		var F = function () {},
			prop;
		return function (child, parent, extension) {
			F.prototype = parent.prototype;
			child.prototype = new F();
			child.prototype.uber = parent.prototype;
			child.prototype.constructor = child;
			for (prop in extension) {
				if (extension.hasOwnProperty(prop))
					child.prototype[prop] = extension[prop];
			}
		}
	})();
	
	// Templates =============================================================
	var templates = {
		HomeList: function () {
			return '<ul id="home"></ul>';
		},
		HomeItem: function (list) {
			var count = list.count();
			return '<li class="list ' + (count === 0 ? 'empty' : '') + '">'
			+ '<div class="inner">'
			+ '<div class="name">' + list.name + '</div>'
			+ '<div class="count">' + count + '</div>'
			+ '</div></li>';
		},
		TodoList: function () {
			return '<ul id="listview"></ul>';
		},
		TodoItem: function (todo) {
			return '<li class="todo ' + (todo.done ? 'done' : '') + '">'
			+ '<div class="inner">'
			+ '<div class="name">' + todo.name + '<span></span></div>'
			+ '</div></li>';
		},
		newHomeItem: function (pos) {
			return '<li class="list '+ pos +'">'
			+ '<div class="inner">'
			+ '<div class="name"><input type="text" value="' + (pos === 'top' ? 'Pull to create item' : 'Tap me') + '"/></div>'
			+ '<div class="count">0</div>'
			+ '</div></li>'
		},
		newTodoItem: function (pos) {
			return '<li class="todo '+ pos +'">'
			+ '<div class="inner">'
			+ '<div class="name"><input type="text" value="' + (pos === 'top' ? 'Pull to create item' : 'Tap me') + '"/></div>'
			+ '</div></li>'
		},
		emptyTodoList: function() {
			return '<li class="addmore">Tap to add new todo</li>';
		},
		emptyHomeList: function() {
			return '<li class="addmore">Tap to add a new List</li>';
		}
	};
	
	// List base class ==========================================================
	// Serves as the base for event delegation.
	// Delegated events:
	//   tap: trigger Item.open()
	//     OR trigger Item.edit()
	//     OR trigger this.newItem('bottom')
	//   swipeLeft: drag Item, trigger Item.destroy()
	//   swipeRight: drag Item, trigger Item.complete()
	//   dragDown: drag this, trigger this.newItem('top')
	//     OR trigger this.goUp()
	//   dragUp: drag this, trigger this.clearDone()
	//     OR trigger this.goDown()
	//   pinchIn: trigger this.onPinchIn()
	//   pinchOut: trigger this.onPinchOut()
	var List = function () {};
	List.prototype = {
		init: function () {
			this.render();
			this.initEvents();
		},
		render: function () {
			this.el.html('<li>' + this.name + '</li>');
		},
		initEvents: function () {
			var self = this;
			this.el.bind('click', function () {
				self.reset();
			});
		},
		test: function () {
			console.log('uber!');
		}
	};
	
	// Item base class ==========================================================
	// Shares some common methods
	//   render()
	//   edit()
	//   destroy()
	//   complete()
	var Item = function () {};
	Item.prototype = {
		
	};
	
	// HomeList extends List ====================================================
	var HomeList = function (name, items) {
		this.name = name;
		this.items = items || [];
		this.el = $('<ul id="home"></ul>');
		this.init();
	};
	extend(HomeList, List, {
		reset: function () {
			this.name = 'RESET';
			this.render();
		},
		test: function () {
			console.log('sub!');
			this.uber.test.call(this);
		}
	});
	
	// TodoList extends List ====================================================
	var TodoList = function (name, items) {
		this.name = name;
		this.items = itesm || [];
	};
	extend(TodoList, List, {
		
	});
	
	// HomeItem extends Item ====================================================
	var HomeItem = function (name, todoList) {
		
	};
	extend(HomeItem, Item, {
		
	});
	
	// TodoItem extends Item ====================================================
	var TodoItem = function (name) {
		
	};
	extend(TodoItem, Item, {
		
	});
	
	// Expose init function =====================================================
	return {
		init: function () {
			var home = new HomeList('WTF');
			home.el.appendTo($('#wrapper'));
			window.home = home;
		}
	};
	
}(Zepto, window));

$(function () {
	CLEAR.init();
});