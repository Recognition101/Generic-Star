XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
    function byteValue(x) {
        return x.charCodeAt(0) & 0xff;
    }
    var ords = Array.prototype.map.call(datastr, byteValue);
    var ui8a = new Uint8Array(ords);
    this.send(ui8a.buffer);
};

function runAjax(parameters, callback, url, contentType, asBinary, progress) {
	if (url === undefined || url === null) url = "action";
	
	if (contentType === undefined || contentType === null) {
		contentType = "application/x-www-form-urlencoded";
	}
	if (asBinary === undefined || asBinary === null) asBinary = false;
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
			callback(xmlhttp.responseText);
		}
	};
	
	if (progress !== undefined && progress !== null) {
		xmlhttp.upload.addEventListener("progress", progress, false);
		xmlhttp.upload.onprogress = progress;
	}
	
	xmlhttp.open("POST", "../../"+url, true);
	xmlhttp.setRequestHeader("content-type", contentType);
	if (!asBinary) {
		xmlhttp.send(JSON.stringify(parameters));
	} else {
		xmlhttp.sendAsBinary(parameters);
	}
}

self.addEventListener('message', function(e) {
	var data = e.data;
	
	runAjax(data.bindata, function(resp) {
		self.postMessage({progress: 1, response: resp});
		
	}, data.url, data.ct, true, function(e) {
		
		if (e.lengthComputable) {
			var percentComplete = e.loaded / e.total;
			self.postMessage({progress: percentComplete, response: null});
		}
	});
}, false);