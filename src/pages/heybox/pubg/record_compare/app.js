var Filter = require('./filter')
var Highcharts = require('highcharts')
var render = require('./content.art')
var fly = require('flyio')
var {getRecords} = require('./utils')
require('highcharts/modules/exporting')(Highcharts)
var HighchartsMore = require('highcharts/highcharts-more')
HighchartsMore(Highcharts)

class App extends Filter {
  constructor (myRecord, otherRecord) {
    // new 的时候不运行方法，只绑定模板过滤器，以免方法有错，页面加载不出来
    super(myRecord, otherRecord)
    this.store = {}
    this.pageRendHandler([this.myData, this.otherData])
  }
  initApp () {
    // 在渲染html完成后调用
    this.bindEles()
    this.storeInfoInit()
    this.setRadar()
    this.selectHandler()
  }
  bindEles () {
    this.$eSelect = $('.server')
  }
  pageRendHandler (pageData) {
    let restult = {
      data: pageData
    }
    $('#app').html(render(restult))
  }
  _storeDataHandler (dataArr) {
    if (dataArr) {
      for (let data of dataArr) {
        let {player_info: {nickname}, player_info: {best_rating_region: server }} = data
        if (!this.store.users) {
          this.store.users = []
        }
        this.store.users.push(nickname)
        if (!this.store[nickname]) {
          this.store[nickname] = {}
        }
        this.store[nickname][server] = data
      }
    }
  }
  storeInfoInit () {
    this._storeDataHandler.call(this, [this.myData, this.otherData])
  }
  storeAddValue (user, server, data) {
    this.store[user][server] = data
  }
  setSelectOption (index, server) {
    var serverTrans = {
      'as': '亚洲',
      'oc': '澳洲',
      'sa': '南美',
      'eu': '欧洲',
      'na': '北美',
      'sea': '东南亚',
      'krjp': '日韩'
    }
    this.$eSelect = $('.server')
    this.$severName = $('.sever-name')
    this.$severName.eq(index).text(serverTrans[server])
    var $options = this.$eSelect.eq(index).find('option')
    for (let i = 0; i < $options.length; i++) {
      if ($options.eq(i).prop('value') === server) {
        $options.eq(i).prop('selected', 'selected')
        return ''
      }
    }
  }
  // 选择完服务器之后做的工作
  selectAfter (index, data, server) {
    let pageData = this.pageDataHandler(index, data)
    this.pageRendHandler(pageData)
    // 渲染完成后 需要绑定select的change函数
    this.selectHandler()
    this.setSelectOption(index, server)
    this.setRadar()
  }
  selectHandler () {
    this.$eSelect = $('.server')
    var users = this.store.users
    var params = []
    for (let user of users) {
      params.push({nickname: user})
    }
    var self = this
    this.$eSelect.change(function () {
      var index = $(this).data('index')
      var user = $(this).data('user')
      var server = $(this).prop('value')
      var data = self.isDataExist(user, server)
      if (data) {
        self.selectAfter.call(self, index, data, server)
      } else {
        params[index].region = server
        fly.get(getRecords(params[index]))
          .then(res => {
            let {data: {result: data}} = res
            self.storeAddValue(user, server, data)
            self.selectAfter(index, data, server)
          })
      }
      return [$('.server').eq(0).prop('value'), $('.server').eq(1).prop('value')]
    })
  }
  pageDataHandler (index, newData) {
    // index select对应的index, newData 改变的数据 oldData 不变的数据
    var result = [newData]
    var oldIndex = ~~!Boolean(index)
    var oldUser = this.$eSelect.eq(oldIndex).data('user')
    var oldServer = this.$eSelect.eq(oldIndex).prop('value')
    var oldData = this.store[oldUser][oldServer]
    if (Boolean(index)) {
      result.unshift(oldData)
    } else {
      result.push(oldData)
    }
    return result
  }
  isDataExist (user, server) {
    return this.store[user][server]
  }
  radarServerInit () {
    var arr = []
    for (let users of this.store.users) {
      arr.push(Object.keys(this.store[users])[0])
    }
    return arr
  }
  radarDataHandler (users, servers) {
    var result = []
    let radarScore = []
    for (let [index, user] of users.entries()) {
      radarScore.push(this.store[user][servers[index]].radar_score)
    }
    for (let [index, scores] of radarScore.entries()) {
      result[index] = []
      if (!scores) {
        result[index] = [0, 0, 0, 0, 0]
      } else {
        for (let {key, value} of scores) {
          result[index].push(value - 0)
        }
      }
    }
    return result
  }
  setRadar (servers) {
    if (!servers) {
      servers = this.radarServerInit()
    }
    let users = this.store.users
    let [user1, user2] = users
    var serissStore = this.radarDataHandler(users, servers)
    var series = serissStore[0]
    var series2 = serissStore[1]

    var float = ['center', 'left', 'left', 'right', 'right']
    var categories = ['生存评分', '胜率评分', '支援评分', '战斗评分', 'RATING评分']
    Highcharts.chart('radar', {
      chart: {
        type: 'polygon',
        polar: true,
        backgroundColor: 'transparent',
        spacing: [0, 0, 0, 0],
        className: 'chart-class',
        marginTop: 17
      },
      title: {
        text: null
      },
      credits: {
        enabled: false
      },
      pane: {
        size: '68%',
        startAngle: 0,
        endAngle: 360,
        center: ['50%', '50%']
      },
      xAxis: {
        tickmarkPlacement: 'on',
        lineWidth: 0,
        max: 5,
        gridLineColor: 'rgba(255, 255, 255, 0.3)',
        gridLIneDashStyle: 'solid',
        gridLineWidth: 0.3,
        minTickInterval: 1,
        labels: {
          enabled: true,
          useHTML: true,
          distance: 15,
          formatter: function () {
            return `<div class="c-box">
              <div class="${float[this.value]}">${categories[this.value]}</div>
                <div class="${float[this.value]}">
                <font color="#00beff">${series[this.value]}</font>/<font color="#afe211">${series2[this.value]}</font>
                </div>
              </div>`
          }
        }
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0,
        max: 100,
        gridLineColor: {
          linearGradient: [0, 20, 40, 70, 100],
          stops: [
            [0, 'rgba(255, 255, 255, 0.5)'],
            [1, 'rgba(142, 147, 152, 0.5)']
          ]
        },
        gridLIneDashStyle: 'solid',
        gridLineWidth: 0.3,
        tickAmount: 5,
        labels: {
          enabled: false
        }
      },
      legend: {
        floating: true,
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        squareSymbol: true,
        symbolRadius: 0,
        symbolPadding: 6,
        y: 12,
        itemMarginBottom: 10,
        symbolHeight: 11,
        reversed: true,
        itemStyle: {"color": "#fff","font-family": "SFUIText", "font-size": "10px"}
      },
      navigation: {
        buttonOptions: {
          enabled: false
        }
      },
      series: [
        {
          name: user1,
          data: series,
          pointPlacement: 'on',
          pointInterval: 1,
          color: {
            linearGradient: [0, 20, 40, 70, 100],
            stops: [
              [0, 'rgba(0,190,255,0.5)'],
              [1, 'rgba(0,129,255,0.5)']
            ]
          },
          lineWidth: 0,
          enableMouseTracking: false,
          marker: {
            lineWidth: 0,
            radius: 0
          }
        },
        {
          name: user2,
          data: series2,
          pointPlacement: 'on',
          pointInterval: 1,
          color: {
            linearGradient: [0, 20, 40, 70, 100],
            stops: [
              [0, 'rgba(175,226,17,0.5)'],
              [1, 'rgba(106,202,63,0.5)']
            ]
          },
          lineWidth: 0,
          enableMouseTracking: false,
          marker: {
            lineWidth: 0,
            radius: 0
          }
        }
      ]
    })
  }
}

module.exports = App
