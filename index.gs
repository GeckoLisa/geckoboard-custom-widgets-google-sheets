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
  for (var i = 0; i < widgetRows.length; i++) {
    var widget;
    if (widgetRows[i + 1] === undefined) {
      widget = data.slice(widgetRows[i]);
    } else {
      var widget = data.slice(widgetRows[i], widgetRows[i + 1]);
    }
    widgets = widgets.concat([widget]);
  }
  return widgets;
}
               
function findWidgets(rows) {
  var widgetIndexii = [];
  var column = rows.map(function(row) {
    return row[0];
  });
  for (var i = 0; i < column.length; i++) {
    if (column[i] === 'Widget') {
      widgetIndexii = widgetIndexii.concat(i);
    }
  }
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
    MAP: function(items) {
      return {
        points: {
          point: items.map(function(item) {
            var latitude = item[0];
            var longitude = item[1];
            var size = item[2];
            var color = item[3];
            var point = {
              latitude: latitude,
              longitude: longitude,
            }
            if (size) {
              point.size = size;
            }
            if (color) {
              point.color = color;
            }
          })
        }
      }
    },
  };
  return types[type](data);
}
