//Generating Custom Universally Unique Identifier(UUID)
function uuid(t){

	function myTrim(x){
		return x.replace(/\s/gm,'');
	}
	function pad(x){
		while(x.length < 4){
			x += Math.floor(Math.random()).toString();
		}
		return x;
	}
	function fun(){
		return Math.random().toString(36).slice(2);
	}

	squeezer = myTrim(t);
	if(squeezer.length < 4){
		squeezer = pad(squeezer);
	}
	return squeezer.substring(0,4) + "_" + fun()+ "-" + fun() + "-" + fun() + fun();
}

// Recognize URLs in the text
function urlify(text){
	let regex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
	return text.replace(regex,function(url){
		return '<a href="'+ url +'"  target = "_blank">'+ url + '</a>';
	});

}

//
function createRow(todo){
	let row = $("<div class = 'todo-row'></div>");
	let item = $(
		"<input id = 'tick' type = 'checkbox'>" +
		"</input>" +
		"<span class = 'todo-task'>" +
		todo.task +
		"</span>"
	);

	row = row.append(item);

	if(todo.completeStatus){
		$(row).find("input").prop('checked',true);
		$(row).find("span").css({
			"text-decoration": "line-through",
			"color": "green"
		});
	}
	else{
		$(row).find("input").prop('checked',false);
		$(row).find("span").css({
			"text-decoration":"none",
			"color": "black"
		});
	}

	row.find("input").click(function(){
		let id = todo.id;
		todo.completeStatus = !todo.completeStatus;
		if(todo.completeStatus){
			$(row).find("input").prop('checked',true);
			$(row).find("span").css({
				"text-decoration": "line-through",
				"color": "green"
			});
		}
		else{
			$(row).find("input").prop('checked',false);
			$(row).find("span").css({
				"text-decoration":"none",
				"color": "black"
			});
		}

		chrome.storage.sync.get(["catalog"],(result) => {
			let todos = result.catalog;
			let index = -1;
			for(let i=0; i<todos.length; i++){
				if(todos[i].id === id){
					index = i;
					break;
				}
			}
			console.log("index",index);

			todos.splice(index,1);
			todos.splice(index,0,todo);

			chrome.storage.sync.set({"catalog":todos},() => {
				console.log("Status updated");
			});
		});
	});

	let delTask = $(
		"<button type = 'submit' class = 'del-task-btn'>" +
		"<i class='material-icons'>close</i>"+ 	
		"</button>"
		).click(function(){
		let id = todo.id;
		chrome.storage.sync.get(["catalog"],(result) => {
			let todos = result.catalog;
			let index = -1;
			for(let i=0; i<todos.length; i++){
				if(todos[i].id === id){
					index = i;
					break;
				}
			}
			todos.splice(index,1);
			let todolist = $("#show-tasks");
			todolist.empty();
			todos.forEach(function(todo){
				let todoRow = createRow(todo);
				todolist.append(todoRow);
			});

			chrome.storage.sync.set({"catalog":todos},() => {
				console.log("task deleted");
			});
		});
	});
		
	return row.append(delTask);
}

$(document).ready(function(){

	// retrieve saved todos
	chrome.storage.sync.get(["catalog"],(result) => {
		let todolist = $("#show-tasks");
		let savedTodos = result.catalog;
		if(savedTodos === undefined){
			savedTodos = [];
		}
		savedTodos.forEach(function(todo){
			let todoRow = createRow(todo);
			todolist.append(todoRow);
		});
	});

	// save new task
	$(".todo-form").submit(function(e){
		e.preventDefault();
		let taskData = $("#task").val();
		taskData = taskData.trim();
		taskData = urlify(taskData);
		if(taskData === ""){
			return;
		}
		let d = new Date();
		let newTask = {
			"id": uuid(taskData),
			"task": taskData,
			"completeStatus": false,
			"timestamp": d.getTime()
		};

		let todolist = $("#show-tasks");
		let todoRow = createRow(newTask);			

		chrome.storage.sync.get(["catalog"],(result) => {
			let todos = result.catalog;
			if(todos === undefined){
				todos = []
			}
			console.log("newTask id",newTask.id);
			console.log("new task",newTask.task);
			if(todos.length > 1){
				if(todos[0].timestamp > todos[1].timestamp){
					todolist.prepend(todoRow);
					todos.unshift(newTask);
				}
			}
			else{
				todolist.append(todoRow);
				todos.push(newTask);
			}
			chrome.storage.sync.set({"catalog":todos}, () => {
				console.log(todos.length);
			});
		});
		
		$("#task").val("");
	});

	// clear completed tasks
	$("#clear-completed-tasks .done-btn").click(function(){
		chrome.storage.sync.get(["catalog"],(result) => {
			let todos = result.catalog;
			if(todos === undefined){
				return;
			}
			console.log(todos);
			let i = 0;
			while(i<todos.length){
				if(todos[i].completeStatus){
					console.log(i,todos[i].task,todos[i].completeStatus);
					todos.splice(i,1);
				}
				else
					i++;
			}
			let todolist = $("#show-tasks");
			todolist.empty();
			todos.forEach(function(todo){
				let todoRow = createRow(todo);
				todolist.append(todoRow);
			});
			chrome.storage.sync.set({"catalog":todos}, () =>{
				console.log("completed tasks deleted");
			});
		});
	});

	// clear all tasks
	$("#clear-tasks .del-btn").click(function(){
		chrome.storage.sync.remove(["catalog"],function(){
		 var error = chrome.runtime.lastError;
		    if (error) {
		        console.error(error);
		    }
		});
		$("#show-tasks").empty();
	});

	// apply filters
	$("#sort-old").click(function(){
		chrome.storage.sync.get(["catalog"], (result) => {
			let todos = result.catalog;
			todos.sort((a,b) => {
				if(a.timestamp > b.timestamp)
					return 1;
				else if (a.timestamp < b.timestamp)
					return -1;
				return 0;
			}); 

			let todolist = $("#show-tasks");
			todolist.empty();
			todos.forEach(function(todo){
				let todoRow = createRow(todo);
				todolist.append(todoRow);
			});

			chrome.storage.sync.set({"catalog":todos}, () =>{
				console.log("sorted oldest first");
			});
		})
	});

	$("#sort-new").click(function(){
		chrome.storage.sync.get(["catalog"], (result) => {
			let todos = result.catalog;
			todos.sort((a,b) => {
				if(a.timestamp > b.timestamp)
					return -1;
				else if (a.timestamp < b.timestamp)
					return 1;
				return 0;
			});

			let todolist = $("#show-tasks");
			todolist.empty();
			todos.forEach(function(todo){
				let todoRow = createRow(todo);
				todolist.append(todoRow);
			});

			chrome.storage.sync.set({"catalog":todos}, () =>{
				console.log("sorted newest first");
			}); 
		})
	});
});

