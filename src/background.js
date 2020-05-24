function setNotifications(todos){
	if(todos === undefined){
		todos = [];
	}
	let tasksRemaining = 0;

	for(let i=0; i<todos.length; i++){
		if(!todos[i].completeStatus){
			tasksRemaining++;
		}
	}
	chrome.browserAction.setBadgeText({ text: tasksRemaining.toString()}, () => {
		console.log("badge set done");
	});

	if(tasksRemaining)
		chrome.browserAction.setBadgeBackgroundColor({color: "#ff5050"});
	else
		chrome.browserAction.setBadgeBackgroundColor({color: "#11d990"});

}

chrome.storage.sync.get(["catalog"],(result) => {
	let todos = result.catalog;
	setNotifications(todos);
});

chrome.storage.onChanged.addListener((data, areaName) => {
	console.log("storage type: ",areaName);
	console.log(data);

	let changedTodos = data.catalog.newValue;
	setNotifications(changedTodos);
})