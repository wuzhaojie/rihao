var pSpace = require('pSpace');
var iconv = require('iconv-lite');
var read = require('readCsv');
var async = require('async');
var fs = require('fs');
var schedule = require("node-schedule");

//1、链接pSpace
var res = pSpace.openConn('pSpace', '127.0.0.1:8889', 'admin', 'admin888');
if (res.hasOwnProperty("errString")) {
	console.log("pSpace.openConn error:", res.errString);
} else {
	console.log("pSpace.openConn success.");
}
//2、读取测点信息
var tagList = new Array();
function readFile(done) {
	read.readCsv('./config.csv', function (err, confData) {
		if (err)
			done(err);
		else {
			var isFirst = true;
			for (var i in confData)
			{
				var tagReal = new Buffer(confData[i][0], 'binary');
				var tagAtTime = new Buffer(confData[i][1], 'binary');
				var dailyIncrement = new Buffer(confData[i][2], 'binary');
				var tag = {};
                tag.tagReal= "pSpace"+iconv.decode(tagReal, 'gbk');
				tag.tagAtTime ="pSpace"+iconv.decode(tagAtTime, 'gbk');
				tag.dailyIncrement ="pSpace"+iconv.decode(dailyIncrement, 'gbk');
				if(!isFirst){
					tagList.push(tag);
				}
				isFirst = false;
			}
			done();
		}
	});
}

//3、周期统计各个点的用电量
var valReal = {};
var valAtTime = {};
var varIncrement = {};
var isBegin = true;
function work(done) {
	for (m = 0; m < tagList.length; m++) {
		valReal = pSpace.readReal(tagList[i].tagReal);
		if(valReal.hasOwnProperty("errString")){
			done(resAtTime.errString);
		}else{
			if(isBegin)
			{
				valAtTime = pSpace.readReal(tagList[i].tagAtTime);
				isBegin = false;
			}else
			{
				var curTime = new Date();
				var curHours = curTime.getHours();
				var curMinutes = curTime.getMinutes();
				var curSeconds = curTime.getSeconds();
				if(curHours==17 && curMinutes==15 &&(curSeconds==59||curSeconds==58||curSeconds==57))
				{
					valAtTime = valReal;
					valAtTime = valReal;
				    pSpace.writeReal(tagList[i].tagAtTime,valAtTime);
				}
			}
            //存入当前时间点距离当天零点的用电量
			{
				varIncrement.value = valReal.value - valAtTime.value;
				varIncrement.time = new Date();
				varIncrement.quality = valReal.quality;
				pSpace.writeReal(tagList[i].dailyIncrement,varIncrement);
			}
		}
	}
}

async.series([
	function (done) {
		readFile(done);
	},
	function (done) {
		var d1 = done;
		(function (done) { setInterval(work, 1000, done) })(d1);
	}
], function (err, result) {
	if (err) {
		console("执行出错:", err);
	} else {
		console.log("执行成功.");
	}
});

