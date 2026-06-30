const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";

function goiApi(action, params, callback) {
  const cbName = "cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

  params = params || {};
  params.action = action;
  params.token = API_TOKEN;
  params.callback = cbName;

  const query = Object.keys(params)
    .map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    })
    .join("&");

  const script = document.createElement("script");
  script.src = API_URL + "?" + query;

  const timer = setTimeout(function() {
    callback({ ok: false, message: "Quá thời gian kết nối Apps Script." });
    delete window[cbName];
    script.remove();
  }, 300000);

  window[cbName] = function(res) {
    clearTimeout(timer);
    callback(res);
    delete window[cbName];
    script.remove();
  };

  script.onerror = function() {
    clearTimeout(timer);
    callback({ ok: false, message: "Apps Script đang xử lý lâu hoặc mạng yếu. Vui lòng kiểm tra Sheet/Drive." });
    delete window[cbName];
    script.remove();
  };

  document.body.appendChild(script);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function(s) {
    s.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  const title = {
    home: "Trang chủ",
    cap: "Cấp công lệnh",
    nhatky: "Nhật ký"
  };

  document.getElementById("pageTitle").innerText = title[id] || "Công lệnh";
}

function taiDashboard() {
  goiApi("dashboard", {}, function(res) {
    if (!res.ok) {
      alert(res.message);
      return;
    }

    document.getElementById("soCuoi").innerText = res.data.soCuoi || "-";
    document.getElementById("soTiepTheo").innerText = res.data.soTiepTheo || "-";
    document.getElementById("tongCongLenh").innerText = res.data.tongCongLenh || "0";
  });
}

function xuatCongLenh() {
  const ketqua = document.getElementById("ketqua");
  ketqua.style.display = "block";
  ketqua.innerText = "Đang xuất công lệnh...";

  const params = {
    dongChi: document.getElementById("dongChi").value,
    tuoi: document.getElementById("tuoi").value,
    chucVu: document.getElementById("chucVu").value,
    diTu: document.getElementById("diTu").value,
    den: document.getElementById("den").value,
    noiDung: document.getElementById("noiDung").value,
    ngayDi: document.getElementById("ngayDi").value,
    ngayVe: document.getElementById("ngayVe").value,
    phuongTien: document.getElementById("phuongTien").value,
    giayTo: document.getElementById("giayTo").value
  };

  if (!params.dongChi || !params.chucVu || !params.den || !params.noiDung || !params.ngayDi || !params.ngayVe || !params.phuongTien) {
    ketqua.innerText = "Vui lòng nhập đầy đủ thông tin bắt buộc.";
    return;
  }

  goiApi("xuat", params, function(res) {
    if (!res.ok) {
      ketqua.innerText = "❌ " + res.message;
      return;
    }

    ketqua.innerHTML =
      "✅ " + res.message +
      "<br><br><a href='" + res.data.linkFile + "' target='_blank'>Mở file PDF</a>";

    taiDashboard();
  });
}

function taiNhatKy() {
  const box = document.getElementById("nhatKyList");
  box.innerHTML = "Đang tải...";

  goiApi("nhatky", {}, function(res) {
    if (!res.ok) {
      box.innerHTML = "❌ " + res.message;
      return;
    }

    if (!res.data || res.data.length === 0) {
      box.innerHTML = "Chưa có nhật ký.";
      return;
    }

    let html = "";

    res.data.forEach(function(item) {
      html += `
        <div class="log-item">
          <b>CL ${item.soCongLenh} - ${item.dongChi}</b>
          <span>Đến: ${item.den || ""}</span>
          <span>Ngày đi: ${item.ngayDi || ""}</span>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

window.addEventListener("load", function() {
  taiDashboard();
});
