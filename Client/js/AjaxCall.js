function ajaxCall(method, api, data, successCB, errorCB) {
  console.log(`Making ${method} request to ${api}`);
  console.log("Request data:", data);

  $.ajax({
    type: method,
    url: api,
    data: data,
    cache: false,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    timeout: 60000, // 60 seconds timeout
    headers: {
      "Content-Type": "application/json",
    },
    success: function (response, textStatus, jqXHR) {
      console.log("AJAX Success:", response);
      console.log("Status:", textStatus);
      if (successCB) successCB(response);
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error("AJAX Error:");
      console.error("Status:", textStatus);
      console.error("Error:", errorThrown);
      console.error("Response:", jqXHR.responseText);
      console.error("Status Code:", jqXHR.status);

      const errorInfo = {
        status: jqXHR.status,
        statusText: jqXHR.statusText || textStatus,
        responseText: jqXHR.responseText,
        message: errorThrown || "Unknown error",
      };

      if (errorCB) errorCB(errorInfo);
    },
  });
}
