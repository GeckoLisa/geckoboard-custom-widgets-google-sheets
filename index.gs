function main() {
  var data = getRows();
  pusher(data.key, data.widgets);
}

function pusher(key, widgets) {
  widgets.forEach(function(widget) {
    var widgetURL = "https://push.geckoboard.com/v1/send/" + widget.key;
    var payload = {
      "api_key": key,
      "data": widget.data
    }
    var options = {
      "method" : "post",
      "contentType": "application/json",
      "payload" : payload
    };
    options.payload = JSON.stringify(options.payload);
    Logger.log(options);
    UrlFetchApp.fetch(widgetURL, options);
  });
}

function getRows() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var key = rows[0][1];
  var data = rows.slice(1);
  var widgetRows = findWidgets(data);
  var widgets = splitWidgetData(data, widgetRows);
  var payloads = makePayloads(widgets);
  return {
    key: key,
    widgets: payloads
  }
}

function makePayloads(widgets) {
  return widgets.map(function(widget) {
    var key = widget[0][1];
    var type = widget[1][1];
    var data = widgetType(type, widget.slice(2));
    return {
      key: key,
      data: data
    }
  });
}

function splitWidgetData(data, widgetRows) {
  var widgets = [];
  widgetRows.forEach(function(_, i) {
    if (widgetRows[i + 1]) {
      widgets.push(
        data.slice(widgetRows[i], widgetRows[i + 1])
      );
    } else {
      widgets.push(
        data.slice(widgetRows[i])
      );
    }
  });
  return widgets;
}
               
function findWidgets(rows) {
  var widgetIndexii = [];
  var column = rows.map(function(row) {
    return row[0];
  });
  column.forEach(function(row, i) {
    if (row === 'Widget') {
      widgetIndexii.push(i);
    }
  });
  return widgetIndexii;
}

function widgetType(type, data) {
  var types = {
    RAG: function(items) {
      return { 
        item: items.map(function(item) {
          return { 
            value: item[0],
            text: item[1]
          }
        })
      }
    },
    LIST: function(items) {
      return items.map(function(item) {
        var bit = { title: { text: item[0] } };
        if (typeof item[1] !== undefined) {
          bit.label = {};
          bit.label.name = item[1];
        }
        if (typeof item[2] !== undefined) {
          bit.label.color = item[2];
        }
        if (typeof item[3] !== undefined) {
          bit.description = item[3];
        }
        return bit;
      });
    },
    FUNNEL: function(items) {
      var itemList = items.map(function(item) {
        return {
          value: item[0],
          label: item[1]
        } 
      })
      var obj = { item: itemList };
      if (items[0][2] == 'percentage' && items[0][3] == 'hide') {
        obj.percentage = 'hide';
      }
      return obj;
    },
    PIE: function(items) {
      var slices = {
        item: items.map(function(slice) {
          return {
            value: slice[0],
            label: slice[1],
            color: slice[2],
          }
        })
      }
      return slices;
    },
    TEXT: function(items) {
      return { 
        item: items.map(function(item) {
          return { 
            text: item[0],
            type: item[1] || 0,
          }
        })
      }
    },
    MONITORING: function(items) {
      var item = items[0];
      return { 
        status: item[0],
        downTime: item[1] || '',
        responseTime: item[2] || 0,
      } 
    },
  };
  return types[type](data);
}
