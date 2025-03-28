function ajaxCall(method, api, data, successCB, errorCB) {
  $.ajax({
    type: method,
    url: api,
    data: data,
    cache: false,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    headers: {
      "Content-Type": "application/json",
    },
    success: successCB,
    error: errorCB,
  });
}
