elaws-word-search
====
[e-Gov法令検索](http://elaws.e-gov.go.jp/search/elawsSearch/elaws_search) を指定した単語で検索してその単語が含まれる条文の一覧を取得し, [法令API](http://www.e-gov.go.jp/elaws/interface_api/index.html) を利用してそれらの条文の内容を取得します


```bash
# 法令名,法令番号,条番号の取得 -> list.csv
$ casperjs get-list.js 自転車

# list.csvを元に条文の内容をxmlで取得 -> articles.xml
$ node get-article.js

# list.csvを元に条文の内容をcsvで取得(引数に指定した単語を含む項のみ出力. 指定しない場合はすべて出力) -> articles.csv
$ node get-article2csv.js 自転車
```