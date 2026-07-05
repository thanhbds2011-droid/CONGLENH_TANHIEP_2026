function goiApi(action, params, callback) {
  const cbName = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

  params = params || {};
  params.action = action;
  params.token = API_TOKEN;
  params.callback = cbName;

  const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");

  const script = document.createElement("script");
  script.src = API_URL + "?" + query;

  const timeout = setTimeout(function () {
    callback({ ok: false, message: "Apps Script xử lý quá lâu hoặc chưa phản hồi." });
    delete window[cbName];
    script.remove();
  }, 60000);

  window[cbName] = function (res) {
    clearTimeout(timeout);
    callback(res);
    delete window[cbName];
    script.remove();
  };

  script.onerror = function () {
    clearTimeout(timeout);
    callback({ ok: false, message: "Không kết nối được Apps Script." });
    delete window[cbName];
    script.remove();
  };

  document.body.appendChild(script);
}