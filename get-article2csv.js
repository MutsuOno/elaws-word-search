'use strict'

const fs = require('fs');
const request = require('sync-request');
const sleep = require('sleep');
const cheerio = require('cheerio');
const csv= require('csv-stringify');


doTask();


function doTask() {
    var import_csv = 'list.csv';
    var export_csv = 'articles.csv'; 
    var export_arr = [[]];

    var csv = readCSV(import_csv);

    for (var i = 0; i < csv.length; i++) {
        var law_name = csv[i][1];
        var law_num = csv[i][2];
        var article = articleToInt(csv[i][3]);
        console.log(i+' '+law_name+' '+law_num+' '+article);

        var hourei = getHourei(law_num, article);
        var content_with_name = insertLawName(hourei, law_name);
    
        var $ = cheerio.load(content_with_name, { xmlMode: true });
        $("ApplData").each(function(i, el) {
            var name = $(this).children("lawName").text(); // 法令名
          
            $("Article").each(function(i, el) {
                var article = $(this).children("ArticleTitle").text(); // 条番号

                if (article != "") {
                    $("Paragraph").each(function(i, el) {
                        var pNum = $(this).children("ParagraphNum").text(); // 項番号
                        var content = $(this).children().nextAll().text().replace(/^\s+\n/gm,''); // 項以下をテキストで取得&空白行を削除
    
                        if (content != "" && content.indexOf('自転車') != -1) {
                            // console.log(name + " : " + article+pNum + " : " + content);
                            var arr = [content, name, article+pNum];
                            export_arr.push(arr);
                        }
                    }); 
                }
            });
        });
        
        sleep.sleep(5);

    }

    saveCSV(export_csv, export_arr);

}


function saveCSV(path, arr) {
    const header = ['content', 'name', 'article'];
    const rows = arr;
  
    csv([header,...rows], (_err, output) => {
        fs.appendFile(path, output, function(err){
            if (err) console.log(err);
        });
    })
}

function readCSV(file) {
    var csv = fs.readFileSync(file, 'utf8', function (err, text) {
        if(err) {
            console.log(err.message);
            return;
        }
    });
    return parseCSV(csv);
}

function writeFile(file, text) {
    fs.appendFile(file, text, function(err){
        if (err) console.log(err);
    });
}

function getHourei(law, article) {
    var url = 'http://elaws.e-gov.go.jp/api/1/articles';
    var param = ';lawNum=' + encodeURIComponent(law) + ';article=' + article;
    var res = request('GET', url+param);
    var body = res.getBody('utf8');
    
    return body;
}

function parseCSV(str, delimiter){
    if(!delimiter) delimiter = ","
    return str.split('\n').reduce(function(table,row){
        if(!table) return;
        table.push(
            row.split(delimiter).map(function(d){ return d.trim() }) //余白削除
        );
        return table;
    }, []);
}

function articleToInt(str) {
    var int_a = "";
    var a = str;
    if (a.split('の').length-1 == 0) {
        var t = a.replace('第', '').replace('条', '');
        var sep = [];
        for (var j = 0; j < t.length; j++) {
            sep.push(t.charAt(j));
        }
        int_a = ktoi(sep);
    } else {
        var t_array = a.replace('第', '').replace('条', '').split('の');
        var sep = [];
        for (var j = 0; j < t_array.length; j++) {
            sep[j] = [];
            for (var k = 0; k < t_array[j].length; k++) {
                sep[j][k] = t_array[j].charAt(k);
            }
            int_a += ktoi(sep[j]);
            if (j != t_array.length-1) {
                int_a += '-';
            }
        }
    }
    return int_a;
}

function removeHeader(text) {
    var content = text.replace('<?xml version="1.0" encoding="UTF-8"?>','')
        .replace('<DataRoot>','')
        .replace('</DataRoot>','')
        .replace(/^\n/gm,''); // 空行

    return content;
}

function insertLawName(text, name) {
    var pos = text.indexOf('<LawNum>');
    var total = insertStr(text, pos, '<lawName>'+name+'</lawName>\n');

    return total;
}

function insertStr(str, index, insert) {
    return str.slice(0, index) + insert + str.slice(index, str.length);
}

// http://sm.2-d.jp/ktoi.js
function ktoi(kanji){
	var taisu = new Array("万","億","兆","京","垓","?","?","穣","溝","澗","正","載","極","恒河沙","阿僧祇","那由他","不可思議");
	var ttoa = new Array(4,8,12,16,20,24,24,28,32,36,40,44,48,52,56,60,64);
	var keta = new Array("十","百","千");
	var kansu = new Array("一","二","三","四","五","六","七","八","九","〇");
	var girisha = new Array(1,2,3,4,5,6,7,8,9,0);

	var zero=new Array();
	var zeroCounter=0;

	var suuchi=new Array();
	var suuchiCounter=0;

	var total=0;
	for(i=0;i<kanji.length;i++){
		if(zero[zeroCounter]==null){zero[zeroCounter]=0;}
		if(suuchi[suuchiCounter]==null){suuchi[suuchiCounter]=0;}
		//一二三四五六七八九〇
		for(v=0;v<kansu.length;v++){
			if(kanji[i]==kansu[v]){
				zero[zeroCounter]=zero[zeroCounter]+girisha[v];
				if(kanji[i+1]!=null&&kanji[i+1].match(/[一二三四五六七八九〇]/)){
					zero[zeroCounter]=zero[zeroCounter]*10;
				}
			}
		}
		//１０，１００，１０００
		for(v=0;v<keta.length;v++){
			if(kanji[i]==keta[v]){
				if(zero[zeroCounter]==0||zero[zeroCounter]==null){
					zero[zeroCounter]=1;
				}
				zero[zeroCounter]=zero[zeroCounter]*Math.pow(10,(v)+1);
				zeroCounter++;
			}
		}
        //万億…
        var v;
		for(v=0;v<taisu.length;v++){
			if(kanji[i]==taisu[v]){
				if(suuchi[suuchiCounter]==0||suuchi[suuchiCounter]==null){
					suuchi[suuchiCounter]=1;
				}
				var oku=0;
				var x=0;
				while(zero[x]!=null){
					oku+=zero[x];
					x++;
				}
				suuchi[suuchiCounter]=oku*Math.pow(10,ttoa[v]);
				suuchiCounter++;
				zeroCounter=0;
				zero=new Array();
			}
		}		
	}
	if(kanji[kanji.length-1].match(/[一二三四五六七八九〇十百千]/)){
		var i=0;
		while(zero[i]!=null){
			total+=zero[i];
			i++;
		}
	}
	for(i=0;i<suuchi.length;i++){total+=suuchi[i];}
	
	return total;
}