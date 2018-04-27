var casper = require('casper').create();

var word = casper.cli.args;
var data = [];
var count = 1;
var end_flag = "";
var csv_string = "";

// サイトにアクセス
casper.start("http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search/lsg0100/init/");

// 「法令用語」タブをクリック
casper.then(function () {
    this.click("a[href='#tab1']");
});

// 「条文単位」にチェックを入れる
casper.then(function() {
    this.evaluate(function() {
        var unit_selector = document.querySelector('#lsg0100 > div.panel.panel-success > div.panel-body > table > tbody > tr:nth-child(2) > td:nth-child(2) > div > select');
        unit_selector.selectedIndex = 0;
        unit_selector.change();
    });
});

// 表示結果の件数を200件にする
casper.then(function() {
    this.evaluate(function() {
        var result_selector = document.querySelector('#lsg0100 > div.panel.panel-success > div.panel-body > table > tbody > tr:nth-child(3) > td:nth-child(2) > div > select');
        result_selector.selectedIndex = 3;
        result_selector.change();
    });
});

// 検索ワードを入力し、検索ボタンを押す
casper.then(function() {
	this.evaluate(function(_word){
		document.querySelector('.searchWord').value = _word;
        document.querySelector('#btn_yorei_egov').click();
	}, word);
	//this.capture('test1.png');
});

// 検索結果画面が表示されたら、データを取り出していく
casper.then(function() {
    this.waitForSelector('#main', getContent, stopScript);
});


var getContent = function() {
    // データを取得
    this.wait(3000, function() {
		console.log(count+"ページ目");
		//this.capture('test2.png');
        var elements = this.getElementsInfo('#lsg0200 > div > table tbody tr td');
        for (var i = 0; i<=elements.length-1; ++i) {
            if (i > 3) { // ヘッダを飛ばす
                data.push(elements[i]['text']);
            }
        }
    });

    // ページネーションの最後をチェック。class名がdisableだったら、データ取得を終了する
    this.wait(3000, function() {
        var ele = this.getElementsInfo('#lsg0200 > div > ul li');
        var ele_j = JSON.stringify(ele[ele.length-1]);
		end_flag = JSON.parse(ele_j)["attributes"]["class"];
        if (end_flag == "disabled") {
			stopScript();
		}
		// test
		// if (count == 2) { stopScript(); }
		
        count++;
    });
    
    // 終了フラグが立たなければ、次の画面へ
    this.thenClick('ul.pagination li a[onclick="pageChenge(\'1\')"]').then(function() {
        this.waitForSelector("#main", getContent, stopScript);
    });
};

var stopScript = function() {
    for(var i = 0; i < data.length; i++) {
        // 1行4列ごとに改行。条番号に余計なスペースが入っているのでtrimする
        if (((i+1) % 4) == 0) {
            csv_string += data[i].trim() + '\n';
        } else {
            csv_string += data[i].trim() + ",";
        }
    }
	csv_string = csv_string.slice(0,-1);
	
    require('fs').write('list.csv', csv_string);

    casper.echo("完了しました").exit();
};

// 実行
casper.run();