const API_URL = "https://script.google.com/macros/s/AKfycbzsBlbmfyzecmKurNXbyz4oFCEvV9y472P4xbiba-gvE9a3yOSmzNHvF_aSe0HEMrt0/exec";
const API_TOKEN = "CONGLENH_TANHIEP_2026";

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

  window[cbName] = function (response) {
    clearTimeout(timeout);
    callback(response);
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

function showScreen(id, btn) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));

  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const titles = {
    home: "Trang chủ",
    cap: "Cấp công lệnh",
    nhatky: "Nhật ký"
  };

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.innerText = titles[id] || "Công lệnh";

  if (id === "home") taiDashboard();
  if (id === "nhatky") taiBaoCao();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function taiDashboard() {
  goiApi("dashboard", {}, function (res) {
    if (!res || !res.ok) {
      document.getElementById("soCuoi").innerText = "Lỗi";
      document.getElementById("soTiepTheo").innerText = "Lỗi";
      document.getElementById("tongCongLenh").innerText = "Lỗi";
      return;
    }

    document.getElementById("soCuoi").innerText = res.data.soCuoi || 0;
    document.getElementById("soTiepTheo").innerText = res.data.soTiepTheo || 1;
    document.getElementById("tongCongLenh").innerText = res.data.tongCongLenh || 0;
  });
}

function capCongLenh() {
  const ketqua = document.getElementById("ketqua");

  const params = {
    dongChi: document.getElementById("dongChi").value.trim(),
    tuoi: document.getElementById("tuoi").value.trim(),
    chucVu: document.getElementById("chucVu").value.trim(),
    diTu: document.getElementById("diTu").value.trim(),
    den: layNoiDen(),
    noiDung: document.getElementById("noiDung").value.trim(),
    ngayDi: document.getElementById("ngayDi").value,
    ngayVe: document.getElementById("ngayVe").value,
    phuongTien: document.getElementById("phuongTien").value.trim(),
    giayTo: document.getElementById("giayTo").value.trim(),
    phongKhu: document.getElementById("phongKhu").value
  };

  if (!params.dongChi || !params.chucVu || !params.diTu || !params.den || !params.noiDung || !params.ngayDi || !params.ngayVe || !params.phuongTien) {
    ketqua.style.display = "block";
    ketqua.innerHTML = "❌ Vui lòng nhập đầy đủ thông tin bắt buộc.";
    return;
  }

  ketqua.style.display = "block";
  ketqua.innerHTML = "⏳ Đang xuất công lệnh PDF...";

  goiApi("xuat", params, function (res) {
    if (!res || !res.ok) {
      ketqua.innerHTML = "❌ " + ((res && res.message) ? res.message : "Xuất công lệnh thất bại.");
      return;
    }

    ketqua.innerHTML =
      "✅ " + res.message +
      "<br><br><a class='link-btn' href='" + res.data.linkFile + "' target='_blank'>📄 Mở file PDF</a>" +
      "<br><button class='share-btn' onclick=\"chiaSePdf('" + res.data.linkFile + "', '" + res.data.tenFile + "')\">📲 Chia sẻ qua Zalo</button>";

    resetForm();
    taiDashboard();
    taiBaoCao();
  });
}

function resetForm() {
  document.getElementById("dongChi").value = "";
  document.getElementById("tuoi").value = "";
  document.getElementById("chucVu").value = "";
  document.getElementById("diTu").value = "TTBTXH Tân Hiệp";
  document.getElementById("denSelect").selectedIndex = 0;
document.getElementById("denKhac").value = "";
document.getElementById("denKhac").style.display = "none";
  document.getElementById("noiDung").value = "";
  document.getElementById("ngayDi").value = "";
  document.getElementById("ngayVe").value = "";
  document.getElementById("phuongTien").value = "";
  document.getElementById("giayTo").value = "";
  document.getElementById("phongKhu").selectedIndex = 0;
  document.getElementById("dongChi").focus();
}

function chiaSePdf(link, tenFile) {
  if (navigator.share) {
    navigator.share({
      title: tenFile || "Công lệnh",
      text: "File công lệnh PDF",
      url: link
    });
  } else {
    navigator.clipboard.writeText(link);
    alert("Đã sao chép link PDF. Anh dán vào Zalo để gửi.");
  }
}

function taiBaoCao() {
  const box = document.getElementById("baoCaoList");
  if (!box) return;

  box.innerHTML = "⏳ Đang tải báo cáo...";

  goiApi("baocao", {}, function (res) {
    if (!res || !res.ok) {
      box.innerHTML = "❌ " + ((res && res.message) ? res.message : "Không tải được báo cáo.");
      return;
    }

    if (!res.data || res.data.length === 0) {
      box.innerHTML = "<div class='empty'>Chưa có dữ liệu công lệnh.</div>";
      return;
    }

    let html = "";

    res.data.forEach(function (phong, i) {
      const phongId = "phong_" + i;

      html += `
        <div class="report-group">
          <div class="report-title" onclick="toggleBox('${phongId}')">
            <b>📁 ${phong.phongKhu}</b>
            <span>${phong.tong} công lệnh</span>
          </div>

          <div id="${phongId}" class="report-body" style="display:none;">
      `;

      phong.nhanSu.forEach(function (ns, j) {
        const nsId = "ns_" + i + "_" + j;

        html += `
          <div class="person-row" onclick="toggleBox('${nsId}')">
            <b>👤 ${ns.dongChi}</b>
            <span>${ns.tong} công lệnh</span>
          </div>

          <div id="${nsId}" class="person-detail" style="display:none;">
        `;

        ns.danhSach.forEach(function (cl, k) {
          const clId = "cl_" + i + "_" + j + "_" + k;

          html += `
            <div class="cl-row" onclick="toggleBox('${clId}')">
              <b>CL ${cl.soCongLenh}</b>
              <small>${cl.den || ""} | ${cl.ngayDi || ""} - ${cl.ngayVe || ""}</small>
            </div>

            <div id="${clId}" class="cl-detail" style="display:none;">
              <p><b>Đi từ:</b> ${cl.diTu || ""}</p>
              <p><b>Đến:</b> ${cl.den || ""}</p>
              <p><b>Nội dung:</b> ${cl.noiDung || ""}</p>
              <p><b>Ngày đi:</b> ${cl.ngayDi || ""}</p>
              <p><b>Ngày về:</b> ${cl.ngayVe || ""}</p>
              <p><b>Phương tiện:</b> ${cl.phuongTien || ""}</p>
              <p><b>Giấy tờ:</b> ${cl.giayTo || ""}</p>
              <p><a href="${cl.linkFile || "#"}" target="_blank">📄 Mở PDF</a></p>
            </div>
          `;
        });

        html += `</div>`;
      });

      html += `
          </div>
        </div>
      `;
    });

    box.innerHTML = html;
  });
}

function toggleBox(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
}

window.addEventListener("load", function () {
  taiDashboard();
  kiemTraPhienBan();

  setInterval(function () {
    taiDashboard();
    kiemTraPhienBan();
  }, 15000);
});
function xuLyNoiDenKhac() {
  const denSelect = document.getElementById("denSelect");
  const denKhac = document.getElementById("denKhac");

  if (denSelect.value === "Khác") {
    denKhac.style.display = "block";
    denKhac.focus();
  } else {
    denKhac.style.display = "none";
    denKhac.value = "";
  }
}

function layNoiDen() {
  const denSelect = document.getElementById("denSelect").value;
  const denKhac = document.getElementById("denKhac").value.trim();

  return denSelect === "Khác" ? denKhac : denSelect;
}
const LOCAL_APP_VERSION = "2.0.0";

function kiemTraPhienBan() {
  goiApi("version", {}, function(res) {
    if (!res || !res.ok || !res.data) return;

    const serverVersion = res.data.version;
    const updateBox = document.getElementById("updateBox");
    const updateText = document.getElementById("updateText");

    if (serverVersion && serverVersion !== LOCAL_APP_VERSION) {
      if (updateText) {
        updateText.innerText = "Phiên bản mới: " + serverVersion;
      }

      if (updateBox) {
        updateBox.style.display = "flex";
      }
    }
  });
}

function capNhatUngDung() {
  const url = window.location.origin + window.location.pathname + "?v=" + Date.now();
  window.location.replace(url);
}
